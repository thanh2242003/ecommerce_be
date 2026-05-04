'use strict';

const mongoose = require('mongoose');
const Order = require('../models/order.model');
const Product = require('../models/product.model');
const { cart: Cart } = require('../models/cart.model');
const Address = require('../models/address.model');
const NotificationService = require('./notification.service');
const { BadRequestError, NotFoundError } = require('../core/error.response');

class OrderService {

    /**
     * Create a new order — supports both "cart" and "buy_now" flows.
     *
     * Uses a MongoDB transaction (session) to guarantee atomicity:
     *   1. Extract shopId from product(s)
     *   2. Order document creation
     *   3. Stock deduction for every item
     *   4. Cart clearing (cart mode only)
     *
     * If any step fails the entire transaction is rolled back.
     */
    static async createOrder({ userId, type, addressId, productId, variantId, quantity }) {
        // ── Validate address ownership ──────────────────────────────
        const addressDoc = await Address.findOne({ _id: addressId, userId });
        if (!addressDoc) {
            throw new NotFoundError('Address not found or does not belong to the user');
        }

        // Snapshot receiver info from Address — frozen at order time
        const { receiverName, receiverPhone, address } = addressDoc;

        let orderItems = [];
        let totalPrice = 0;
        let shopId = null;

        // ── Start MongoDB transaction ───────────────────────────────
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // ────────────────────────────────────────────────────────
            // MODE 1: Cart Checkout
            // ────────────────────────────────────────────────────────
            if (type === 'cart') {
                // Populate product details for each cart item
                const userCart = await Cart.findOne({ user: userId })
                    .populate('items.product')
                    .session(session);

                if (!userCart || !userCart.items.length) {
                    throw new BadRequestError('Cart is empty');
                }

                for (const item of userCart.items) {
                    const product = item.product;

                    if (!product) {
                        throw new NotFoundError(`Product not found for cart item`);
                    }

                    // ── Get variant details ────────────────────────────
                    const variant = product.getVariant(item.variantId);
                    if (!variant) {
                        throw new NotFoundError(`Variant not found for product "${product.title}"`);
                    }

                    // ── Extract shopId from first product ───────────────
                    if (!shopId) {
                        shopId = product.product_shop;
                        if (!shopId) {
                            throw new BadRequestError('Product does not belong to any shop');
                        }
                    } else if (String(shopId) !== String(product.product_shop)) {
                        // Validate all products belong to the same shop
                        throw new BadRequestError('All products in cart must belong to the same shop');
                    }

                    // ── Check variant stock availability ───────────────
                    if (variant.stock < item.quantity) {
                        throw new BadRequestError(
                            `Insufficient stock for "${product.title}" (${variant.color}, ${variant.size}). Available: ${variant.stock}, Requested: ${item.quantity}`
                        );
                    }

                    // Accumulate total
                    const itemPrice = product.discountedPrice > 0 ? product.discountedPrice : product.price;
                    totalPrice += itemPrice * item.quantity;

                    // Build snapshot item — price & name are frozen at order time
                    orderItems.push({
                        productId: product._id,
                        variantId: item.variantId,  // ✅ Include variantId
                        productName: product.title,
                        price: itemPrice,
                        quantity: item.quantity,
                        image: (product.images && product.images.length) ? product.images[0] : '',
                        color: variant.color,        // ✅ From variant
                        size: variant.size || null   // ✅ From variant
                    });

                    // ✅ Deduct stock at variant level
                    await Product.findByIdAndUpdate(
                        product._id,
                        { $inc: { 'variants.$.stock': -item.quantity, salesNumber: item.quantity } },
                        { session }
                    );
                }

                // Clear cart after successful order creation
                userCart.items = [];
                userCart.totalPrice = 0;
                await userCart.save({ session });

                // ────────────────────────────────────────────────────────
                // MODE 2: Buy Now (single product, skip cart)
                // ────────────────────────────────────────────────────────
            } else if (type === 'buy_now') {
                // Validate required fields
                if (!productId) throw new BadRequestError('productId is required for buy_now');
                if (!variantId) throw new BadRequestError('variantId is required for buy_now');
                if (!quantity || quantity < 1) throw new BadRequestError('quantity must be at least 1');

                const product = await Product.findById(productId).session(session);
                if (!product) {
                    throw new NotFoundError('Product not found');
                }

                // ── Get variant details ────────────────────────────
                const variant = product.getVariant(variantId);
                if (!variant) {
                    throw new NotFoundError('Variant not found');
                }

                // ── Extract shopId from product ────────────────────────
                shopId = product.product_shop;
                if (!shopId) {
                    throw new BadRequestError('Product does not belong to any shop');
                }

                // ── Check variant stock ────────────────────────────────
                if (variant.stock < quantity) {
                    throw new BadRequestError(
                        `Insufficient stock for "${product.title}" (${variant.color}, ${variant.size}). Available: ${variant.stock}, Requested: ${quantity}`
                    );
                }

                const itemPrice = product.discountedPrice > 0 ? product.discountedPrice : product.price;
                totalPrice = itemPrice * quantity;

                // Single snapshot item
                orderItems.push({
                    productId: product._id,
                    variantId,  // ✅ Include variantId
                    productName: product.title,
                    price: itemPrice,
                    quantity,
                    image: (product.images && product.images.length) ? product.images[0] : '',
                    color: variant.color,    // ✅ From variant
                    size: variant.size || null  // ✅ From variant
                });

                // ✅ Deduct stock at variant level
                await Product.findByIdAndUpdate(
                    product._id,
                    { $inc: { 'variants.$.stock': -quantity, salesNumber: quantity } },
                    { session }
                );

            } else {
                throw new BadRequestError('Invalid order type. Must be "cart" or "buy_now"');
            }

            // ── Create the order document ───────────────────────────
            const newOrder = await Order.create([{
                userId,
                shopId,
                receiverName,
                receiverPhone,
                address,
                items: orderItems,
                totalPrice,
                status: 'pending'
            }], { session });

            // ── Commit transaction ──────────────────────────────────
            await session.commitTransaction();

            // Best-effort: persist notification and push after order success
            try {
                await NotificationService.createNotification({
                    userId,
                    title: 'Order created successfully',
                    body: `Your order ${newOrder[0]._id} has been placed.`,
                    type: 'order',
                    data: {
                        orderId: String(newOrder[0]._id),
                        status: newOrder[0].status,
                    },
                    sendPush: true,
                });
            } catch (notifyError) {
                console.log(`[Notification] createOrder notify failed: ${notifyError.message}`);
            }

            return newOrder[0]; // .create() with session returns an array

        } catch (error) {
            // Roll back all changes on any failure
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    // Lấy tất cả đơn hàng của user — mới nhất lên đầu
    static async getOrdersByUser({ userId }) {
        return await Order.find({ userId })
            .sort({ createdAt: -1 })
            .lean();
    }

    // Lấy chi tiết 1 đơn hàng — kiểm tra quyền sở hữu
    static async getOrderById({ userId, orderId }) {
        const order = await Order.findOne({ _id: orderId, userId }).lean();

        if (!order) {
            throw new NotFoundError('Order not found or does not belong to the user');
        }

        return order;
    }
}

module.exports = OrderService;
