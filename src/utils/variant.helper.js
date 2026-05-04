'use strict';

const mongoose = require('mongoose');
const Product = require('../models/product.model');
const { BadRequestError, NotFoundError } = require('../core/error.response');

/**
 * Variant Helper Utilities
 * 
 * Usage: Manage product variants for inventory tracking
 */

class VariantHelper {
  /**
   * Get a variant from a product with full details
   */
  static async getVariant(productId, variantId) {
    const product = await Product.findById(productId);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    const variant = product.getVariant(variantId);
    if (!variant) {
      throw new NotFoundError('Variant not found');
    }

    return {
      ...variant.toObject(),
      product: {
        productId: product._id,
        title: product.title,
        price: product.price,
        discountedPrice: product.discountedPrice
      }
    };
  }

  /**
   * Check variant stock availability
   */
  static async checkStock(productId, variantId, quantity = 1) {
    const product = await Product.findById(productId);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    const hasStock = product.hasStock(variantId, quantity);
    if (!hasStock) {
      const variant = product.getVariant(variantId);
      if (!variant) {
        throw new NotFoundError('Variant not found');
      }
      throw new BadRequestError(
        `Insufficient stock for variant (${variant.color}, ${variant.size}). Available: ${variant.stock}, Requested: ${quantity}`
      );
    }

    return true;
  }

  /**
   * Deduct variant stock
   * Returns updated product
   */
  static async deductStock(productId, variantId, quantity = 1, session = null) {
    if (quantity < 1) {
      throw new BadRequestError('Quantity must be at least 1');
    }

    const options = { new: true };
    if (session) options.session = session;

    const product = await Product.findByIdAndUpdate(
      productId,
      { $inc: { 'variants.$.stock': -quantity, salesNumber: quantity } },
      options
    );

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    return product;
  }

  /**
   * Restore variant stock (for cancelled orders)
   */
  static async restoreStock(productId, variantId, quantity = 1, session = null) {
    if (quantity < 1) {
      throw new BadRequestError('Quantity must be at least 1');
    }

    const options = { new: true };
    if (session) options.session = session;

    const product = await Product.findByIdAndUpdate(
      productId,
      { $inc: { 'variants.$.stock': quantity, salesNumber: -quantity } },
      options
    );

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    return product;
  }

  /**
   * Get all variants of a product
   */
  static async getAllVariants(productId) {
    const product = await Product.findById(productId);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    return product.variants.map(v => ({
      variantId: v._id,
      color: v.color,
      size: v.size,
      stock: v.stock
    }));
  }

  /**
   * Update variant stock directly (admin use)
   */
  static async updateVariantStock(productId, variantId, newStock) {
    if (newStock < 0) {
      throw new BadRequestError('Stock cannot be negative');
    }

    const product = await Product.findById(productId);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    const variant = product.getVariant(variantId);
    if (!variant) {
      throw new NotFoundError('Variant not found');
    }

    const oldStock = variant.stock;
    variant.stock = newStock;
    await product.save();

    return {
      variantId,
      oldStock,
      newStock,
      change: newStock - oldStock
    };
  }

  /**
   * Bulk check variants availability
   * Usage: checkMultiple([
   *   { productId, variantId, quantity },
   *   { productId, variantId, quantity },
   * ])
   */
  static async checkMultiple(items) {
    const results = await Promise.all(
      items.map(async ({ productId, variantId, quantity }) => {
        try {
          await this.checkStock(productId, variantId, quantity);
          return { productId, variantId, available: true };
        } catch (error) {
          return { productId, variantId, available: false, error: error.message };
        }
      })
    );

    return results;
  }
}

module.exports = VariantHelper;
