'use strict';
const mongoose = require('mongoose');
const { BadRequestError, NotFoundError } = require('../core/error.response');
const { cart } = require('../models/cart.model');
const { getProductById } = require('../models/repositories/product.repo');

/**
 * Cart Service — variantId is auto-generated from color + size.
 *
 * variantId format: `{color}_{size}` (lowercase, trimmed)
 *   e.g. "red_xl", "blue_nosize"
 *
 * All matching uses: product + variantId (unique per variant).
 */
class CartService {

    // ──────────────────────────────────────────────────────────
    //  HELPERS
    // ──────────────────────────────────────────────────────────

    /**
     * Generate a deterministic variantId from color + size.
     */
    static _generateVariantId(color, size) {
        const normalize = (v) => v?.toLowerCase().trim();
        return `${normalize(color)}_${normalize(size) || 'nosize'}`;
    }

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

    static async addToCartMobile({ userId, productId, quantity, color, size }) {
        // ── Validate input ──────────────────────────────────────
        if (!productId || typeof quantity !== 'number' || !color) {
            throw new BadRequestError('Invalid input');
        }
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            throw new BadRequestError('Invalid product ID format');
        }

        // ── Fetch product & determine price ─────────────────────
        const foundProduct = await getProductById(productId);
        if (!foundProduct) {
            throw new NotFoundError('Product not found');
        }

        const price = (foundProduct.discountedPrice && foundProduct.discountedPrice > 0)
            ? foundProduct.discountedPrice
            : foundProduct.price || 0;

        // ── Generate variantId ──────────────────────────────────
        const variantId = this._generateVariantId(color, size);

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
                item.variantId === variantId
        );

        if (existingIdx !== -1) {
            // Item exists → increase quantity
            userCart.items[existingIdx].quantity += quantity;

            // quantity ≤ 0 → remove item
            if (userCart.items[existingIdx].quantity <= 0) {
                userCart.items.splice(existingIdx, 1);
            }
        } else if (quantity > 0) {
            // New item → push
            userCart.items.push({
                product: productId,
                variantId,
                quantity,
                price,
                color,
                size: size || null
            });
        }

        // ── Recalculate & save (or delete if empty) ─────────────
        return await this._saveOrDeleteCart(userCart);
    }

    // ──────────────────────────────────────────────────────────
    //  UPDATE QUANTITY
    // ──────────────────────────────────────────────────────────

    static async updateQuantity({ userId, productId, quantity, color, size }) {
        if (!productId || typeof quantity !== 'number' || !color) {
            throw new BadRequestError('productId, quantity, and color are required');
        }

        const userCart = await cart.findOne({ user: userId });
        if (!userCart) {
            throw new NotFoundError('Cart not found');
        }

        const variantId = this._generateVariantId(color, size);

        const idx = userCart.items.findIndex(
            item =>
                item.product.toString() === productId.toString() &&
                item.variantId === variantId
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

    static async deleteCartItem({ userId, productId, color, size }) {
        if (!productId || !color) {
            throw new BadRequestError('productId and color are required');
        }

        const variantId = this._generateVariantId(color, size);

        const result = await cart.findOneAndUpdate(
            { user: userId },
            {
                $pull: {
                    items: {
                        product: new mongoose.Types.ObjectId(productId),
                        variantId
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
                select: 'title images price discountedPrice colors sizes slug'
            })
            .lean();

        if (!userCart) return null;

        // Backward compat: auto-fill variantId for old items that don't have it
        let needsSave = false;
        for (const item of userCart.items) {
            if (!item.variantId && item.color) {
                item.variantId = this._generateVariantId(item.color, item.size);
                needsSave = true;
            }
        }

        // Persist generated variantIds for old items (fire-and-forget)
        if (needsSave) {
            const bulkOps = userCart.items
                .filter(item => item.variantId)
                .map(item => ({
                    updateOne: {
                        filter: {
                            _id: userCart._id,
                            'items.product': item.product._id || item.product,
                            'items.color': item.color,
                            'items.size': item.size || null
                        },
                        update: {
                            $set: { 'items.$.variantId': item.variantId }
                        }
                    }
                }));

            if (bulkOps.length) {
                cart.bulkWrite(bulkOps).catch(() => {}); // fire-and-forget
            }
        }

        return userCart;
    }
}

module.exports = CartService;