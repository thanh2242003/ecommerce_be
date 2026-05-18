'use strict';

const { SuccessResponse } = require('../core/success.response');
const { NotFoundError } = require('../core/error.response');
const Discount = require('../models/discount.model');

class AdminDiscountController {
    /**
     * POST /v1/api/admin/discounts
     * Create a platform-wide discount (admin only)
     */
    createPlatformDiscount = async (req, res, next) => {
        const {
            code, description, type = 'percentage', value,
            startDate, expiryDate, maxUses = 1, maxUsesPerUser = 1,
            minOrderValue = 0, appliesTo = 'all', applicableProducts = [], applicableCategories = [], isActive = true
        } = req.body;

        const newDiscount = await Discount.create({
            code: String(code).toUpperCase(),
            description,
            type,
            value,
            startDate: new Date(startDate),
            expiryDate: new Date(expiryDate),
            maxUses,
            maxUsesPerUser,
            minOrderValue,
            appliesTo,
            applicableProducts,
            applicableCategories,
            isActive,
            scope: 'platform',
        });

        new SuccessResponse({
            message: 'Platform discount created successfully!',
            metadata: newDiscount
        }).send(res);
    }

    /**
     * PATCH /v1/api/admin/discounts/:id
     * Update a platform discount
     */
    updatePlatformDiscount = async (req, res, next) => {
        const discountId = req.params.id;
        const updateData = req.body || {};

        const updated = await Discount.findOneAndUpdate(
            { _id: discountId, scope: 'platform' },
            { $set: updateData },
            { new: true }
        ).lean();

        if (!updated) throw new NotFoundError('Platform discount not found');

        new SuccessResponse({
            message: 'Platform discount updated successfully!',
            metadata: updated
        }).send(res);
    }

    /**
     * DELETE /v1/api/admin/discounts/:id
     * Delete a platform discount
     */
    deletePlatformDiscount = async (req, res, next) => {
        const discountId = req.params.id;

        const deleted = await Discount.findOneAndDelete({ _id: discountId, scope: 'platform' }).lean();

        if (!deleted) throw new NotFoundError('Platform discount not found');

        new SuccessResponse({
            message: 'Platform discount deleted successfully!',
            metadata: deleted
        }).send(res);
    }
}

module.exports = new AdminDiscountController();
