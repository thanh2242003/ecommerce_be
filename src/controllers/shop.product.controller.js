'use strict';

const { SuccessResponse } = require('../core/success.response');
const { asyncHandler } = require('../auth/checkAuth');
const ShopProductService = require('../services/shop.product.service');

class ShopProductController {
    /**
     * PATCH /v1/api/product/:id/soft-delete
     * Soft delete a product
     */
    softDeleteProduct = asyncHandler(async (req, res, next) => {
        const shopId = req.shopId;
        const productId = req.params.id;

        const product = await ShopProductService.softDeleteProduct(productId, shopId);

        new SuccessResponse({
            message: 'Product soft deleted successfully!',
            metadata: product
        }).send(res);
    });

    /**
     * PATCH /v1/api/product/:id/restore
     * Restore a soft-deleted product
     */
    restoreProduct = asyncHandler(async (req, res, next) => {
        const shopId = req.shopId;
        const productId = req.params.id;

        const product = await ShopProductService.restoreProduct(productId, shopId);

        new SuccessResponse({
            message: 'Product restored successfully!',
            metadata: product
        }).send(res);
    });

    /**
     * DELETE /v1/api/product/:id/permanent
     * Permanently delete a product (hard delete)
     */
    permanentlyDeleteProduct = asyncHandler(async (req, res, next) => {
        const shopId = req.shopId;
        const productId = req.params.id;

        const result = await ShopProductService.permanentlyDeleteProduct(
            productId,
            shopId
        );

        new SuccessResponse({
            message: 'Product permanently deleted!',
            metadata: result
        }).send(res);
    });

    /**
     * GET /v1/api/product/shop/deleted
     * Get all deleted products for shop
     */
    getDeletedProducts = asyncHandler(async (req, res, next) => {
        const shopId = req.shopId;
        const query = {
            page: req.query.page,
            limit: req.query.limit
        };

        const result = await ShopProductService.getDeletedProducts(shopId, query);

        new SuccessResponse({
            message: 'Get deleted products successfully!',
            metadata: result
        }).send(res);
    });
}

module.exports = new ShopProductController();
