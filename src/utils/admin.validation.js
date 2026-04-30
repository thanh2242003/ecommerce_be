'use strict';

const { BadRequestError } = require('../core/error.response');

const isAdminRole = (roles = []) => {
    if (!Array.isArray(roles)) {
        return false;
    }

    return roles.some((role) => String(role).trim().toLowerCase() === 'admin');
};

const validateAdminLoginInput = ({ account, password }) => {
    if (!account || String(account).trim() === '') {
        throw new BadRequestError('Account is required');
    }

    if (!password || String(password).trim() === '') {
        throw new BadRequestError('Password is required');
    }
};

const normalizeShopStatus = (status) => {
    const value = String(status || '').trim().toLowerCase();

    if (!value) {
        return null;
    }

    if (value === 'active') {
        return 'active';
    }

    if (value === 'blocked' || value === 'inactive') {
        return 'blocked';
    }

    throw new BadRequestError('Shop status must be active or blocked');
};

const normalizeUserStatus = (status) => {
    const value = String(status || '').trim().toLowerCase();

    if (!value) {
        return null;
    }

    if (value === 'active' || value === 'unban') {
        return 'active';
    }

    if (value === 'inactive' || value === 'ban') {
        return 'inactive';
    }

    throw new BadRequestError('User status must be active or inactive');
};

const normalizeProductStatus = (status) => {
    const value = String(status || '').trim().toLowerCase();

    if (!value) {
        return null;
    }

    if (['pending', 'approved', 'rejected'].includes(value)) {
        return value;
    }

    throw new BadRequestError('Product status must be pending, approved, or rejected');
};

const normalizeOrderStatus = (status) => {
    const value = String(status || '').trim().toLowerCase();

    if (!value) {
        return null;
    }

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (validStatuses.includes(value)) {
        return value;
    }

    throw new BadRequestError('Invalid order status');
};

const validateBulkNotificationInput = ({ userIds, title, body, type }) => {
    if (!Array.isArray(userIds) || userIds.length === 0) {
        throw new BadRequestError('userIds must be a non-empty array');
    }

    if (!title || String(title).trim() === '') {
        throw new BadRequestError('title is required');
    }

    if (!body || String(body).trim() === '') {
        throw new BadRequestError('body is required');
    }

    const validTypes = ['promotion', 'system', 'custom', 'order', 'promo', 'test'];
    const normalizedType = String(type || 'system').trim().toLowerCase();

    if (!validTypes.includes(normalizedType)) {
        throw new BadRequestError('type must be promotion, system, custom, order, promo, or test');
    }

    return {
        userIds: [...new Set(userIds.map((id) => String(id).trim()).filter(Boolean))],
        title: String(title).trim(),
        body: String(body).trim(),
        type: normalizedType,
    };
};

module.exports = {
    isAdminRole,
    validateAdminLoginInput,
    normalizeShopStatus,
    normalizeUserStatus,
    normalizeProductStatus,
    normalizeOrderStatus,
    validateBulkNotificationInput,
};