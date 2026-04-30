'use strict';

const { CREATED, SuccessResponse } = require('../core/success.response');
const SearchHistoryService = require('../services/search_history.service');

class SearchHistoryController {

    /**
     * POST /v1/api/search/history
     *
     * Save a search keyword for a user.
     * Body: { userId: string, keyword: string }
     */
    saveHistory = async (req, res, next) => {
        const { userId, keyword } = req.body;

        const result = await SearchHistoryService.saveKeyword(userId, keyword);

        // skipped = consecutive duplicate — still a 200 OK, just no write
        if (result?.skipped) {
            return new SuccessResponse({
                message: 'Keyword not saved (duplicate consecutive search)',
                metadata: result
            }).send(res);
        }

        return new CREATED({
            message: 'Search keyword saved successfully',
            metadata: {
                userId: result.userId,
                keyword: result.keyword,
                createdAt: result.createdAt
            }
        }).send(res);
    }

    /**
     * GET /v1/api/search/history/:userId
     *
     * Retrieve the search history of a user (most-recent first).
     */
    getHistory = async (req, res, next) => {
        const { userId } = req.params;
        const limit = parseInt(req.query.limit) || 20;

        return new SuccessResponse({
            message: 'Search history retrieved successfully',
            metadata: await SearchHistoryService.getHistory(userId, limit)
        }).send(res);
    }

    /**
     * DELETE /v1/api/search/history/:userId
     *
     * Clear all search history for a user.
     */
    clearHistory = async (req, res, next) => {
        const { userId } = req.params;

        return new SuccessResponse({
            message: 'Search history cleared successfully',
            metadata: await SearchHistoryService.clearHistory(userId)
        }).send(res);
    }
}

module.exports = new SearchHistoryController();
