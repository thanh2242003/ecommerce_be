'use strict';

const NotificationService = require('../services/notification.service');
const { validateBulkNotificationInput } = require('../utils/admin.validation');

class AdminNotificationService {
    static async sendBulkNotifications(payload) {
        const { userIds, title, body, type, data } = validateBulkNotificationInput(payload);

        const results = await Promise.allSettled(
            userIds.map((userId) =>
                NotificationService.createNotification({
                    userId,
                    title,
                    body,
                    type,
                    data: data || {},
                    sendPush: true,
                })
            )
        );

        const notifications = [];
        const failedRecipients = [];

        results.forEach((result, index) => {
            const userId = userIds[index];
            if (result.status === 'fulfilled') {
                notifications.push(result.value);
                return;
            }

            failedRecipients.push({
                userId,
                message: result.reason?.message || 'Send notification failed',
            });
        });

        return {
            requestedCount: userIds.length,
            successCount: notifications.length,
            failureCount: failedRecipients.length,
            notifications,
            failedRecipients,
        };
    }
}

module.exports = AdminNotificationService;
