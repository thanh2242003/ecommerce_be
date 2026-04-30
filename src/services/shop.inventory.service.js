'use strict';

const inventoryModel = require('../models/inventory.model');
const productModel = require('../models/product.model');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../core/error.response');
const { validateInventoryData, isValidObjectId } = require('../utils/validation');
const { parsePagination, getPaginationMetadata } = require('../utils/pagination');

/**
 * Create or update inventory
 * @param {string} shopId - Shop ID
 * @param {object} data - Inventory data { productId, totalQuantity, location, variants }
 * @returns {object} Inventory document
 */
const createOrUpdateInventory = async (shopId, data) => {
    // Validate data
    validateInventoryData(data);

    if (!data.productId || !isValidObjectId(data.productId)) {
        throw new BadRequestError('Invalid product ID');
    }

    // Verify product exists and belongs to shop
    const product = await productModel.findById(data.productId);

    if (!product) {
        throw new NotFoundError('Product not found');
    }

    if (product.product_shop.toString() !== shopId.toString()) {
        throw new ForbiddenError('You do not own this product');
    }

    // Check if inventory exists
    let inventory = await inventoryModel.findOne({
        productId: data.productId,
        shopId: shopId
    });

    if (inventory) {
        // Update existing inventory
        inventory.totalQuantity = data.totalQuantity || inventory.totalQuantity;
        inventory.location = data.location || inventory.location;
        inventory.reserved = data.reserved !== undefined ? data.reserved : inventory.reserved;
        
        if (data.variants) {
            inventory.variants = data.variants;
        }

        await inventory.save();
        return inventory;
    } else {
        // Create new inventory
        inventory = new inventoryModel({
            productId: data.productId,
            shopId: shopId,
            totalQuantity: data.totalQuantity || 0,
            location: data.location || 'Main Warehouse',
            reserved: data.reserved || 0,
            variants: data.variants || []
        });

        await inventory.save();
        return inventory;
    }
};

/**
 * Get all inventory for shop
 * @param {string} shopId - Shop ID
 * @param {object} query - Query parameters { page, limit, status }
 * @returns {object} { inventories, pagination }
 */
const getShopInventory = async (shopId, query = {}) => {
    const { page, limit, skip } = parsePagination(query);

    // Build filter
    const filter = { shopId };

    if (query.status) {
        const validStatuses = ['in_stock', 'low_stock', 'out_of_stock'];
        if (!validStatuses.includes(query.status)) {
            throw new BadRequestError(`Invalid status: ${query.status}`);
        }
        filter.status = query.status;
    }

    // Get total count
    const total = await inventoryModel.countDocuments(filter);

    // Fetch inventory
    const inventories = await inventoryModel
        .find(filter)
        .populate('productId', 'title images price')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    const pagination = getPaginationMetadata(total, page, limit);

    return {
        inventories,
        pagination
    };
};

/**
 * Get single inventory by ID
 * @param {string} inventoryId - Inventory ID
 * @param {string} shopId - Shop ID
 * @returns {object} Inventory document
 */
const getInventoryById = async (inventoryId, shopId) => {
    if (!isValidObjectId(inventoryId)) {
        throw new BadRequestError('Invalid inventory ID');
    }

    const inventory = await inventoryModel
        .findById(inventoryId)
        .populate('productId', 'title images price')
        .lean();

    if (!inventory) {
        throw new NotFoundError('Inventory not found');
    }

    if (inventory.shopId.toString() !== shopId.toString()) {
        throw new ForbiddenError('You do not have permission to access this inventory');
    }

    return inventory;
};

/**
 * Update inventory quantity and location
 * @param {string} inventoryId - Inventory ID
 * @param {string} shopId - Shop ID
 * @param {object} data - Update data { totalQuantity, location, variants }
 * @returns {object} Updated inventory
 */
const updateInventory = async (inventoryId, shopId, data) => {
    if (!isValidObjectId(inventoryId)) {
        throw new BadRequestError('Invalid inventory ID');
    }

    const inventory = await inventoryModel.findById(inventoryId);

    if (!inventory) {
        throw new NotFoundError('Inventory not found');
    }

    if (inventory.shopId.toString() !== shopId.toString()) {
        throw new ForbiddenError('You do not have permission to update this inventory');
    }

    // Validate data
    validateInventoryData(data);

    // Update fields
    if (data.totalQuantity !== undefined) {
        inventory.totalQuantity = data.totalQuantity;
    }

    if (data.location) {
        inventory.location = data.location;
    }

    if (data.reserved !== undefined) {
        inventory.reserved = data.reserved;
    }

    if (data.variants && Array.isArray(data.variants)) {
        inventory.variants = data.variants;
    }

    await inventory.save();

    const updated = await inventoryModel
        .findById(inventoryId)
        .populate('productId', 'title images price')
        .lean();

    return updated;
};

/**
 * Delete inventory
 * @param {string} inventoryId - Inventory ID
 * @param {string} shopId - Shop ID
 */
const deleteInventory = async (inventoryId, shopId) => {
    if (!isValidObjectId(inventoryId)) {
        throw new BadRequestError('Invalid inventory ID');
    }

    const inventory = await inventoryModel.findById(inventoryId);

    if (!inventory) {
        throw new NotFoundError('Inventory not found');
    }

    if (inventory.shopId.toString() !== shopId.toString()) {
        throw new ForbiddenError('You do not have permission to delete this inventory');
    }

    await inventoryModel.findByIdAndDelete(inventoryId);

    return { message: 'Inventory deleted successfully' };
};

/**
 * Get inventory summary (low stock, out of stock)
 * @param {string} shopId - Shop ID
 * @returns {object} Inventory summary
 */
const getInventorySummary = async (shopId) => {
    const summary = await inventoryModel.aggregate([
        {
            $match: { shopId: require('mongoose').Types.ObjectId(shopId) }
        },
        {
            $group: {
                _id: null,
                totalItems: { $sum: 1 },
                totalQuantity: { $sum: '$totalQuantity' },
                inStockCount: {
                    $sum: { $cond: [{ $eq: ['$status', 'in_stock'] }, 1, 0] }
                },
                lowStockCount: {
                    $sum: { $cond: [{ $eq: ['$status', 'low_stock'] }, 1, 0] }
                },
                outOfStockCount: {
                    $sum: { $cond: [{ $eq: ['$status', 'out_of_stock'] }, 1, 0] }
                }
            }
        }
    ]);

    return summary[0] || {
        totalItems: 0,
        totalQuantity: 0,
        inStockCount: 0,
        lowStockCount: 0,
        outOfStockCount: 0
    };
};

module.exports = {
    createOrUpdateInventory,
    getShopInventory,
    getInventoryById,
    updateInventory,
    deleteInventory,
    getInventorySummary
};
