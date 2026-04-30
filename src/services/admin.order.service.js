'use strict';

const { Types } = require('mongoose');
const Order = require('../models/order.model');
const { BadRequestError, NotFoundError } = require('../core/error.response');
const { parsePagination, getPaginationMetadata } = require('../utils/pagination');
const { normalizeOrderStatus } = require('../utils/admin.validation');

const populateOrderQuery = (query) => query
    .populate('userId', 'name email phone avatar status roles')
    .populate('shopId', 'name email status verify')
    .populate('items.productId', 'title images price product_type status');

class AdminOrderService {
    static async getOrders(query = {}) {
        const { page, limit, skip } = parsePagination(query);
        const filter = {};

        if (query.status) {
            filter.status = normalizeOrderStatus(query.status);
        }

        const [total, orders] = await Promise.all([
            Order.countDocuments(filter),
            populateOrderQuery(Order.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit))
                .lean(),
        ]);

        return {
            orders,
            pagination: getPaginationMetadata(total, page, limit),
        };
    }

    static async getOrderById(orderId) {
        if (!Types.ObjectId.isValid(orderId)) {
            throw new BadRequestError('Invalid order ID');
        }

        const order = await populateOrderQuery(Order.findById(orderId)).lean();
        if (!order) {
            throw new NotFoundError('Order not found');
        }

        return order;
    }

    static async updateOrderStatus(orderId, status, adminId, note = '') {
        if (!Types.ObjectId.isValid(orderId)) {
            throw new BadRequestError('Invalid order ID');
        }

        const order = await Order.findById(orderId);
        if (!order) {
            throw new NotFoundError('Order not found');
        }

        order.status = normalizeOrderStatus(status);
        if (note) {
            order.notes = String(note).trim();
        }

        await order.save();

        return populateOrderQuery(Order.findById(orderId)).lean();
    }
}

module.exports = AdminOrderService;
