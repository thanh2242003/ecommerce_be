'use strict';

const express = require('express');
const router = express.Router();
const OrderController = require('../../controllers/order.controller');
const { asyncHandler } = require('../../auth/checkAuth');
const { authenticationV2 } = require('../../auth/authUtils');

// All order routes require authentication
router.use(authenticationV2);

// POST /v1/api/order/orders — create order (cart checkout or buy now)
router.post('/orders', asyncHandler(OrderController.createOrder));

// GET /v1/api/order/orders — lấy tất cả đơn hàng của user
router.get('/orders', asyncHandler(OrderController.getOrders));

// GET /v1/api/order/orders/:id — lấy chi tiết 1 đơn hàng
router.get('/orders/:id', asyncHandler(OrderController.getOrderById));

module.exports = router;
