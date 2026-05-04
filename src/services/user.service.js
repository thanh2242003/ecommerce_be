// 'use strict';

// const userModel = require("../models/user.model");

// const findByEmail = async ({ email, select = {
//     email: 1, password: 1, name: 1, status: 1, roles: 1, phone: 1, address: 1, avatar: 1
// } }) => {
//     return await userModel.findOne({ email }).select(select).lean()
// }

// module.exports = {
//     findByEmail
// }

'use strict';

const bcrypt = require('bcrypt');
const { BadRequestError, NotFoundError } = require('../core/error.response');
const userModel = require('../models/user.model');

class UserService {

    // ================= FIND BY EMAIL =================
    static async findByEmail({ email, select = {
        email: 1,
        password: 1,
        name: 1,
        status: 1,
        roles: 1,
        phone: 1,
        address: 1,
        avatar: 1
    } }) {
        return await userModel.findOne({ email }).select(select).lean();
    }

    // ================= GET PROFILE =================
    static async getProfile(userId) {
        const user = await userModel.findById(userId)
            .select('name email phone address avatar status roles verify')
            .lean();

        if (!user) {
            throw new NotFoundError('User not found');
        }

        return user;
    }

    // ================= UPDATE PROFILE =================
    static async updateProfile(userId, { name, phone, address, avatar }) {
        const updateData = {};

        if (name !== undefined) updateData.name = name;
        if (phone !== undefined) updateData.phone = phone;
        if (address !== undefined) updateData.address = address;
        if (avatar !== undefined) updateData.avatar = avatar;

        const user = await userModel.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true }
        ).select('name email phone address avatar status roles verify');

        if (!user) {
            throw new NotFoundError('User not found');
        }

        return user;
    }

    // ================= CHANGE PASSWORD =================
    static async changePassword(userId, oldPassword, newPassword) {
        if (!oldPassword || !newPassword) {
            throw new BadRequestError('oldPassword and newPassword are required');
        }

        if (oldPassword === newPassword) {
            throw new BadRequestError('New password must be different from old password');
        }

        const user = await userModel.findById(userId);

        if (!user) {
            throw new NotFoundError('User not found');
        }

        // Verify old password
        const isPasswordMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isPasswordMatch) {
            throw new BadRequestError('Old password is incorrect');
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await userModel.findByIdAndUpdate(
            userId,
            { $set: { password: hashedPassword } }
        );

        return { message: 'Password changed successfully' };
    }

    // ================= UPDATE FCM TOKEN =================
    static async updateFcmToken(userId, fcmToken) {
        if (!fcmToken) {
            throw new BadRequestError('fcmToken is required');
        }

        const user = await userModel.findById(userId);

        if (!user) {
            throw new NotFoundError('User not found');
        }

        // Add token if not already exists
        if (!user.fcmTokens.includes(fcmToken)) {
            user.fcmTokens.push(fcmToken);
            await user.save();
        }

        return { message: 'FCM token updated successfully' };
    }

    // ================= REMOVE FCM TOKEN =================
    static async removeFcmToken(userId, fcmToken) {
        if (!fcmToken) {
            throw new BadRequestError('fcmToken is required');
        }

        const user = await userModel.findByIdAndUpdate(
            userId,
            { $pull: { fcmTokens: fcmToken } },
            { new: true }
        );

        if (!user) {
            throw new NotFoundError('User not found');
        }

        return { message: 'FCM token removed successfully' };
    }
}

module.exports = UserService;
