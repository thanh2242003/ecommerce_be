'use strict';

const { CREATED, SuccessResponse } = require('../core/success.response');
const OrderService = require('../services/order.service');

class OrderController {

    /**
     * POST /orders
     *
     * Body (cart mode):    { type: "cart", addressId }
     * Body (buy_now mode): { type: "buy_now", addressId, productId, quantity, color }
     */
    createOrder = async (req, res, next) => {
        const userId = req.user.userId;

        new CREATED({
            message: 'Order created successfully',
            metadata: await OrderService.createOrder({
                userId,
                ...req.body
            })
        }).send(res);
    }

    // GET /orders — lấy tất cả đơn hàng của user
    getOrders = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get orders successfully',
            metadata: await OrderService.getOrdersByUser({
                userId: req.user.userId
            })
        }).send(res);
    }

    // GET /orders/:id — lấy chi tiết 1 đơn hàng
    getOrderById = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get order successfully',
            metadata: await OrderService.getOrderById({
                userId: req.user.userId,
                orderId: req.params.id
            })
        }).send(res);
    }
}

module.exports = new OrderController;
