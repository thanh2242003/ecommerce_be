'use strict';

const bcrypt = require('bcrypt');
const Admin = require('../models/admin.model');
const { BadRequestError, AuthFailureError, ForbiddenError, NotFoundError } = require('../core/error.response');
const { getInforData } = require('../utils');
const { createAdminTokenPair } = require('../auth/adminAuth');
const { isAdminRole, validateAdminLoginInput } = require('../utils/admin.validation');

const escapeRegExp = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

class AdminAuthService {
    static async login({ account, password }) {
        validateAdminLoginInput({ account, password });

        const normalizedAccount = String(account).trim();
        const admin = await Admin.findOne({
            account: { $regex: `^${escapeRegExp(normalizedAccount)}$`, $options: 'i' }
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

        // Update last login and reset login attempts
        await Admin.findByIdAndUpdate(admin._id, {
            lastLogin: new Date()
        });

        const tokens = await createAdminTokenPair({
            userId: String(admin._id),
            account: admin.account,
            name: admin.name,
            roles: admin.roles,
        });

        return {
            admin: getInforData({
                fields: ['_id', 'name', 'account', 'status', 'roles', 'verify', 'createdAt', 'updatedAt'],
                object: admin.toObject(),
            }),
            tokens,
        };
    }

    static async getProfile(adminId) {
        if (!adminId) {
            throw new BadRequestError('Admin ID is required');
        }

        const admin = await Admin.findById(adminId)
            .select('_id name account status roles verify permissions lastLogin createdAt updatedAt')
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
