'use strict';

const jwt = require('jsonwebtoken');
const { ForbiddenError, AuthFailureError } = require('../core/error.response');
const { asyncHandler } = require('../helpers/asyncHandler');
const Admin = require('../models/admin.model');
const { isAdminRole } = require('../utils/admin.validation');

const parseAuthorizationToken = (value = '') => {
    const raw = String(value || '').trim();

    if (!raw) {
        return '';
    }

    if (raw.toLowerCase().startsWith('bearer ')) {
        return raw.slice(7).trim();
    }

    return raw;
};

const getAdminJwtConfig = () => ({
    accessSecret: process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'admin_access_secret',
    refreshSecret: process.env.ADMIN_JWT_REFRESH_SECRET || process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'admin_refresh_secret',
    accessExpiresIn: process.env.ADMIN_JWT_EXPIRES_IN || '2d',
    refreshExpiresIn: process.env.ADMIN_REFRESH_TOKEN_EXPIRES_IN || '7d',
});

const createAdminTokenPair = async (payload) => {
    const { accessSecret, refreshSecret, accessExpiresIn, refreshExpiresIn } = getAdminJwtConfig();
    const tokenPayload = {
        ...payload,
        role: 'admin',
    };

    return {
        accessToken: jwt.sign(tokenPayload, accessSecret, { expiresIn: accessExpiresIn }),
        refreshToken: jwt.sign(tokenPayload, refreshSecret, { expiresIn: refreshExpiresIn }),
    };
};

const verifyAdmin = asyncHandler(async (req, res, next) => {
    const token = parseAuthorizationToken(req.headers.authorization);

    if (!token) {
        throw new AuthFailureError('Admin token is required');
    }

    const { accessSecret } = getAdminJwtConfig();

    let payload;
    try {
        payload = jwt.verify(token, accessSecret);
    } catch (error) {
        throw new AuthFailureError('Invalid admin token');
    }

    if (!payload?.userId) {
        throw new AuthFailureError('Invalid admin token');
    }

    const admin = await Admin.findById(payload.userId)
        .select('_id name account status roles verify permissions lastLogin createdAt updatedAt')
        .lean();

    if (!admin || !isAdminRole(admin.roles)) {
        throw new ForbiddenError('Admin permission required');
    }

    if (admin.status !== 'active') {
        throw new ForbiddenError('Admin account is inactive');
    }

    req.admin = {
        ...payload,
        profile: admin,
    };
    req.user = req.admin;
    req.adminId = String(admin._id);

    return next();
});

module.exports = {
    verifyAdmin,
    createAdminTokenPair,
};
