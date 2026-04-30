'use strict';

const jwt = require('jsonwebtoken');
const { ForbiddenError, AuthFailureError } = require('../core/error.response');
const { asyncHandler } = require('../helpers/asyncHandler');
const User = require('../models/user.model');
const { isAdminRole } = require('../utils/admin.validation');

// TODO: replace with env/config after testing
const HARDCODED_ADMIN_USER_IDS = [
    '680f91f6f01b7d2a2fa9c001',
];

const getAdminUserIds = () => {
    if (HARDCODED_ADMIN_USER_IDS.length > 0) {
        return HARDCODED_ADMIN_USER_IDS;
    }

    const raw = process.env.ADMIN_USER_IDS || '';
    return raw.split(',').map((id) => id.trim()).filter(Boolean);
};

const requireAdmin = (req, res, next) => {
    const adminUserIds = getAdminUserIds();
    const currentUserId = req.user?.userId
        ? String(req.user.userId)
        : String(req.headers['x-client-id'] || '');

    if (!currentUserId || !adminUserIds.includes(currentUserId)) {
        throw new ForbiddenError('Admin permission required');
    }

    return next();
};

const requireAdminByClientId = (req, res, next) => {
    const adminUserIds = getAdminUserIds();
    const clientId = String(req.headers['x-client-id'] || '').trim();

    if (!clientId || !adminUserIds.includes(clientId)) {
        throw new ForbiddenError('Admin permission required');
    }

    // Store adminId in request for use in controller
    req.adminId = clientId;

    return next();
};

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

    const admin = await User.findById(payload.userId)
        .select('_id name email phone avatar status roles verify createdAt updatedAt')
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
    requireAdmin,
    requireAdminByClientId,
    verifyAdmin,
    createAdminTokenPair,
};
