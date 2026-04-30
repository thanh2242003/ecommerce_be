'use strict';

const discountModel = require('../models/discount.model');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../core/error.response');
const { validateDiscountData, isDiscountExpired, isValidObjectId } = require('../utils/validation');

/**
 * Update discount
 * @param {string} discountId - Discount ID
 * @param {string} shopId - Shop ID (for ownership verification)
 * @param {object} updateData - Data to update { description, value, maxUses, expiryDate, applicableProducts }
 * @returns {object} Updated discount
 */
const updateDiscount = async (discountId, shopId, updateData) => {
    if (!isValidObjectId(discountId)) {
        throw new BadRequestError('Invalid discount ID');
    }

    const discount = await discountModel.findById(discountId);

    if (!discount) {
        throw new NotFoundError('Discount not found');
    }

    // Verify shop ownership
    if (discount.shopId.toString() !== shopId.toString()) {
        throw new ForbiddenError('You do not have permission to update this discount');
    }

    // Check if discount is expired (cannot update expired discount)
    if (isDiscountExpired(discount.expiryDate)) {
        throw new BadRequestError('Cannot update expired discount');
    }

    // Allowed fields to update
    const allowedFields = ['description', 'value', 'maxUses', 'expiryDate', 'applicableProducts', 'applicableCategories', 'minOrderValue'];

    // Validate and update each field
    if (updateData.description !== undefined) {
        if (typeof updateData.description !== 'string' || updateData.description.trim() === '') {
            throw new BadRequestError('Description must be a non-empty string');
        }
        discount.description = updateData.description;
    }

    if (updateData.value !== undefined) {
        if (updateData.value <= 0) {
            throw new BadRequestError('Discount value must be greater than 0');
        }
        if (discount.type === 'percentage' && updateData.value > 100) {
            throw new BadRequestError('Percentage discount cannot exceed 100%');
        }
        discount.value = updateData.value;
    }

    if (updateData.maxUses !== undefined) {
        if (updateData.maxUses < discount.usedCount) {
            throw new BadRequestError('Max uses cannot be less than already used count');
        }
        discount.maxUses = updateData.maxUses;
    }

    if (updateData.expiryDate !== undefined) {
        const newExpiryDate = new Date(updateData.expiryDate);
        if (newExpiryDate <= new Date()) {
            throw new BadRequestError('Expiry date must be in the future');
        }
        discount.expiryDate = newExpiryDate;
    }

    if (updateData.applicableProducts !== undefined) {
        if (Array.isArray(updateData.applicableProducts)) {
            discount.applicableProducts = updateData.applicableProducts;
        }
    }

    if (updateData.applicableCategories !== undefined) {
        if (Array.isArray(updateData.applicableCategories)) {
            discount.applicableCategories = updateData.applicableCategories;
        }
    }

    if (updateData.minOrderValue !== undefined) {
        if (updateData.minOrderValue < 0) {
            throw new BadRequestError('Minimum order value cannot be negative');
        }
        discount.minOrderValue = updateData.minOrderValue;
    }

    await discount.save();

    return discount;
};

/**
 * Delete discount
 * @param {string} discountId - Discount ID
 * @param {string} shopId - Shop ID (for ownership verification)
 * @param {boolean} allowIfUsed - Allow deletion even if used (optional, default: false)
 * @returns {object} Deletion result
 */
const deleteDiscount = async (discountId, shopId, allowIfUsed = false) => {
    if (!isValidObjectId(discountId)) {
        throw new BadRequestError('Invalid discount ID');
    }

    const discount = await discountModel.findById(discountId);

    if (!discount) {
        throw new NotFoundError('Discount not found');
    }

    // Verify shop ownership
    if (discount.shopId.toString() !== shopId.toString()) {
        throw new ForbiddenError('You do not have permission to delete this discount');
    }

    // Check if discount has been used
    if (!allowIfUsed && discount.usedCount > 0) {
        throw new BadRequestError(
            `Cannot delete discount that has been used (${discount.usedCount} times). Set allowIfUsed=true to force deletion.`
        );
    }

    await discountModel.findByIdAndDelete(discountId);

    return {
        message: 'Discount deleted successfully',
        discountId: discountId,
        usedCount: discount.usedCount
    };
};

/**
 * Get discount by code (for validation purposes)
 * @param {string} code - Discount code
 * @param {string} shopId - Shop ID
 * @returns {object} Discount document
 */
const getDiscountByCode = async (code, shopId) => {
    const discount = await discountModel.findOne({
        code: code.toUpperCase(),
        shopId: shopId
    });

    if (!discount) {
        throw new NotFoundError('Discount not found');
    }

    // Check if discount is active
    if (!discount.isActive) {
        throw new BadRequestError('Discount is not active');
    }

    // Check if expired
    if (isDiscountExpired(discount.expiryDate)) {
        throw new BadRequestError('Discount has expired');
    }

    // Check if max uses reached
    if (discount.usedCount >= discount.maxUses) {
        throw new BadRequestError('Discount max uses limit reached');
    }

    return discount;
};

/**
 * Validate discount applicability for order
 * @param {object} discount - Discount document
 * @param {array} productIds - Product IDs in order
 * @param {number} orderValue - Order total value
 * @throws {BadRequestError} If discount cannot be applied
 */
const validateDiscountApplicability = (discount, productIds, orderValue) => {
    // Check minimum order value
    if (discount.minOrderValue && orderValue < discount.minOrderValue) {
        throw new BadRequestError(
            `Minimum order value required: ${discount.minOrderValue}`
        );
    }

    // Check if applicable to products
    if (discount.appliesTo === 'specific' && discount.applicableProducts.length > 0) {
        const isApplicable = productIds.some(productId =>
            discount.applicableProducts.some(appId =>
                appId.toString() === productId.toString()
            )
        );

        if (!isApplicable) {
            throw new BadRequestError('Discount not applicable to these products');
        }
    }
};

module.exports = {
    updateDiscount,
    deleteDiscount,
    getDiscountByCode,
    validateDiscountApplicability
};
