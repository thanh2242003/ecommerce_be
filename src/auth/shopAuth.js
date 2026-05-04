'use strict';

const { asyncHandler } = require('../helpers/asyncHandler');
const { AuthFailureError, NotFoundError } = require('../core/error.response');
const { findByUserId } = require('../services/keyToken.service');
const { validateShopStatus } = require('../utils/shop.validation');
const shopModel = require('../models/shop.model');
const JWT = require('jsonwebtoken');

const HEADER = {
    CLIENT_ID: 'x-client-id',
    AUTHORIZATION: 'authorization',
};

/**
 * Shop authentication middleware
 * Extracts and validates shopId from JWT token
 * Ensures user is a shop owner
 */
const shopAuthenticationV2 = asyncHandler(async (req, res, next) => {
    const userId = req.headers[HEADER.CLIENT_ID];

    if (!userId) {
        throw new AuthFailureError('Invalid request - missing client ID');
    }

    // Find key store for user
    const keyStore = await findByUserId(userId);

    if (!keyStore) {
        throw new NotFoundError('User credentials not found');
    }

    // Get access token
    const accessToken = req.headers[HEADER.AUTHORIZATION];

    if (!accessToken) {
        throw new AuthFailureError('Invalid request - missing access token');
    }

    try {
        // Verify access token
        const decodeUser = JWT.verify(accessToken, keyStore.publicKey);

        if (userId !== decodeUser.userId) {
            throw new AuthFailureError('Invalid user ID');
        }

        // Verify user is a shop owner
        const shop = await shopModel.findById(decodeUser.userId);

        if (!shop) {
            throw new NotFoundError('Shop not found');
        }

        // Check shop status and permissions
        validateShopStatus(shop);

        // Attach user and shop info to request
        req.user = decodeUser;
        req.keyStore = keyStore;
        req.shopId = decodeUser.shopId;
        req.shop = shop;

        return next();

    } catch (error) {
        throw error;
    }
});

/**
 * Optional shop authentication
 * Same as shopAuthenticationV2 but doesn't throw on invalid credentials
 */
const optionalShopAuth = async (req, res, next) => {
    try {
        const userId = req.headers[HEADER.CLIENT_ID];
        if (!userId) return next();

        const keyStore = await findByUserId(userId);
        if (!keyStore) return next();

        const accessToken = req.headers[HEADER.AUTHORIZATION];
        if (!accessToken) return next();

        const decodeUser = JWT.verify(accessToken, keyStore.publicKey);
        if (userId !== decodeUser.userId) return next();

        const shop = await shopModel.findById(decodeUser.shopId);
        if (!shop) return next();

        req.user = decodeUser;
        req.keyStore = keyStore;
        req.shopId = decodeUser.shopId;
        req.shop = shop;

    } catch (_) {
        // Ignore errors - treat as anonymous
    }

    return next();
};

module.exports = {
    shopAuthenticationV2,
    optionalShopAuth
};
