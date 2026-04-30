'use strict';

const { Types } = require('mongoose');
const Shop = require('../models/shop.model');
const { BadRequestError, NotFoundError } = require('../core/error.response');
const { parsePagination, getPaginationMetadata } = require('../utils/pagination');
const { normalizeShopStatus } = require('../utils/admin.validation');

const formatShop = (shop) => {
    if (!shop) {
        return shop;
    }

    return {
        ...shop,
        status: shop.status === 'active' ? 'active' : 'blocked',
    };
};

const buildStatusFilter = (status) => {
    if (!status) {
        return {};
    }

    const normalized = normalizeShopStatus(status);
    if (normalized === 'active') {
        return { status: 'active' };
    }

    return { status: { $in: ['inactive', 'blocked'] } };
};

class AdminShopService {
    static async getShops(query = {}) {
        const { page, limit, skip } = parsePagination(query);
        const filter = buildStatusFilter(query.status);
        if (query.keyword) {
            const keyword = String(query.keyword).trim();
            if (keyword) {
                filter.$or = [
                    { name: { $regex: keyword, $options: 'i' } },
                    { email: { $regex: keyword, $options: 'i' } },
                ];
            }
        }

        const [total, shops] = await Promise.all([
            Shop.countDocuments(filter),
            Shop.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
        ]);

        return {
            shops: shops.map(formatShop),
            pagination: getPaginationMetadata(total, page, limit),
        };
    }

    static async getShopById(shopId) {
        if (!Types.ObjectId.isValid(shopId)) {
            throw new BadRequestError('Invalid shop ID');
        }

        const shop = await Shop.findById(shopId).lean();
        if (!shop) {
            throw new NotFoundError('Shop not found');
        }

        return formatShop(shop);
    }

    static async updateShopStatus(shopId, status, reason = '') {
        if (!Types.ObjectId.isValid(shopId)) {
            throw new BadRequestError('Invalid shop ID');
        }

        const shop = await Shop.findById(shopId);
        if (!shop) {
            throw new NotFoundError('Shop not found');
        }

        const normalizedStatus = normalizeShopStatus(status);
        shop.status = normalizedStatus;

        if (normalizedStatus === 'blocked') {
            shop.blockedAt = new Date();
            shop.blockedReason = String(reason || '').trim();
        } else {
            shop.blockedAt = null;
            shop.blockedReason = '';
        }

        await shop.save();

        return formatShop(shop.toObject());
    }

    static async verifyShop(shopId, adminId) {
        if (!Types.ObjectId.isValid(shopId)) {
            throw new BadRequestError('Invalid shop ID');
        }

        const shop = await Shop.findById(shopId);
        if (!shop) {
            throw new NotFoundError('Shop not found');
        }

        shop.verify = true;
        shop.status = 'active';
        shop.verifiedAt = new Date();
        shop.verifiedBy = adminId;
        shop.blockedAt = null;
        shop.blockedReason = '';

        await shop.save();

        return formatShop(shop.toObject());
    }
}

module.exports = AdminShopService;
