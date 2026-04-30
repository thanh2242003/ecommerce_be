'use strict';

const { SuccessResponse } = require('../core/success.response');
const AdminShopService = require('../services/admin.shop.service');

class AdminShopController {
    getShops = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get shops successfully!',
            metadata: await AdminShopService.getShops(req.query),
        }).send(res);
    };

    getShopById = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get shop successfully!',
            metadata: await AdminShopService.getShopById(req.params.shopId),
        }).send(res);
    };

    updateShopStatus = async (req, res, next) => {
        new SuccessResponse({
            message: 'Update shop status successfully!',
            metadata: await AdminShopService.updateShopStatus(req.params.shopId, req.body.status, req.body.reason),
        }).send(res);
    };

    verifyShop = async (req, res, next) => {
        new SuccessResponse({
            message: 'Verify shop successfully!',
            metadata: await AdminShopService.verifyShop(req.params.shopId, req.adminId),
        }).send(res);
    };
}

module.exports = new AdminShopController();
