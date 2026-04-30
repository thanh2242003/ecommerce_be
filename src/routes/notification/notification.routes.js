'use strict';

const express = require('express');
const router = express.Router();

const NotificationController = require('../../controllers/notification.controller');
const { asyncHandler } = require('../../helpers/asyncHandler');
const { authenticationV2 } = require('../../auth/authUtils');

router.use(authenticationV2);

router.get('/notifications/:userId', asyncHandler(NotificationController.getNotificationsByUser));
router.patch('/notifications/read/:id', asyncHandler(NotificationController.markAsRead));
router.patch('/notifications/read-all/:userId', asyncHandler(NotificationController.markAllAsRead));
router.get('/notifications/unread-count/:userId', asyncHandler(NotificationController.getUnreadCount));
router.delete('/notifications/:id', asyncHandler(NotificationController.deleteNotification));

module.exports = router;
