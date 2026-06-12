'use strict';

const mongoose = require('mongoose');
const Order = require('../models/order.model');
const Product = require('../models/product.model');
const Inventory = require('../models/inventory.model');
const { cart: Cart } = require('../models/cart.model');
const Address = require('../models/address.model');
const NotificationService = require('./notification.service');
const { BadRequestError, NotFoundError } = require('../core/error.response');

const ONLINE_PAYMENT_TIMEOUT_MINUTES = Number(process.env.SEPAY_PAYMENT_TIMEOUT_MINUTES || 15);

class OrderService {
    static normalizePaymentMethod(paymentMethod) {
        const value = String(paymentMethod || 'cod').trim().toLowerCase();

        if (['cod', 'bank_transfer'].includes(value)) {
            return value;
        }

        if (['online', 'sepay'].includes(value)) {
            return 'bank_transfer';
        }

        throw new BadRequestError('Invalid paymentMethod');
    }

    static getInitialPaymentStatus(paymentMethod) {
        return paymentMethod === 'bank_transfer'
            ? 'pending'
            : 'unpaid';
    }

    static getPaymentExpiredAt(paymentMethod) {
        return paymentMethod === 'bank_transfer'
            ? new Date(Date.now() + ONLINE_PAYMENT_TIMEOUT_MINUTES * 60 * 1000)
            : null;
    }

    static isTransientTransactionError(error) {
        return Boolean(
            error?.hasErrorLabel?.('TransientTransactionError') ||
            error?.hasErrorLabel?.('UnknownTransactionCommitResult') ||
            error?.code === 112 ||
            /WriteConflict|TransientTransactionError|UnknownTransactionCommitResult/i.test(error?.message || '')
        );
    }

    static async deductProductVariantStock({ product, variantId, quantity, session }) {
        const updatedProduct = await Product.findOneAndUpdate(
            {
                _id: product._id,
                variants: {
                    $elemMatch: {
                        _id: variantId,
                        stock: { $gte: quantity },
                    },
                },
            },
            { $inc: { 'variants.$.stock': -quantity, salesNumber: quantity } },
            { session, new: true }
        );

        if (!updatedProduct) {
            const variant = product.getVariant(variantId);
            const variantText = variant ? ` (${variant.color}, ${variant.size})` : '';

            throw new BadRequestError(
                `Insufficient stock for "${product.title}"${variantText}. Requested: ${quantity}`
            );
        }

        return updatedProduct;
    }

    static async restoreOrderStock({ order, session }) {
        if (order.stockRestoredAt) {
            return false;
        }

        const restoredAt = new Date();
        const lockedOrder = await Order.findOneAndUpdate(
            { _id: order._id, stockRestoredAt: null },
            { $set: { stockRestoredAt: restoredAt } },
            { new: true, session }
        );

        if (!lockedOrder) {
            return false;
        }

        for (const item of order.items) {
            await Product.findOneAndUpdate(
                { _id: item.productId, 'variants._id': item.variantId },
                { $inc: { 'variants.$.stock': item.quantity, salesNumber: -item.quantity } },
                { session }
            );

            await Inventory.findOneAndUpdate(
                { productId: item.productId, shopId: order.shopId },
                { $inc: { totalQuantity: item.quantity } },
                { session }
            );
        }

        order.stockRestoredAt = restoredAt;
        return true;
    }

    static applyCancellationPaymentStatus({ order, paymentStatusOnCancel = null }) {
        if (paymentStatusOnCancel) {
            order.paymentStatus = paymentStatusOnCancel;
            return;
        }

        if (order.paymentStatus === 'refunded') {
            return;
        }

        if (order.paymentStatus === 'refund_pending') {
            return;
        }

        if (order.paymentStatus === 'paid') {
            order.paymentStatus = 'refund_pending';
            order.refundRequestedAt = order.refundRequestedAt || new Date();
        }
    }

    static applyDeliveredPaymentStatus(order) {
        if (order.paymentMethod === 'cod' && order.paymentStatus !== 'paid') {
            order.paymentStatus = 'paid';
            order.paidAt = order.paidAt || new Date();
        }
    }

