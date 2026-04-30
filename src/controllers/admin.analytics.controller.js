'use strict';

const { SuccessResponse } = require('../core/success.response');
const AdminAnalyticsService = require('../services/admin.analytics.service');

class AdminAnalyticsController {
    getOverview = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get analytics overview successfully!',
            metadata: await AdminAnalyticsService.getOverview(),
        }).send(res);
    };
}

module.exports = new AdminAnalyticsController();
