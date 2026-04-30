'use strict';

const { ForbiddenError } = require('../core/error.response');

/**
 * Check shop status and throw appropriate error
 * @param {object} shop - Shop object
 * @throws {ForbiddenError} If shop is not active
 */
const validateShopStatus = (shop) => {
    if (!shop) {
        return;
    }

    if (shop.status === 'inactive') {
        throw new ForbiddenError('Shop account is pending verification by admin. Please wait or contact support.');
    }

    if (shop.status === 'blocked') {
        const reason = shop.blockedReason ? ` Reason: ${shop.blockedReason}` : '';
        throw new ForbiddenError(`Shop account has been blocked.${reason}`);
    }

    if (shop.status !== 'active') {
        throw new ForbiddenError('Shop account is not active');
    }
};

/**
 * Format shop status info for API response
 * @param {object} shop - Shop object
 * @returns {object} Formatted status info
 */
const formatShopStatusInfo = (shop) => {
    if (!shop) {
        return null;
    }

    return {
        status: shop.status,
        isActive: shop.status === 'active',
        isBlocked: shop.status === 'blocked',
        isPending: shop.status === 'inactive',
        verify: shop.verify,
        verifiedAt: shop.verifiedAt,
        blockedAt: shop.blockedAt,
        blockedReason: shop.blockedReason || '',
    };
};

module.exports = {
    validateShopStatus,
    formatShopStatusInfo,
};