    static async cancelOrderByActor({
        orderId,
        cancelledBy = 'admin',
        cancelReason = null,
        paymentStatusOnCancel = null,
        session = null,
    }) {
        const ownSession = !session;
        const activeSession = session || await mongoose.startSession();

        if (ownSession) {
            activeSession.startTransaction();
        }

        try {
            const order = await Order.findById(orderId).session(activeSession);
            if (!order) {
                throw new NotFoundError('Order not found');
            }

            if (order.status === 'cancelled') {
                if (ownSession) {
                    await activeSession.commitTransaction();
                }
                return order.toObject();
            }

            if (!['pending', 'confirmed'].includes(order.status)) {
                throw new BadRequestError(`Cannot cancel order with status "${order.status}"`);
            }

            order.status = 'cancelled';
            this.applyCancellationPaymentStatus({
                order,
                paymentStatusOnCancel,
            });
            order.paymentExpiredAt = null;
            order.cancelReason = cancelReason || null;
            order.cancelledAt = new Date();
            order.cancelledBy = cancelledBy;

            await this.restoreOrderStock({ order, session: activeSession });
            await order.save({ session: activeSession });

            if (ownSession) {
                await activeSession.commitTransaction();
            }

            return order.toObject();
        } catch (error) {
            if (ownSession) {
                await activeSession.abortTransaction();
            }
            throw error;
        } finally {
            if (ownSession) {
                activeSession.endSession();
            }
        }
    }

    static async markOrderPaidFromPayment({ orderId, transactionId, paymentMethod = 'bank_transfer', session = null }) {
        const order = await Order.findById(orderId).session(session);

        if (!order) {
            throw new NotFoundError('Order not found');
        }

        if (order.status === 'cancelled') {
            throw new BadRequestError('Cannot mark cancelled order as paid');
        }

        if (order.paymentStatus === 'paid') {
            return order;
        }

        if (!['pending', 'confirmed'].includes(order.status)) {
            throw new BadRequestError(`Cannot mark payment as paid for order status "${order.status}"`);
        }

        order.paymentStatus = 'paid';
        order.paidAt = new Date();
        order.transactionId = transactionId;
        order.paymentMethod = paymentMethod;
        order.paymentExpiredAt = null;
        await order.save({ session });

        return order;
    }

    static async cancelOrderByPaymentFailure({ orderId, paymentStatus = 'failed', cancelReason = 'Payment failed' }) {
        return this.cancelOrderByActor({
            orderId,
            cancelledBy: 'admin',
            cancelReason,
            paymentStatusOnCancel: paymentStatus,
        });
    }

    static async cancelOrderByPaymentTimeout({ orderId, cancelReason = 'Payment timeout' }) {
        return this.cancelOrderByActor({
            orderId,
            cancelledBy: 'admin',
            cancelReason,
            paymentStatusOnCancel: 'expired',
        });
    }

