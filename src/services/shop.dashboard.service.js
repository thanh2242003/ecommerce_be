'use strict';

const mongoose = require('mongoose');
const orderModel = require('../models/order.model');
const productModel = require('../models/product.model');
const inventoryModel = require('../models/inventory.model');

/**
 * Get comprehensive shop dashboard data
 * @param {string} shopId - Shop ID
 * @returns {object} Dashboard metrics
 */
const getShopDashboard = async (shopId) => {
    const ObjectId = mongoose.Types.ObjectId;
    const shopObjectId = new ObjectId(shopId);

    try {
        // Fetch all metrics in parallel for better performance
        const [
            totalOrders,
            totalRevenue,
            totalProducts,
            totalCustomers,
            ordersByStatus,
            topSellingProducts,
            lowStockInventory
        ] = await Promise.all([
            _getTotalOrders(shopObjectId),
            _getTotalRevenue(shopObjectId),
            _getTotalProducts(shopObjectId),
            _getTotalCustomers(shopObjectId),
            _getOrdersByStatus(shopObjectId),
            _getTopSellingProducts(shopObjectId),
            _getLowStockInventory(shopObjectId)
        ]);

        return {
            overview: {
                totalOrders,
                totalRevenue,
                totalProducts,
                totalCustomers
            },
            ordersByStatus,
            topSellingProducts,
            lowStockInventory
        };

    } catch (error) {
        throw error;
    }
};

/**
 * Get total number of orders
 */
const _getTotalOrders = async (shopObjectId) => {
    const result = await orderModel.countDocuments({
        shopId: shopObjectId
    });
    return result || 0;
};

/**
 * Get total revenue from delivered orders
 */
const _getTotalRevenue = async (shopObjectId) => {
    const result = await orderModel.aggregate([
        {
            $match: {
                shopId: shopObjectId,
                status: 'delivered'
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: '$finalPrice' }
            }
        }
    ]);

    return result[0]?.total || 0;
};

/**
 * Get total number of published products
 */
const _getTotalProducts = async (shopObjectId) => {
    const result = await productModel.countDocuments({
        product_shop: shopObjectId,
        isPublished: true,
        isDeleted: false
    });
    return result || 0;
};

/**
 * Get total distinct customers (by distinct userId in orders)
 */
const _getTotalCustomers = async (shopObjectId) => {
    const result = await orderModel.aggregate([
        {
            $match: { shopId: shopObjectId }
        },
        {
            $group: {
                _id: '$userId'
            }
        },
        {
            $count: 'total'
        }
    ]);

    return result[0]?.total || 0;
};

/**
 * Get orders grouped by status with counts
 */
const _getOrdersByStatus = async (shopObjectId) => {
    const result = await orderModel.aggregate([
        {
            $match: { shopId: shopObjectId }
        },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                revenue: { $sum: '$finalPrice' }
            }
        },
        {
            $sort: { _id: 1 }
        }
    ]);

    // Format result
    const formatted = {};
    result.forEach(item => {
        formatted[item._id] = {
            count: item.count,
            revenue: item.revenue
        };
    });

    return formatted;
};

/**
 * Get top 5 selling products
 */
const _getTopSellingProducts = async (shopObjectId) => {
    const result = await orderModel.aggregate([
        {
            $match: { shopId: shopObjectId }
        },
        {
            $unwind: '$items'
        },
        {
            $group: {
                _id: '$items.productId',
                totalSold: { $sum: '$items.quantity' },
                totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
            }
        },
        {
            $sort: { totalSold: -1 }
        },
        {
            $limit: 5
        },
        {
            $lookup: {
                from: 'Products',
                localField: '_id',
                foreignField: '_id',
                as: 'productInfo'
            }
        },
        {
            $unwind: {
                path: '$productInfo',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $project: {
                _id: 1,
                productTitle: '$productInfo.title',
                productImage: { $arrayElemAt: ['$productInfo.images', 0] },
                totalSold: 1,
                totalRevenue: 1
            }
        }
    ]);

    return result;
};

/**
 * Get low stock inventory (quantity <= 10)
 */
const _getLowStockInventory = async (shopObjectId) => {
    const result = await inventoryModel.aggregate([
        {
            $match: {
                shopId: shopObjectId,
                $or: [
                    { status: 'low_stock' },
                    { status: 'out_of_stock' }
                ]
            }
        },
        {
            $lookup: {
                from: 'Products',
                localField: 'productId',
                foreignField: '_id',
                as: 'productInfo'
            }
        },
        {
            $unwind: {
                path: '$productInfo',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $project: {
                _id: 1,
                productId: 1,
                productTitle: '$productInfo.title',
                totalQuantity: 1,
                status: 1,
                location: 1
            }
        },
        {
            $sort: { totalQuantity: 1 }
        },
        {
            $limit: 10
        }
    ]);

    return result;
};

module.exports = {
    getShopDashboard
};
