'use strict';

const productModel = require('../models/product.model');
const { NotFoundError, ForbiddenError } = require('../core/error.response');
const { isValidObjectId } = require('../utils/validation');

/**
 * Soft delete a product
 * @param {string} productId - Product ID
 * @param {string} shopId - Shop ID (for ownership verification)
 * @returns {object} Deleted product
 */
const softDeleteProduct = async (productId, shopId) => {
    if (!isValidObjectId(productId)) {
        throw new NotFoundError('Invalid product ID');
    }

    const product = await productModel.findById(productId);

    if (!product) {
        throw new NotFoundError('Product not found');
    }

    // Verify shop ownership
    if (product.product_shop.toString() !== shopId.toString()) {
        throw new ForbiddenError('You do not have permission to delete this product');
    }

    // Soft delete
    product.isDeleted = true;
    product.deletedAt = new Date();
    await product.save();

    return product;
};

/**
 * Restore a soft-deleted product
 * @param {string} productId - Product ID
 * @param {string} shopId - Shop ID (for ownership verification)
 * @returns {object} Restored product
 */
const restoreProduct = async (productId, shopId) => {
    if (!isValidObjectId(productId)) {
        throw new NotFoundError('Invalid product ID');
    }

    const product = await productModel.findById(productId);

    if (!product) {
        throw new NotFoundError('Product not found');
    }

    // Verify shop ownership
    if (product.product_shop.toString() !== shopId.toString()) {
        throw new ForbiddenError('You do not have permission to restore this product');
    }

    // Restore
    product.isDeleted = false;
    product.deletedAt = null;
    await product.save();

    return product;
};

/**
 * Permanently delete a product (hard delete)
 * @param {string} productId - Product ID
 * @param {string} shopId - Shop ID (for ownership verification)
 */
const permanentlyDeleteProduct = async (productId, shopId) => {
    if (!isValidObjectId(productId)) {
        throw new NotFoundError('Invalid product ID');
    }

    const product = await productModel.findById(productId);

    if (!product) {
        throw new NotFoundError('Product not found');
    }

    // Verify shop ownership
    if (product.product_shop.toString() !== shopId.toString()) {
        throw new ForbiddenError('You do not have permission to permanently delete this product');
    }

    await productModel.findByIdAndDelete(productId);

    return { message: 'Product permanently deleted' };
};

/**
 * Get all deleted products (admin/shop owner)
 * @param {string} shopId - Shop ID
 * @param {object} query - Query parameters
 * @returns {object} Deleted products
 */
const getDeletedProducts = async (shopId, query = {}) => {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const total = await productModel.countDocuments({
        product_shop: shopId,
        isDeleted: true
    });

    const products = await productModel
        .find({
            product_shop: shopId,
            isDeleted: true
        })
        .select('+deletedAt')
        .sort({ deletedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    return {
        products,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    };
};

module.exports = {
    softDeleteProduct,
    restoreProduct,
    permanentlyDeleteProduct,
    getDeletedProducts
};
