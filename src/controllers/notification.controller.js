'use strict';

const { SuccessResponse } = require('../core/success.response');
const { ForbiddenError } = require('../core/error.response');
const NotificationService = require('../services/notification.service');

class NotificationController {
    getNotificationsByUser = async (req, res, next) => {
        const userId = req.params.userId;
        if (req.user?.userId && String(req.user.userId) !== String(userId)) {
            throw new ForbiddenError('You can only view your own notifications');
        }

        new SuccessResponse({
            message: 'Get notifications successfully!',
            metadata: await NotificationService.getNotificationsByUser(userId, req.query),
        }).send(res);
    };

    markAsRead = async (req, res, next) => {
        new SuccessResponse({
            message: 'Notification marked as read',
            metadata: await NotificationService.markAsRead(req.params.id, req.user?.userId),
        }).send(res);
    };

    markAllAsRead = async (req, res, next) => {
        const userId = req.params.userId;
        if (req.user?.userId && String(req.user.userId) !== String(userId)) {
            throw new ForbiddenError('You can only update your own notifications');
        }

        new SuccessResponse({
            message: 'All notifications marked as read',
            metadata: await NotificationService.markAllAsRead(userId),
        }).send(res);
    };

    getUnreadCount = async (req, res, next) => {
        const userId = req.params.userId;
        if (req.user?.userId && String(req.user.userId) !== String(userId)) {
            throw new ForbiddenError('You can only view your own notifications');
        }

        new SuccessResponse({
            message: 'Get unread notification count successfully!',
            metadata: {
                unreadCount: await NotificationService.unreadCount(userId),
            },
        }).send(res);
    };

    deleteNotification = async (req, res, next) => {
        new SuccessResponse({
            message: 'Notification deleted successfully',
            metadata: await NotificationService.deleteNotification(req.params.id, req.user?.userId),
        }).send(res);
    };

    registerFcmToken = async (req, res, next) => {
        const authUserId = req.user?.userId;
        const bodyUserId = req.body?.userId;

        new SuccessResponse({
            message: 'FCM token saved successfully!',
            metadata: await NotificationService.upsertFcmToken({
                userId: authUserId || bodyUserId,
                fcmToken: req.body?.fcmToken,
                oldFcmToken: req.body?.oldFcmToken,
            }),
        }).send(res);
    };

    deleteFcmToken = async (req, res, next) => {
        const authUserId = req.user?.userId;
        const bodyUserId = req.body?.userId;

        new SuccessResponse({
            message: 'FCM token removed successfully!',
            metadata: await NotificationService.deleteFcmToken({
                userId: authUserId || bodyUserId,
                fcmToken: req.body?.fcmToken,
            }),
        }).send(res);
    };

    sendNotificationByAdmin = async (req, res, next) => {
        new SuccessResponse({
            message: 'Notification created and sent successfully!',
            metadata: await NotificationService.createNotification({
                userId: req.body?.userId,
                title: req.body?.title,
                body: req.body?.body,
                type: req.body?.type || 'system',
                data: req.body?.data || {},
                sendPush: true,
            }),
        }).send(res);
    };
}

module.exports = new NotificationController();
