'use strict';

const { SuccessResponse } = require('../core/success.response');
const { asyncHandler } = require('../auth/checkAuth');
const ShopDiscountService = require('../services/shop.discount.service');

class ShopDiscountController {
    /**
     * PATCH /v1/api/discount/:id
     * Update discount
     */
    updateDiscount = asyncHandler(async (req, res, next) => {
        const shopId = req.shopId;
        const discountId = req.params.id;
        const updateData = req.body;

        const discount = await ShopDiscountService.updateDiscount(
            discountId,
            shopId,
            updateData
        );

        new SuccessResponse({
            message: 'Discount updated successfully!',
            metadata: discount
        }).send(res);
    });

    /**
     * DELETE /v1/api/discount/:id
     * Delete discount
     */
    deleteDiscount = asyncHandler(async (req, res, next) => {
        const shopId = req.shopId;
        const discountId = req.params.id;
        const allowIfUsed = req.body?.allowIfUsed || false;

        const result = await ShopDiscountService.deleteDiscount(
            discountId,
            shopId,
            allowIfUsed
        );

        new SuccessResponse({
            message: 'Discount deleted successfully!',
            metadata: result
        }).send(res);
    });
}

module.exports = new ShopDiscountController();
