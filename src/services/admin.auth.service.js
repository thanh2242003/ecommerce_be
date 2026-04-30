'use strict';

const bcrypt = require('bcrypt');
const User = require('../models/user.model');
const { BadRequestError, AuthFailureError, ForbiddenError, NotFoundError } = require('../core/error.response');
const { getInforData } = require('../utils');
const { createAdminTokenPair } = require('../auth/adminAuth');
const { isAdminRole, validateAdminLoginInput } = require('../utils/admin.validation');

const escapeRegExp = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

class AdminAuthService {
    static async login({ email, password }) {
        validateAdminLoginInput({ email, password });

        const normalizedEmail = String(email).trim();
        const admin = await User.findOne({
            email: { $regex: `^${escapeRegExp(normalizedEmail)}$`, $options: 'i' }
        });

        if (!admin) {
            throw new AuthFailureError('Invalid admin credentials');
        }

        if (!isAdminRole(admin.roles)) {
            throw new ForbiddenError('Only admin accounts can login');
        }

        if (admin.status !== 'active') {
            throw new ForbiddenError('Admin account is inactive');
        }

        const isPasswordMatched = await bcrypt.compare(String(password), admin.password);
        if (!isPasswordMatched) {
            throw new AuthFailureError('Invalid admin credentials');
        }

        const tokens = await createAdminTokenPair({
            userId: String(admin._id),
            email: admin.email,
            name: admin.name,
            roles: admin.roles,
        });

        return {
            admin: getInforData({
                fields: ['_id', 'name', 'email', 'phone', 'avatar', 'status', 'roles', 'verify', 'createdAt', 'updatedAt'],
                object: admin.toObject(),
            }),
            tokens,
        };
    }

    static async getProfile(adminId) {
        if (!adminId) {
            throw new BadRequestError('Admin ID is required');
        }

        const admin = await User.findById(adminId)
            .select('_id name email phone avatar status roles verify createdAt updatedAt')
            .lean();

        if (!admin) {
            throw new NotFoundError('Admin not found');
        }

        if (!isAdminRole(admin.roles)) {
            throw new ForbiddenError('Admin permission required');
        }

        return admin;
    }
}

module.exports = AdminAuthService;
