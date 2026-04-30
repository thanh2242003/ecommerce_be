'use strict';

const { SuccessResponse } = require('../core/success.response');
const AdminOrderService = require('../services/admin.order.service');

class AdminOrderController {
    getOrders = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get orders successfully!',
            metadata: await AdminOrderService.getOrders(req.query),
        }).send(res);
    };

    getOrderById = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get order successfully!',
            metadata: await AdminOrderService.getOrderById(req.params.id),
        }).send(res);
    };

    updateOrderStatus = async (req, res, next) => {
        new SuccessResponse({
            message: 'Update order status successfully!',
            metadata: await AdminOrderService.updateOrderStatus(
                req.params.id,
                req.body.status,
                req.adminId,
                req.body.note
            ),
        }).send(res);
    };
}

module.exports = new AdminOrderController();
