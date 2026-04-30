'use strict';

const { Types } = require('mongoose');
const User = require('../models/user.model');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../core/error.response');
const { parsePagination, getPaginationMetadata } = require('../utils/pagination');
const { isAdminRole, normalizeUserStatus } = require('../utils/admin.validation');

const formatUser = (user) => {
    if (!user) {
        return user;
    }

    return {
        ...user,
        isAdmin: isAdminRole(user.roles),
    };
};

class AdminUserService {
    static async getUsers(query = {}) {
        const { page, limit, skip } = parsePagination(query);
        const filter = {};

        if (query.status) {
            filter.status = normalizeUserStatus(query.status);
        }

        if (query.keyword) {
            const keyword = String(query.keyword).trim();
            if (keyword) {
                filter.$or = [
                    { name: { $regex: keyword, $options: 'i' } },
                    { email: { $regex: keyword, $options: 'i' } },
                ];
            }
        }

        const [total, users] = await Promise.all([
            User.countDocuments(filter),
            User.find(filter)
                .select('_id name email phone address avatar status roles verify createdAt updatedAt')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
        ]);

        return {
            users: users.map(formatUser),
            pagination: getPaginationMetadata(total, page, limit),
        };
    }

    static async getUserById(userId) {
        if (!Types.ObjectId.isValid(userId)) {
            throw new BadRequestError('Invalid user ID');
        }

        const user = await User.findById(userId)
            .select('_id name email phone address avatar status roles verify createdAt updatedAt')
            .lean();

        if (!user) {
            throw new NotFoundError('User not found');
        }

        return formatUser(user);
    }

    static async updateUserStatus(userId, status, adminId) {
        if (!Types.ObjectId.isValid(userId)) {
            throw new BadRequestError('Invalid user ID');
        }

        const user = await User.findById(userId);
        if (!user) {
            throw new NotFoundError('User not found');
        }

        const normalizedStatus = normalizeUserStatus(status);
        const updatingToInactive = normalizedStatus === 'inactive';

        if (isAdminRole(user.roles) && updatingToInactive) {
            throw new ForbiddenError('Cannot ban another admin');
        }

        if (String(user._id) === String(adminId) && updatingToInactive) {
            throw new ForbiddenError('Cannot ban yourself');
        }

        user.status = normalizedStatus;
        await user.save();

        return formatUser(user.toObject());
    }
}

module.exports = AdminUserService;
