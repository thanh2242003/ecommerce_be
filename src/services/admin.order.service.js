'use strict';

const { Types } = require('mongoose');
const Order = require('../models/order.model');
const { BadRequestError, NotFoundError } = require('../core/error.response');
const { parsePagination, getPaginationMetadata } = require('../utils/pagination');
const { normalizeOrderStatus, normalizePaymentStatus } = require('../utils/admin.validation');
const { validateOrderStatusTransition } = require('../utils/validation');
const OrderService = require('./order.service');

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

        if (query.paymentStatus) {
            filter.paymentStatus = normalizePaymentStatus(query.paymentStatus);
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

        const newStatus = normalizeOrderStatus(status);
        const order = await Order.findById(orderId);

        if (!order) {
            throw new NotFoundError('Order not found');
        }

        if (order.status === newStatus) {
            return populateOrderQuery(Order.findById(orderId)).lean();
        }

        validateOrderStatusTransition(order.status, newStatus);

        if (newStatus === 'confirmed' && order.paymentMethod !== 'cod' && order.paymentStatus !== 'paid') {
            throw new BadRequestError('Online payment order must be paid before confirmation');
        }

        if (newStatus === 'shipping' && order.paymentMethod !== 'cod' && order.paymentStatus !== 'paid') {
            throw new BadRequestError('Online payment order must be paid before shipping');
        }

        if (newStatus === 'cancelled') {
            await OrderService.cancelOrderByActor({
                orderId,
                cancelledBy: 'admin',
                cancelReason: note || 'Cancelled by admin',
            });

            return populateOrderQuery(Order.findById(orderId)).lean();
        }

        order.status = newStatus;
        if (note) {
            order.notes = String(note).trim();
        }
        OrderService.applyDeliveredPaymentStatus(order);
        await order.save();

        return populateOrderQuery(Order.findById(orderId)).lean();
    }

    static async completeManualRefund(orderId, adminId, note = '') {
        if (!Types.ObjectId.isValid(orderId)) {
            throw new BadRequestError('Invalid order ID');
        }

        const order = await Order.findById(orderId);
        if (!order) {
            throw new NotFoundError('Order not found');
        }

        if (order.paymentStatus === 'refunded') {
            return populateOrderQuery(Order.findById(orderId)).lean();
        }

        if (order.status !== 'cancelled' || order.paymentStatus !== 'refund_pending') {
            throw new BadRequestError('Only cancelled orders with refund_pending paymentStatus can be marked refunded');
        }

        order.paymentStatus = 'refunded';
        order.refundedAt = new Date();
        if (note) {
            order.notes = order.notes
                ? `${order.notes}\nRefund completed: ${String(note).trim()}`
                : `Refund completed: ${String(note).trim()}`;
        }
        await order.save();

        return populateOrderQuery(Order.findById(orderId)).lean();
    }
}

module.exports = AdminOrderService;
