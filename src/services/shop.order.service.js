'use strict';

const orderModel = require('../models/order.model');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../core/error.response');
const { validateOrderStatusTransition } = require('../utils/validation');
const { parsePagination, getPaginationMetadata } = require('../utils/pagination');

/**
 * Get all orders for a shop with optional filters
 * @param {string} shopId - Shop ID
 * @param {object} query - Query parameters { page, limit, status }
 * @returns {object} { orders, pagination }
 */
const getShopOrders = async (shopId, query = {}) => {
    const { page, limit, skip } = parsePagination(query);

    // Build filter
    const filter = { shopId };

    if (query.status) {
        // Validate status
        const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(query.status)) {
            throw new BadRequestError(`Invalid status: ${query.status}`);
        }
        filter.status = query.status;
    }

    // Get total count for pagination
    const total = await orderModel.countDocuments(filter);

    // Fetch orders
    const orders = await orderModel
        .find(filter)
        .populate('userId', 'name email phone')
        .populate('items.productId', 'title images price')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    const pagination = getPaginationMetadata(total, page, limit);

    return {
        orders,
        pagination
    };
};

/**
 * Get single order by ID
 * @param {string} orderId - Order ID
 * @param {string} shopId - Shop ID (for ownership verification)
 * @returns {object} Order details
 */
const getOrderById = async (orderId, shopId) => {
    const order = await orderModel
        .findById(orderId)
        .populate('userId', 'name email phone')
        .populate('items.productId', 'title images price')
        .lean();

    if (!order) {
        throw new NotFoundError('Order not found');
    }

    // Verify shop ownership
    if (order.shopId.toString() !== shopId.toString()) {
        throw new ForbiddenError('You do not have permission to view this order');
    }

    return order;
};

/**
 * Update order status with validation
 * @param {string} orderId - Order ID
 * @param {string} shopId - Shop ID (for ownership verification)
 * @param {string} newStatus - New status
 * @returns {object} Updated order
 */
const updateOrderStatus = async (orderId, shopId, newStatus) => {
    const order = await orderModel.findById(orderId);

    if (!order) {
        throw new NotFoundError('Order not found');
    }

    // Verify shop ownership
    if (order.shopId.toString() !== shopId.toString()) {
        throw new ForbiddenError('You do not have permission to update this order');
    }

    // Validate status transition
    validateOrderStatusTransition(order.status, newStatus);

    // Update order
    order.status = newStatus;
    await order.save();

    const updatedOrder = await orderModel
        .findById(orderId)
        .populate('userId', 'name email phone')
        .populate('items.productId', 'title images price')
        .lean();

    return updatedOrder;
};

/**
 * Get order statistics for dashboard
 * @param {string} shopId - Shop ID
 * @returns {object} Order statistics
 */
const getOrderStats = async (shopId) => {
    const stats = await orderModel.aggregate([
        {
            $match: { shopId: require('mongoose').Types.ObjectId(shopId) }
        },
        {
            $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                totalRevenue: { $sum: '$finalPrice' },
                pendingCount: {
                    $sum: {
                        $cond: [{ $eq: ['$status', 'pending'] }, 1, 0]
                    }
                },
                confirmedCount: {
                    $sum: {
                        $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0]
                    }
                },
                processingCount: {
                    $sum: {
                        $cond: [{ $eq: ['$status', 'processing'] }, 1, 0]
                    }
                },
                shippedCount: {
                    $sum: {
                        $cond: [{ $eq: ['$status', 'shipped'] }, 1, 0]
                    }
                },
                deliveredCount: {
                    $sum: {
                        $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0]
                    }
                },
                cancelledCount: {
                    $sum: {
                        $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0]
                    }
                }
            }
        }
    ]);

    return stats[0] || {
        totalOrders: 0,
        totalRevenue: 0,
        pendingCount: 0,
        confirmedCount: 0,
        processingCount: 0,
        shippedCount: 0,
        deliveredCount: 0,
        cancelledCount: 0
    };
};

/**
 * Get orders by status grouped
 * @param {string} shopId - Shop ID
 * @returns {object} Orders grouped by status
 */
const getOrdersByStatus = async (shopId) => {
    const orders = await orderModel.aggregate([
        {
            $match: { shopId: require('mongoose').Types.ObjectId(shopId) }
        },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalRevenue: { $sum: '$finalPrice' }
            }
        },
        {
            $sort: { _id: 1 }
        }
    ]);

    return orders;
};

module.exports = {
    getShopOrders,
    getOrderById,
    updateOrderStatus,
    getOrderStats,
    getOrdersByStatus
};
