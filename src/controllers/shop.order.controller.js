'use strict';

const { SuccessResponse } = require('../core/success.response');
const { asyncHandler } = require('../auth/checkAuth');
const ShopOrderService = require('../services/shop.order.service');

class ShopOrderController {
    /**
     * GET /v1/api/shop/orders
     * Get all orders for shop with pagination and filters
     */
    getShopOrders = asyncHandler(async (req, res, next) => {
        const shopId = req.shopId;
        const query = {
            page: req.query.page,
            limit: req.query.limit,
            status: req.query.status,
            paymentStatus: req.query.paymentStatus
        };

        const { orders, pagination } = await ShopOrderService.getShopOrders(shopId, query);

        new SuccessResponse({
            message: 'Get shop orders successfully!',
            metadata: {
                orders,
                pagination
            }
        }).send(res);
    });

    /**
     * GET /v1/api/shop/orders/:id
     * Get single order details
     */
    getOrderById = asyncHandler(async (req, res, next) => {
        const shopId = req.shopId;
        const orderId = req.params.id;

        const order = await ShopOrderService.getOrderById(orderId, shopId);

        new SuccessResponse({
            message: 'Get order successfully!',
            metadata: order
        }).send(res);
    });

    /**
     * PATCH /v1/api/shop/orders/:id/status
     * Update order status
     */
    updateOrderStatus = asyncHandler(async (req, res, next) => {
        const shopId = req.shopId;
        const orderId = req.params.id;
        const { status } = req.body;

        const updatedOrder = await ShopOrderService.updateOrderStatus(
            orderId,
            shopId,
            status
        );

        new SuccessResponse({
            message: 'Update order status successfully!',
            metadata: updatedOrder
        }).send(res);
    });
}

module.exports = new ShopOrderController();