    static async expirePendingOnlineOrdersForUser({ userId, now = new Date(), limit = 50 }) {
        const expiredOrders = await Order.find({
            userId,
            status: { $in: ['pending', 'confirmed'] },
            paymentMethod: 'bank_transfer',
            paymentStatus: 'pending',
            paymentExpiredAt: { $lte: now },
        }).sort({ paymentExpiredAt: 1 }).limit(limit);

        for (const order of expiredOrders) {
            await this.cancelOrderByPaymentFailure({
                orderId: order._id,
                paymentStatus: 'expired',
                cancelReason: 'Payment timeout',
            });
        }
    }

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
    static async createOrder(args) {
        const maxAttempts = 3;
        let lastError = null;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await this.createOrderOnce(args);
            } catch (error) {
                lastError = error;

                if (!this.isTransientTransactionError(error) || attempt === maxAttempts) {
                    throw error;
                }
            }
        }

        throw lastError;
    }

    static async createOrderOnce({ userId, type, addressId, productId, variantId, quantity, finalPrice, paymentMethod = 'cod', selectedCartItems = [] }) {
        await this.expirePendingOnlineOrdersForUser({ userId });

        // ── Validate address ownership ──────────────────────────────
        const addressDoc = await Address.findOne({ _id: addressId, userId });
        if (!addressDoc) {
            throw new NotFoundError('Address not found or does not belong to the user');
        }

        // Snapshot receiver info from Address — frozen at order time
        const { receiverName, receiverPhone, address } = addressDoc;
        const normalizedPaymentMethod = this.normalizePaymentMethod(paymentMethod);

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

                const selectedKeys = Array.isArray(selectedCartItems)
                    ? new Set(
                        selectedCartItems
                            .filter(item => item?.productId && item?.variantId)
                            .map(item => `${String(item.productId)}:${String(item.variantId)}`)
                    )
                    : new Set();

                const cartItemsToOrder = selectedKeys.size
                    ? userCart.items.filter(item => {
                        const productIdValue = item.product?._id || item.product;
                        return selectedKeys.has(`${String(productIdValue)}:${String(item.variantId)}`);
                    })
                    : userCart.items;

                if (!cartItemsToOrder.length) {
                    throw new BadRequestError('Selected cart items not found');
                }

                for (const item of cartItemsToOrder) {
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

                    // Deduct stock atomically: only succeeds when this variant still has enough stock.
                    await this.deductProductVariantStock({
                        product,
                        variantId: item.variantId,
                        quantity: item.quantity,
                        session,
                    });

                    // ✅ Deduct inventory (Inventory model)
                    await Inventory.findOneAndUpdate(
                        { productId: product._id, shopId },
                        { $inc: { totalQuantity: -item.quantity } },
                        { session, new: true }
                    );
                }

                // Remove ordered items after successful order creation. Requests without
                // selectedCartItems keep the previous behavior and clear the whole cart.
                if (selectedKeys.size) {
                    userCart.items = userCart.items.filter(item => {
                        const productIdValue = item.product?._id || item.product;
                        return !selectedKeys.has(`${String(productIdValue)}:${String(item.variantId)}`);
                    });
                    userCart.totalPrice = userCart.items.reduce((sum, item) => {
                        const price = Number(item.price || 0);
                        const quantity = Number(item.quantity || 0);
                        return sum + price * quantity;
                    }, 0);
                } else {
                    userCart.items = [];
                    userCart.totalPrice = 0;
                }
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

                // Deduct stock atomically: only succeeds when this variant still has enough stock.
                await this.deductProductVariantStock({
                    product,
                    variantId,
                    quantity,
                    session,
                });

                // ✅ Deduct inventory (Inventory model)
                await Inventory.findOneAndUpdate(
                    { productId: product._id, shopId },
                    { $inc: { totalQuantity: -quantity } },
                    { session, new: true }
                );

            } else {
                throw new BadRequestError('Invalid order type. Must be "cart" or "buy_now"');
            }

            // ── Create the order document ───────────────────────────
            const serverFinalPrice = Math.max(0, totalPrice);

            if (typeof finalPrice === 'number' && finalPrice !== serverFinalPrice) {
                throw new BadRequestError('Giá đã được cập nhật, vui lòng refresh lại trang');
            }

            const newOrder = await Order.create([{
                userId,
                shopId,
                receiverName,
                receiverPhone,
                address,
                items: orderItems,
                totalPrice,
                discountAmount: 0,
                finalPrice: serverFinalPrice,
                status: 'pending',
                paymentMethod: normalizedPaymentMethod,
                paymentStatus: this.getInitialPaymentStatus(normalizedPaymentMethod),
                paymentExpiredAt: this.getPaymentExpiredAt(normalizedPaymentMethod)
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
        await this.expirePendingOnlineOrdersForUser({ userId });

        return await Order.find({ userId })
            .sort({ createdAt: -1 })
            .lean();
    }

    // Lấy chi tiết 1 đơn hàng — kiểm tra quyền sở hữu
    static async getOrderById({ userId, orderId }) {
        await this.expirePendingOnlineOrdersForUser({ userId });

        const order = await Order.findOne({ _id: orderId, userId }).lean();

        if (!order) {
            throw new NotFoundError('Order not found or does not belong to the user');
        }

        return order;
    }

    // Cancel an order (initiated by the order owner)
    static async cancelOrder({ userId, orderId, cancelReason = null }) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Verify ownership and current status
            const order = await Order.findOne({ _id: orderId, userId }).session(session);
            if (!order) throw new NotFoundError('Order not found or does not belong to the user');

            if (!['pending', 'confirmed'].includes(order.status)) {
                throw new BadRequestError(`Cannot cancel order with status "${order.status}"`);
            }

            const cancelledOrder = await this.cancelOrderByActor({
                orderId,
                cancelledBy: 'user',
                cancelReason,
                session,
            });

            await session.commitTransaction();

            return cancelledOrder;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }
}

module.exports = OrderService;
