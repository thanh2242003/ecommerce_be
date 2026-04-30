'use strict';

const express = require('express');
const router = express.Router();

const NotificationController = require('../../controllers/notification.controller');
const { asyncHandler } = require('../../helpers/asyncHandler');
const { authenticationV2 } = require('../../auth/authUtils');
const { requireAdmin } = require('../../auth/adminAuth');

router.post('/fcm-token', authenticationV2, asyncHandler(NotificationController.registerFcmToken));
router.delete('/fcm-token', authenticationV2, asyncHandler(NotificationController.deleteFcmToken));
router.post('/notifications/send', requireAdmin, asyncHandler(NotificationController.sendNotificationByAdmin));

module.exports = router;
