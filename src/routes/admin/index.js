'use strict';

const express = require('express');
const router = express.Router();

const { asyncHandler } = require('../../helpers/asyncHandler');
const { verifyAdmin } = require('../../auth/adminAuth');

const AdminAuthController = require('../../controllers/admin.auth.controller');

// Debug: log incoming admin router requests
router.use((req, res, next) => {
    console.debug('[admin router] incoming', { originalUrl: req.originalUrl, path: req.path, headers: Object.keys(req.headers) });
    next();
});
const AdminShopController = require('../../controllers/admin.shop.controller');
const AdminUserController = require('../../controllers/admin.user.controller');
const AdminProductController = require('../../controllers/admin.product.controller');
const AdminOrderController = require('../../controllers/admin.order.controller');
const AdminAnalyticsController = require('../../controllers/admin.analytics.controller');
const AdminNotificationController = require('../../controllers/admin.notification.controller');
const AdminDiscountController = require('../../controllers/admin.discount.controller');
const AdminReturnController = require('../../controllers/admin.return.controller');

router.post('/auth/login', asyncHandler(AdminAuthController.login));
router.get('/profile', verifyAdmin, asyncHandler(AdminAuthController.profile));

router.use(verifyAdmin);

router.get('/shops', asyncHandler(AdminShopController.getShops));
router.get('/shops/:shopId', asyncHandler(AdminShopController.getShopById));
router.patch('/shops/:shopId/status', asyncHandler(AdminShopController.updateShopStatus));
router.patch('/shops/:shopId/verify', asyncHandler(AdminShopController.verifyShop));

router.get('/users', asyncHandler(AdminUserController.getUsers));
router.get('/users/:userId', asyncHandler(AdminUserController.getUserById));
router.patch('/users/:userId/status', asyncHandler(AdminUserController.updateUserStatus));

router.get('/products', asyncHandler(AdminProductController.getProducts));
router.patch('/products/:id/status', asyncHandler(AdminProductController.updateProductStatus));
router.delete('/products/:id', asyncHandler(AdminProductController.deleteProduct));

router.get('/orders', asyncHandler(AdminOrderController.getOrders));
router.get('/orders/:id', asyncHandler(AdminOrderController.getOrderById));
router.patch('/orders/:id/status', asyncHandler(AdminOrderController.updateOrderStatus));

// Return request management
router.get('/returns', asyncHandler(AdminReturnController.getReturns));
router.patch('/returns/:id/approve', asyncHandler(AdminReturnController.approveReturn));
router.patch('/returns/:id/reject', asyncHandler(AdminReturnController.rejectReturn));
router.patch('/returns/:id/complete', asyncHandler(AdminReturnController.completeReturn));
router.patch('/returns/:id/cancel', asyncHandler(AdminReturnController.adminCancelReturn));

router.get('/analytics/overview', asyncHandler(AdminAnalyticsController.getOverview));
router.post('/notifications/send-bulk', asyncHandler(AdminNotificationController.sendBulkNotifications));
// Admin: create / update / delete platform-wide discounts
router.post('/discounts', asyncHandler(AdminDiscountController.createPlatformDiscount));
router.patch('/discounts/:id', asyncHandler(AdminDiscountController.updatePlatformDiscount));
router.delete('/discounts/:id', asyncHandler(AdminDiscountController.deletePlatformDiscount));

module.exports = router;
