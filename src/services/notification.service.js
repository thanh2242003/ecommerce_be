'use strict';

const { Types } = require('mongoose');
const userModel = require('../models/user.model');
const Notification = require('../models/notification.model');
const { BadRequestError, NotFoundError } = require('../core/error.response');

const INVALID_TOKEN_ERRORS = new Set([
    'messaging/registration-token-not-registered',
    'messaging/invalid-registration-token',
]);

const RETRYABLE_ERRORS = new Set([
    'messaging/internal-error',
    'messaging/server-unavailable',
    'messaging/unknown-error',
]);

const MAX_TOKENS_PER_BATCH = 500;
const RETRY_LIMIT = 2;

const chunk = (arr, size) => {
    const result = [];
    for (let i = 0; i < arr.length; i += size) {
        result.push(arr.slice(i, i + size));
    }
    return result;
};

class NotificationService {
    static async createNotification({ userId, title, body, type = 'system', data = {}, sendPush = true }) {
        if (!userId) throw new BadRequestError('userId is required');
        if (!title || !body) throw new BadRequestError('title and body are required');

        const validTypes = ['order', 'promo', 'promotion', 'system', 'test', 'custom'];
        if (!validTypes.includes(type)) {
            throw new BadRequestError('type must be one of: order, promo, promotion, system, test, custom');
        }

        const existingUser = await userModel.findById(userId).select('_id').lean();
        if (!existingUser) throw new NotFoundError('User not found');

        const created = await Notification.create({
            userId: new Types.ObjectId(userId),
            title: String(title),
            body: String(body),
            type,
            data: data || {},
            isRead: false,
        });

        if (sendPush) {
            try {
                const fcmData = {};
                Object.entries(data || {}).forEach(([key, value]) => {
                    fcmData[String(key)] = value == null ? '' : String(value);
                });
                fcmData.notificationId = String(created._id);
                fcmData.type = type;
                await this.sendNotification(userId, title, body, fcmData);
            } catch (error) {
                console.log(`[FCM] Push skipped/failed after DB save: ${error.message}`);
            }
        }

        return created.toObject();
    }

    static async getNotificationsByUser(userId, { page = 1, limit = 20 } = {}) {
        if (!userId) throw new BadRequestError('userId is required');

        const safePage = Math.max(1, Number(page) || 1);
        const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
        const skip = (safePage - 1) * safeLimit;

        const [items, total, unreadCount] = await Promise.all([
            Notification.find({ userId: new Types.ObjectId(userId) })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(safeLimit)
                .lean(),
            Notification.countDocuments({ userId: new Types.ObjectId(userId) }),
            this.unreadCount(userId),
        ]);

        return {
            items,
            pagination: {
                page: safePage,
                limit: safeLimit,
                total,
                totalPages: Math.max(1, Math.ceil(total / safeLimit)),
            },
            unreadCount,
        };
    }

    static async markAsRead(notificationId, userId = null) {
        if (!notificationId) throw new BadRequestError('notificationId is required');

        const query = { _id: notificationId };
        if (userId) query.userId = new Types.ObjectId(userId);

        const updated = await Notification.findOneAndUpdate(
            query,
            { $set: { isRead: true } },
            { new: true }
        ).lean();

        if (!updated) throw new NotFoundError('Notification not found');
        return updated;
    }

    static async markAllAsRead(userId) {
        if (!userId) throw new BadRequestError('userId is required');

        const result = await Notification.updateMany(
            { userId: new Types.ObjectId(userId), isRead: false },
            { $set: { isRead: true } }
        );

        return {
            matchedCount: result.matchedCount,
            modifiedCount: result.modifiedCount,
        };
    }

    static async unreadCount(userId) {
        if (!userId) throw new BadRequestError('userId is required');
        return Notification.countDocuments({
            userId: new Types.ObjectId(userId),
            isRead: false,
        });
    }

    static async deleteNotification(notificationId, userId = null) {
        if (!notificationId) throw new BadRequestError('notificationId is required');

        const query = { _id: notificationId };
        if (userId) query.userId = new Types.ObjectId(userId);

        const deleted = await Notification.findOneAndDelete(query).lean();
        if (!deleted) throw new NotFoundError('Notification not found');
        return deleted;
    }

