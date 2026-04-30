'use strict';

const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../../auth/checkAuth');
const { shopAuthenticationV2 } = require('../../auth/shopAuth');
const ShopInventoryController = require('../../controllers/shop.inventory.controller');

// All inventory routes require shop authentication
router.use(shopAuthenticationV2);

/**
 * ============================================
 * INVENTORY MANAGEMENT
 * ============================================
 */

// POST /v1/api/inventory — Create or update inventory
router.post(
    '',
    asyncHandler(ShopInventoryController.createOrUpdateInventory)
);

// GET /v1/api/inventory — Get all inventory for shop
router.get(
    '',
    asyncHandler(ShopInventoryController.getShopInventory)
);

// GET /v1/api/inventory/summary — Get inventory summary
router.get(
    '/summary',
    asyncHandler(ShopInventoryController.getInventorySummary)
);

// GET /v1/api/inventory/:id — Get single inventory
router.get(
    '/:id',
    asyncHandler(ShopInventoryController.getInventoryById)
);

// PATCH /v1/api/inventory/:id — Update inventory
router.patch(
    '/:id',
    asyncHandler(ShopInventoryController.updateInventory)
);

// DELETE /v1/api/inventory/:id — Delete inventory
router.delete(
    '/:id',
    asyncHandler(ShopInventoryController.deleteInventory)
);

module.exports = router;