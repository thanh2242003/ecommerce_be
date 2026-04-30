'use strict';

const mongoose = require('mongoose');
const User = require('../models/user.model');
const Shop = require('../models/shop.model');
const Order = require('../models/order.model');

class AdminAnalyticsService {
    static async getOverview() {
        const [
            totalUsers,
            totalShops,
            totalOrders,
            revenueStats,
            ordersByStatus,
            topSellingProducts,
        ] = await Promise.all([
            User.countDocuments({}),
            Shop.countDocuments({}),
            Order.countDocuments({}),
            Order.aggregate([
                {
                    $group: {
                        _id: null,
                        totalRevenue: {
                            $sum: { $ifNull: ['$finalPrice', '$totalPrice'] },
                        },
                    },
                },
            ]),
            Order.aggregate([
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 },
                        revenue: { $sum: { $ifNull: ['$finalPrice', '$totalPrice'] } },
                    },
                },
                {
                    $sort: { _id: 1 },
                },
            ]),
            Order.aggregate([
                {
                    $unwind: '$items',
                },
                {
                    $group: {
                        _id: '$items.productId',
                        productName: { $first: '$items.productName' },
                        productImage: { $first: '$items.image' },
                        totalSold: { $sum: '$items.quantity' },
                        totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
                    },
                },
                {
                    $sort: { totalSold: -1 },
                },
                {
                    $limit: 5,
                },
                {
                    $lookup: {
                        from: 'Products',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'productInfo',
                    },
                },
                {
                    $unwind: {
                        path: '$productInfo',
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $project: {
                        _id: 0,
                        productId: '$_id',
                        productName: {
                            $ifNull: ['$productInfo.title', '$productName'],
                        },
                        productImage: {
                            $ifNull: [{ $arrayElemAt: ['$productInfo.images', 0] }, '$productImage'],
                        },
                        totalSold: 1,
                        totalRevenue: 1,
                    },
                },
            ]),
        ]);

        const ordersByStatusMap = ordersByStatus.reduce((accumulator, item) => {
            accumulator[item._id || 'unknown'] = {
                count: item.count,
                revenue: item.revenue,
            };
            return accumulator;
        }, {});

        return {
            overview: {
                totalUsers,
                totalShops,
                totalOrders,
                totalRevenue: revenueStats[0]?.totalRevenue || 0,
            },
            ordersByStatus: ordersByStatusMap,
            topSellingProducts,
        };
    }
}

module.exports = AdminAnalyticsService;
