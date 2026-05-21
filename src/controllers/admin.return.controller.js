'use strict';

const { SuccessResponse } = require('../core/success.response');
const ReturnService = require('../services/return.service');

class AdminReturnController {

    /**
     * GET /v1/api/admin/return/requests
     * Get all return requests for admin review
     * Query: ?shopId=xxx&status=pending&page=1&limit=10
     */
    getReturns = async (req, res, next) => {
        const { shopId, status, page, limit } = req.query;

        new SuccessResponse({
            message: 'Get return requests successfully',
            metadata: await ReturnService.getReturnsForAdmin({
                shopId,
                status,
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 10
            })
        }).send(res);
    }

    /**
     * PATCH /v1/api/admin/return/requests/:id/approve
     * Admin approves return request
     * 
     * Body: {
     *   approvalReason: string (optional)
     * }
     */
    approveReturn = async (req, res, next) => {
        const adminId = req.admin.adminId || req.user.userId;
        const returnId = req.params.id;
        const { approvalReason } = req.body;

        new SuccessResponse({
            message: 'Return request approved successfully',
            metadata: await ReturnService.approveReturn({
                returnId,
                adminId,
                approvalReason
            })
        }).send(res);
    }

    /**
     * PATCH /v1/api/admin/return/requests/:id/reject
     * Admin rejects return request
     * 
     * Body: {
     *   approvalReason: string (required - reason for rejection)
     * }
     */
    rejectReturn = async (req, res, next) => {
        const adminId = req.admin.adminId || req.user.userId;
        const returnId = req.params.id;
        const { approvalReason } = req.body;

        new SuccessResponse({
            message: 'Return request rejected successfully',
            metadata: await ReturnService.rejectReturn({
                returnId,
                adminId,
                approvalReason
            })
        }).send(res);
    }

    /**
     * PATCH /v1/api/admin/return/requests/:id/complete
     * Admin completes return (processes refund)
     * 
     * Body: {
     *   refundAmount: number (optional, if different from requested amount)
     * }
     */
    completeReturn = async (req, res, next) => {
        const adminId = req.admin.adminId || req.user.userId;
        const returnId = req.params.id;
        const { refundAmount } = req.body;

        new SuccessResponse({
            message: 'Return completed successfully',
            metadata: await ReturnService.completeReturn({
                returnId,
                adminId,
                refundAmount
            })
        }).send(res);
    }

    /**
     * PATCH /v1/api/admin/return/requests/:id/cancel
     * Admin cancels a return request
     *
     * Body: { reason: string (optional) }
     */
    adminCancelReturn = async (req, res, next) => {
        const adminId = req.admin.adminId || req.user.userId;
        const returnId = req.params.id;
        const { reason } = req.body;

        new SuccessResponse({
            message: 'Return request cancelled by admin successfully',
            metadata: await ReturnService.adminCancelReturn({
                returnId,
                adminId,
                reason
            })
        }).send(res);
    }
}

module.exports = new AdminReturnController();
