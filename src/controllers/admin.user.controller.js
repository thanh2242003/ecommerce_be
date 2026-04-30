'use strict';

const { SuccessResponse } = require('../core/success.response');
const AdminUserService = require('../services/admin.user.service');

class AdminUserController {
    getUsers = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get users successfully!',
            metadata: await AdminUserService.getUsers(req.query),
        }).send(res);
    };

    getUserById = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get user successfully!',
            metadata: await AdminUserService.getUserById(req.params.userId),
        }).send(res);
    };

    updateUserStatus = async (req, res, next) => {
        new SuccessResponse({
            message: 'Update user status successfully!',
            metadata: await AdminUserService.updateUserStatus(req.params.userId, req.body.status, req.adminId),
        }).send(res);
    };
}

module.exports = new AdminUserController();
