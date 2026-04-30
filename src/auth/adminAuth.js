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
    // Accept token from several common places to be more tolerant during testing
    const rawAuth = req.headers.authorization || req.headers['x-access-token'] || req.headers['access-token'] || req.headers['x-access-token'];
    const token = parseAuthorizationToken(rawAuth);

    if (!token) {
        throw new AuthFailureError('Admin token is required (use "Authorization: Bearer <token>" or "x-access-token: <token>")');
    }

    const { accessSecret } = getAdminJwtConfig();

    let payload;
    try {
        payload = jwt.verify(token, accessSecret);
    } catch (error) {
        throw new AuthFailureError(`Invalid admin token: ${error.message}`);
    }

    if (!payload?.userId) {
        throw new AuthFailureError('Invalid admin token: missing userId in token payload');
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
    // Helpful debug when running locally: attach token payload for troubleshooting
    if (process.env.NODE_ENV !== 'production') {
        console.debug('[verifyAdmin] token payload:', payload);
    }
    req.user = req.admin;
    req.adminId = String(admin._id);

    return next();
});

module.exports = {
    verifyAdmin,
    createAdminTokenPair,
};
