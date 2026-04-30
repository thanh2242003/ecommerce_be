'use strict';

const { SuccessResponse } = require('../core/success.response');
const AdminNotificationService = require('../services/admin.notification.service');

class AdminNotificationController {
    sendBulkNotifications = async (req, res, next) => {
        new SuccessResponse({
            message: 'Send bulk notifications successfully!',
            metadata: await AdminNotificationService.sendBulkNotifications(req.body),
        }).send(res);
    };
}

module.exports = new AdminNotificationController();
