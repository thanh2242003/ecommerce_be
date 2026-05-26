'use strict';

const { CREATED, SuccessResponse } = require('../core/success.response');
const ReturnService = require('../services/return.service');

class ReturnController {

    /**
     * POST /v1/api/return/request
     * User creates a return request
     * 
     * Body: {
     *   orderId: ObjectId,
     *   reason: string (required),
     *   description: string,
     *   returnItems: [ { variantId, quantity }, ... ]  // optional, default: return all
     * }
     */
    createReturnRequest = async (req, res, next) => {
        const userId = req.user.userId;
        const { orderId, reason, description, returnItems } = req.body;

        new CREATED({
            message: 'Return request created successfully',
            metadata: await ReturnService.createReturn({
                userId,
                orderId,
                reason,
                description,
                returnItems
            })
        }).send(res);
    }

    /**
     * GET /v1/api/return/requests
     * Get all return requests for user
     * Query: ?status=pending|approved|rejected|returned|completed|cancelled
     */
    getUserReturns = async (req, res, next) => {
        const userId = req.user.userId;
        const { status } = req.query;

        new SuccessResponse({
            message: 'Get return requests successfully',
            metadata: await ReturnService.getReturnsByUser({ userId, status })
        }).send(res);
    }

    /**
     * GET /v1/api/return/requests/:id
     * Get return request details
     */
    getReturnById = async (req, res, next) => {
        const userId = req.user.userId;
        const returnId = req.params.id;

        new SuccessResponse({
            message: 'Get return request successfully',
            metadata: await ReturnService.getReturnById({ returnId, userId })
        }).send(res);
    }

    /**
     * PATCH /v1/api/return/requests/:id/cancel
     * User cancels their return request
     */
    cancelReturnRequest = async (req, res, next) => {
        const userId = req.user.userId;
        const returnId = req.params.id;

        new SuccessResponse({
            message: 'Return request cancelled successfully',
            metadata: await ReturnService.cancelReturn({ returnId, userId })
        }).send(res);
    }

    /**
     * PATCH /v1/api/return/requests/:id/mark-returned
     * User marks return as "returned" (products sent back)
     * 
     * Body: {
     *   trackingNumber: string (optional)
     * }
     */
    markAsReturned = async (req, res, next) => {
        const userId = req.user.userId;
        const returnId = req.params.id;
        const { trackingNumber } = req.body;

        new SuccessResponse({
            message: 'Return marked as returned successfully',
            metadata: await ReturnService.markAsReturned({
                returnId,
                userId,
                trackingNumber
            })
        }).send(res);
    }
}

module.exports = new ReturnController();
