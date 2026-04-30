'use strict';

const { SuccessResponse } = require('../core/success.response');
const { asyncHandler } = require('../auth/checkAuth');
const ShopInventoryService = require('../services/shop.inventory.service');

class ShopInventoryController {
    /**
     * POST /v1/api/inventory
     * Create or update inventory
     */
    createOrUpdateInventory = asyncHandler(async (req, res, next) => {
        const shopId = req.shopId;
        const inventoryData = req.body;

        const inventory = await ShopInventoryService.createOrUpdateInventory(
            shopId,
            inventoryData
        );

        new SuccessResponse({
            message: 'Inventory created/updated successfully!',
            metadata: inventory
        }).send(res);
    });

    /**
     * GET /v1/api/inventory
     * Get all inventory for shop
     */
    getShopInventory = asyncHandler(async (req, res, next) => {
        const shopId = req.shopId;
        const query = {
            page: req.query.page,
            limit: req.query.limit,
            status: req.query.status
        };

        const { inventories, pagination } = await ShopInventoryService.getShopInventory(
            shopId,
            query
        );

        new SuccessResponse({
            message: 'Get shop inventory successfully!',
            metadata: {
                inventories,
                pagination
            }
        }).send(res);
    });

    /**
     * GET /v1/api/inventory/:id
     * Get single inventory
     */
    getInventoryById = asyncHandler(async (req, res, next) => {
        const shopId = req.shopId;
        const inventoryId = req.params.id;

        const inventory = await ShopInventoryService.getInventoryById(
            inventoryId,
            shopId
        );

        new SuccessResponse({
            message: 'Get inventory successfully!',
            metadata: inventory
        }).send(res);
    });

    /**
     * PATCH /v1/api/inventory/:id
     * Update inventory quantity/location
     */
    updateInventory = asyncHandler(async (req, res, next) => {
        const shopId = req.shopId;
        const inventoryId = req.params.id;
        const updateData = req.body;

        const inventory = await ShopInventoryService.updateInventory(
            inventoryId,
            shopId,
            updateData
        );

        new SuccessResponse({
            message: 'Update inventory successfully!',
            metadata: inventory
        }).send(res);
    });

    /**
     * DELETE /v1/api/inventory/:id
     * Delete inventory
     */
    deleteInventory = asyncHandler(async (req, res, next) => {
        const shopId = req.shopId;
        const inventoryId = req.params.id;

        const result = await ShopInventoryService.deleteInventory(
            inventoryId,
            shopId
        );

        new SuccessResponse({
            message: 'Delete inventory successfully!',
            metadata: result
        }).send(res);
    });

    /**
     * GET /v1/api/inventory/summary
     * Get inventory summary
     */
    getInventorySummary = asyncHandler(async (req, res, next) => {
        const shopId = req.shopId;

        const summary = await ShopInventoryService.getInventorySummary(shopId);

        new SuccessResponse({
            message: 'Get inventory summary successfully!',
            metadata: summary
        }).send(res);
    });
}

module.exports = new ShopInventoryController();
