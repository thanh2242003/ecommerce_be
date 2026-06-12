'use strict';

const express = require('express');
const router = express.Router();
const OrderController = require('../../controllers/order.controller');
const { asyncHandler } = require('../../auth/checkAuth');
const { authenticationV2 } = require('../../auth/authUtils');
const { createRateLimiter } = require('../../middlewares/rateLimit');

const createOrderRateLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    max: 5,
    keyGenerator: (req) => `create-order:${req.user.userId}`,
    message: 'Ban thao tac dat hang qua nhanh, vui long thu lai sau it phut',
});

// All order routes require authentication.
router.use(authenticationV2);

// POST /v1/api/order/orders - create order (cart checkout or buy now).
router.post('/orders', createOrderRateLimiter, asyncHandler(OrderController.createOrder));

// GET /v1/api/order/orders - get all orders for current user.
router.get('/orders', asyncHandler(OrderController.getOrders));

// GET /v1/api/order/orders/:id - get one order detail.
router.get('/orders/:id', asyncHandler(OrderController.getOrderById));

// PATCH /v1/api/order/orders/:id/cancel - cancel order by current user.
router.patch('/orders/:id/cancel', asyncHandler(OrderController.cancelOrder));

module.exports = router;
