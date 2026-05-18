'use strict';
const mongoose = require('mongoose');
const { BadRequestError, NotFoundError } = require('../core/error.response');
const { cart } = require('../models/cart.model');
const { getProductById } = require('../models/repositories/product.repo');

/**
 * Cart Service — uses variantId from Product.variants._id
 */
class CartService {

    // ──────────────────────────────────────────────────────────
    //  HELPERS
    // ──────────────────────────────────────────────────────────

    /**
     * Recalculate totalPrice from items array.
     */
    static _recalcTotalPrice(items) {
        return items.reduce((total, item) => total + item.quantity * item.price, 0);
    }

    /**
     * Recalculate totalPrice, then:
     *   - items empty → delete cart, return null
     *   - otherwise   → save and return cart
     */
    static async _saveOrDeleteCart(userCart) {
        userCart.totalPrice = this._recalcTotalPrice(userCart.items);

        if (!userCart.items.length) {
            await cart.deleteOne({ _id: userCart._id });
            return null;
        }

        return await userCart.save();
    }

    // ──────────────────────────────────────────────────────────
    //  ADD TO CART
    // ──────────────────────────────────────────────────────────

    /**
     * Add item to cart using variantId
     * @param {string} userId - User ID
     * @param {string} productId - Product ID
     * @param {string} variantId - Variant ID (reference to Product.variants._id)
     * @param {number} quantity - Quantity to add
     */
    static async addToCartMobile({ userId, productId, variantId, quantity }) {
        // ── Validate input ──────────────────────────────────────
        if (!productId || !variantId || typeof quantity !== 'number' || quantity < 1) {
            throw new BadRequestError('productId, variantId, and quantity (>= 1) are required');
        }
        if (!mongoose.Types.ObjectId.isValid(productId) || !mongoose.Types.ObjectId.isValid(variantId)) {
            throw new BadRequestError('Invalid productId or variantId format');
        }

        // ── Fetch product & determine price ─────────────────────
        const foundProduct = await getProductById(productId);
        if (!foundProduct) {
            throw new NotFoundError('Product not found');
        }

        // Ensure the product is available to customers (approved and published)
        if (!foundProduct.isPublished || String(foundProduct.status).toLowerCase() !== 'approved') {
            throw new BadRequestError('Product is not available');
        }

        // Get variant to verify it exists
        const variant = foundProduct.getVariant(variantId);
        if (!variant) {
            throw new NotFoundError('Variant not found');
        }

        const price = (foundProduct.discountedPrice && foundProduct.discountedPrice > 0)
            ? foundProduct.discountedPrice
            : foundProduct.price || 0;

        // ── Find or create cart ─────────────────────────────────
        let userCart = await cart.findOne({ user: userId });

        if (!userCart) {
            userCart = new cart({
                user: userId,
                items: [],
                totalPrice: 0
            });
        }

        // ── Check for existing item (product + variantId) ───────
        const existingIdx = userCart.items.findIndex(
            item =>
                item.product.toString() === productId.toString() &&
                item.variantId.toString() === variantId.toString()
        );

        if (existingIdx !== -1) {
            // Item exists → increase quantity
            userCart.items[existingIdx].quantity += quantity;
        } else {
            // New item → push
            userCart.items.push({
                product: productId,
                variantId,
                quantity,
                price
            });
        }

        // ── Recalculate & save (or delete if empty) ─────────────
        return await this._saveOrDeleteCart(userCart);
    }

    // ──────────────────────────────────────────────────────────
    //  UPDATE QUANTITY
    // ──────────────────────────────────────────────────────────

    /**
     * Update quantity of cart item using variantId
     */
    static async updateQuantity({ userId, productId, variantId, quantity }) {
        if (!productId || !variantId || typeof quantity !== 'number') {
            throw new BadRequestError('productId, variantId, and quantity are required');
        }
        if (!mongoose.Types.ObjectId.isValid(productId) || !mongoose.Types.ObjectId.isValid(variantId)) {
            throw new BadRequestError('Invalid productId or variantId format');
        }

        const userCart = await cart.findOne({ user: userId });
        if (!userCart) {
            throw new NotFoundError('Cart not found');
        }

        const idx = userCart.items.findIndex(
            item =>
                item.product.toString() === productId.toString() &&
                item.variantId.toString() === variantId.toString()
        );

        if (idx === -1) {
            throw new NotFoundError('Item not found in cart');
        }

        if (quantity <= 0) {
            // quantity ≤ 0 → remove item
            userCart.items.splice(idx, 1);
        } else {
            // Set new absolute quantity
            userCart.items[idx].quantity = quantity;
        }

        // Recalculate & save (or delete if empty)
        return await this._saveOrDeleteCart(userCart);
    }

    // ──────────────────────────────────────────────────────────
    //  DELETE CART ITEM
    // ──────────────────────────────────────────────────────────

    /**
     * Delete cart item using variantId
     */
    static async deleteCartItem({ userId, productId, variantId }) {
        if (!productId || !variantId) {
            throw new BadRequestError('productId and variantId are required');
        }
        if (!mongoose.Types.ObjectId.isValid(productId) || !mongoose.Types.ObjectId.isValid(variantId)) {
            throw new BadRequestError('Invalid productId or variantId format');
        }

        const result = await cart.findOneAndUpdate(
            { user: userId },
            {
                $pull: {
                    items: {
                        product: new mongoose.Types.ObjectId(productId),
                        variantId: new mongoose.Types.ObjectId(variantId)
                    }
                }
            },
            { new: true }
        );

        if (!result) {
            throw new NotFoundError('Cart not found');
        }

        // Recalculate & save (or delete if empty)
        return await this._saveOrDeleteCart(result);
    }

    // ──────────────────────────────────────────────────────────
    //  GET CART
    // ──────────────────────────────────────────────────────────

    static async getListCart({ userId }) {
        const userCart = await cart.findOne({ user: userId })
            .populate({
                path: 'items.product',
                select: 'title images price discountedPrice colors sizes variants slug'
            })
            .lean();

        if (!userCart) return null;

        // Attach matching color and size from product.variants into each cart item
        userCart.items = (userCart.items || []).map(item => {
            try {
                const product = item.product || {};
                const variants = product.variants || [];
                const matched = variants.find(v => String(v._id) === String(item.variantId));
                if (matched) {
                    item.color = matched.color;
                    item.size = matched.size;
                } else {
                    item.color = null;
                    item.size = null;
                }
            } catch (e) {
                item.color = null;
                item.size = null;
            }
            return item;
        });

        return userCart || null;
    }
}

module.exports = CartService;