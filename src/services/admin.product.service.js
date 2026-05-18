'use strict';

const { Types } = require('mongoose');
const Product = require('../models/product.model');
const Inventory = require('../models/inventory.model');
const { BadRequestError, NotFoundError } = require('../core/error.response');
const { parsePagination, getPaginationMetadata } = require('../utils/pagination');
const { normalizeProductStatus } = require('../utils/admin.validation');

const formatProduct = (product) => {
    if (!product) {
        return product;
    }

    const inv = product.inventory || null;

    return {
        ...product,
        status: product.status || 'pending',
        inventory: inv
            ? {
                  totalQuantity: inv.totalQuantity ?? 0,
                  reserved: inv.reserved ?? 0,
                  status: inv.status || 'out_of_stock'
              }
            : {
                  totalQuantity: 0,
                  reserved: 0,
                  status: 'out_of_stock'
              }
    };
};

class AdminProductService {
    static async getProducts(query = {}) {
        const { page, limit, skip } = parsePagination(query);
        const filter = { isDeleted: { $ne: true } };

        if (query.status) {
            const normalizedStatus = normalizeProductStatus(query.status);
            if (normalizedStatus === 'pending') {
                filter.$or = [
                    { status: 'pending' },
                    { status: { $exists: false } },
                ];
            } else {
                filter.status = normalizedStatus;
            }
        }

        const [total, products] = await Promise.all([
            Product.countDocuments(filter),
            Product.find(filter)
                .populate('categoryId', 'name slug')
                .populate('product_shop', 'name email status verify')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
        ]);

        // Attach inventory documents to products so frontend can display stock
        const productIds = products.map((p) => p._id);
        const inventories = await Inventory.find({ productId: { $in: productIds } }).lean();
        const inventoryMap = {};
        inventories.forEach((inv) => {
            if (inv && inv.productId) inventoryMap[inv.productId.toString()] = inv;
        });

        const productsWithInventory = products.map((p) => ({
            ...p,
            inventory: inventoryMap[p._id.toString()] || null
        }));

        return {
            products: productsWithInventory.map(formatProduct),
            pagination: getPaginationMetadata(total, page, limit),
        };
    }

    static async updateProductStatus(productId, status, adminId, moderationNote = '') {
        if (!Types.ObjectId.isValid(productId)) {
            throw new BadRequestError('Invalid product ID');
        }

        const product = await Product.findById(productId);
        if (!product) {
            throw new NotFoundError('Product not found');
        }

        const normalizedStatus = normalizeProductStatus(status);
        product.status = normalizedStatus;
        product.moderatedBy = adminId;
        product.moderatedAt = new Date();
        product.moderationNote = String(moderationNote || '').trim();

        if (normalizedStatus === 'approved') {
            product.isPublished = true;
            product.isDraft = false;
        } else if (normalizedStatus === 'rejected') {
            product.isPublished = false;
            product.isDraft = false;
        } else {
            product.isPublished = false;
            product.isDraft = true;
        }

        await product.save();
        return formatProduct(product.toObject());
    }

    static async deleteProduct(productId) {
        if (!Types.ObjectId.isValid(productId)) {
            throw new BadRequestError('Invalid product ID');
        }

        const deleted = await Product.findByIdAndDelete(productId);
        if (!deleted) {
            throw new NotFoundError('Product not found');
        }

        return {
            deleted: true,
            productId: String(productId),
        };
    }
}

module.exports = AdminProductService;