    static async upsertFcmToken({ userId, fcmToken, oldFcmToken = null }) {
        if (!userId) throw new BadRequestError('userId is required');
        if (!fcmToken || typeof fcmToken !== 'string') {
            throw new BadRequestError('fcmToken is required');
        }

        const user = await userModel.findById(userId).select('_id fcmTokens').lean();
        if (!user) throw new NotFoundError('User not found');

        const cleanToken = fcmToken.trim();
        const cleanOldToken = oldFcmToken ? String(oldFcmToken).trim() : null;

        if (cleanOldToken && cleanOldToken !== cleanToken) {
            await userModel.updateOne(
                { _id: userId },
                { $pull: { fcmTokens: cleanOldToken } }
            );
        }

        await userModel.updateOne(
            { _id: userId },
            { $addToSet: { fcmTokens: cleanToken } }
        );

        return userModel
            .findById(userId)
            .select('_id name email fcmTokens')
            .lean();
    }

    static async deleteFcmToken({ userId, fcmToken }) {
        if (!userId) throw new BadRequestError('userId is required');
        if (!fcmToken || typeof fcmToken !== 'string') {
            throw new BadRequestError('fcmToken is required');
        }

        const user = await userModel.findById(userId).select('_id').lean();
        if (!user) throw new NotFoundError('User not found');

        await userModel.updateOne(
            { _id: userId },
            { $pull: { fcmTokens: fcmToken.trim() } }
        );

        return userModel
            .findById(userId)
            .select('_id name email fcmTokens')
            .lean();
    }

    static async sendNotification(userId, title, body, data = {}) {
        if (!userId) throw new BadRequestError('userId is required');
        if (!title || !body) throw new BadRequestError('title and body are required');

        let admin;
        try {
            admin = require('../configs/firebase.config');
        } catch (error) {
            throw new Error('Firebase is not configured on server');
        }

        const user = await userModel.findById(userId).select('_id fcmTokens').lean();
        if (!user) throw new NotFoundError('User not found');

        const tokens = Array.isArray(user.fcmTokens) ? user.fcmTokens : [];
        if (!tokens.length) {
            return {
                successCount: 0,
                failureCount: 0,
                removedInvalidCount: 0,
                message: 'No FCM tokens found for user',
            };
        }

        const tokenBatches = chunk(tokens, MAX_TOKENS_PER_BATCH);
        const invalidTokens = new Set();
        let successCount = 0;
        let failureCount = 0;

        for (const tokenBatch of tokenBatches) {
            let pending = tokenBatch;

            for (let attempt = 1; attempt <= RETRY_LIMIT && pending.length; attempt += 1) {
                const response = await admin.messaging().sendEachForMulticast({
                    tokens: pending,
                    notification: { title, body },
                    data,
                });

                const retryTokens = [];
                response.responses.forEach((result, index) => {
                    const token = pending[index];
                    if (result.success) {
                        successCount += 1;
                        return;
                    }

                    failureCount += 1;
                    const code = result.error?.code;
                    if (INVALID_TOKEN_ERRORS.has(code)) {
                        invalidTokens.add(token);
                        return;
                    }
                    if (RETRYABLE_ERRORS.has(code) && attempt < RETRY_LIMIT) {
                        retryTokens.push(token);
                    }
                });

                pending = retryTokens;
            }
        }

        if (invalidTokens.size > 0) {
            await userModel.updateOne(
                { _id: userId },
                { $pull: { fcmTokens: { $in: Array.from(invalidTokens) } } }
            );
            console.log(`[FCM] Removed ${invalidTokens.size} invalid token(s) for user ${userId}`);
        }

        console.log(
            `[FCM] sendNotification user=${userId} success=${successCount} failure=${failureCount}`
        );

        return {
            successCount,
            failureCount,
            removedInvalidCount: invalidTokens.size,
        };
    }
}

module.exports = NotificationService;
