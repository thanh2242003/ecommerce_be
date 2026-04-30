'use strict';

const { SuccessResponse } = require('../core/success.response');
const AdminAuthService = require('../services/admin.auth.service');

class AdminAuthController {
    login = async (req, res, next) => {
        new SuccessResponse({
            message: 'Admin login successfully!',
            metadata: await AdminAuthService.login(req.body),
        }).send(res);
    };

    profile = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get admin profile successfully!',
            metadata: await AdminAuthService.getProfile(req.adminId),
        }).send(res);
    };
}

module.exports = new AdminAuthController();
