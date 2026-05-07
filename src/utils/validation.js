'use strict';

const { BadRequestError } = require('../core/error.response');

/**
 * Validate status transitions for orders
 * @param {string} currentStatus - Current order status
 * @param {string} newStatus - New status to transition to
 * @throws {BadRequestError} If transition is invalid
 */
const validateOrderStatusTransition = (currentStatus, newStatus) => {
    const validTransitions = {
        pending: ['confirmed', 'cancelled'],
        confirmed: ['processing', 'cancelled'],
        processing: ['shipped'],
        shipped: ['delivered'],
        delivered: [],
        cancelled: []
    };

    if (!validTransitions[currentStatus]) {
        throw new BadRequestError(`Invalid current status: ${currentStatus}`);
    }

    if (!validTransitions[currentStatus].includes(newStatus)) {
        throw new BadRequestError(
            `Cannot transition from ${currentStatus} to ${newStatus}`
        );
    }
};

/**
 * Validate discount code format and values
 * @param {object} discountData - Discount data to validate
 * @throws {BadRequestError} If validation fails
 */
const validateDiscountData = (discountData) => {
    const { code, value, type, minOrderValue, expiryDate, maxUses } = discountData;

    if (!code || code.trim() === '') {
        throw new BadRequestError('Discount code is required');
    }

    if (code.length < 3 || code.length > 20) {
        throw new BadRequestError('Discount code must be between 3-20 characters');
    }

    if (!value || value <= 0) {
        throw new BadRequestError('Discount value must be greater than 0');
    }

    if (type === 'percentage' && value > 100) {
        throw new BadRequestError('Percentage discount cannot exceed 100%');
    }

    if (minOrderValue && minOrderValue < 0) {
        throw new BadRequestError('Minimum order value cannot be negative');
    }

    if (expiryDate && new Date(expiryDate) <= new Date()) {
        throw new BadRequestError('Expiry date must be in the future');
    }

    if (!maxUses || maxUses < 1) {
        throw new BadRequestError('Max uses must be at least 1');
    }
};

/**
 * Validate inventory data
 * @param {object} inventoryData - Inventory data to validate
 * @throws {BadRequestError} If validation fails
 */
const validateInventoryData = (inventoryData) => {
    const { totalQuantity, location } = inventoryData;

    if (totalQuantity !== undefined && totalQuantity < 0) {
        throw new BadRequestError('Total quantity cannot be negative');
    }

    if (location && location.trim() === '') {
        throw new BadRequestError('Location cannot be empty');
    }

    // Validate variants if present
    if (inventoryData.variants && Array.isArray(inventoryData.variants)) {
        inventoryData.variants.forEach((variant, idx) => {
            if (!variant.size || !variant.color) {
                throw new BadRequestError(
                    `Variant ${idx + 1} must have size and color`
                );
            }
            const stockValue = variant.stock ?? variant.quantity;
            if (stockValue === undefined || stockValue < 0) {
                throw new BadRequestError(
                    `Variant ${idx + 1} stock cannot be negative`
                );
            }
        });
    }
};

/**
 * Check if discount is expired
 * @param {Date} expiryDate - Expiry date of discount
 * @returns {boolean} True if expired
 */
const isDiscountExpired = (expiryDate) => {
    return new Date(expiryDate) <= new Date();
};

/**
 * Validate object ID format
 * @param {string} id - ID to validate
 * @returns {boolean} True if valid MongoDB ObjectId format
 */
const isValidObjectId = (id) => {
    return /^[0-9a-f]{24}$/i.test(id);
};

module.exports = {
    validateOrderStatusTransition,
    validateDiscountData,
    validateInventoryData,
    isDiscountExpired,
    isValidObjectId
};
