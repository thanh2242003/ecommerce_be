'use strict';

const express = require('express');
const router = express.Router();

// Middleware
const { shopAuthenticationV2 } = require('../../auth/shopAuth');
const { asyncHandler } = require('../../auth/checkAuth');

// Controllers
const ShopOrderController = require('../../controllers/shop.order.controller');
const ShopDashboardController = require('../../controllers/shop.dashboard.controller');
const ShopInventoryController = require('../../controllers/shop.inventory.controller');
const ShopProductController = require('../../controllers/shop.product.controller');
const ShopDiscountController = require('../../controllers/shop.discount.controller');

// ================= PROTECTED ROUTES =================
// All shop routes require authentication
router.use(shopAuthenticationV2);

/**
 * ============================================
 * ORDERS MANAGEMENT
 * ============================================
 */

// GET /v1/api/shop/orders — Get all orders
router.get('/orders', asyncHandler(ShopOrderController.getShopOrders));

// GET /v1/api/shop/orders/:id — Get order detail
router.get('/orders/:id', asyncHandler(ShopOrderController.getOrderById));

// PATCH /v1/api/shop/orders/:id/status — Update order status
router.patch('/orders/:id/status', asyncHandler(ShopOrderController.updateOrderStatus));

/**
 * ============================================
 * DASHBOARD
 * ============================================
 */

// GET /v1/api/shop/dashboard — Get dashboard metrics
router.get('/dashboard', asyncHandler(ShopDashboardController.getDashboard));

module.exports = router;
