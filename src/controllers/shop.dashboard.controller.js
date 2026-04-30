'use strict';

const { SuccessResponse } = require('../core/success.response');
const { asyncHandler } = require('../auth/checkAuth');
const ShopDashboardService = require('../services/shop.dashboard.service');
const { formatShopStatusInfo } = require('../utils/shop.validation');

class ShopDashboardController {
    /**
     * GET /v1/api/shop/dashboard
     * Get comprehensive shop dashboard data
     */
    getDashboard = asyncHandler(async (req, res, next) => {
        const shopId = req.shopId;

        const dashboardData = await ShopDashboardService.getShopDashboard(shopId);

        new SuccessResponse({
            message: 'Get shop dashboard successfully!',
            metadata: dashboardData
        }).send(res);
    });

    /**
     * GET /v1/api/shop/status
     * Get shop account status information
     */
    getShopStatus = asyncHandler(async (req, res, next) => {
        const shop = req.shop;

        const statusInfo = formatShopStatusInfo(shop);

        new SuccessResponse({
            message: 'Get shop status successfully!',
            metadata: statusInfo
        }).send(res);
    });
}

module.exports = new ShopDashboardController();
