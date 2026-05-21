'use strict';

const express = require('express');
const router = express.Router();
const ReturnController = require('../../controllers/return.controller');
const { asyncHandler } = require('../../auth/checkAuth');
const { authenticationV2 } = require('../../auth/authUtils');

// All return routes require authentication
router.use(authenticationV2);

/**
 * POST /v1/api/return/request
 * Create a new return request
 * 
 * Body: {
 *   orderId: string,
 *   reason: string,
 *   description: string,
 *   returnItems: [ { variantId, quantity }, ... ]
 * }
 */
router.post('/request', asyncHandler(ReturnController.createReturnRequest));

/**
 * GET /v1/api/return/requests
 * Get all return requests for current user
 * Query: ?status=pending|approved|rejected|returned|completed|cancelled
 */
router.get('/requests', asyncHandler(ReturnController.getUserReturns));

/**
 * GET /v1/api/return/requests/:id
 * Get return request details
 */
router.get('/requests/:id', asyncHandler(ReturnController.getReturnById));

/**
 * PATCH /v1/api/return/requests/:id/cancel
 * Cancel return request
 */
router.patch('/requests/:id/cancel', asyncHandler(ReturnController.cancelReturnRequest));

/**
 * PATCH /v1/api/return/requests/:id/mark-returned
 * Mark return as "returned" (products sent back by user)
 * 
 * Body: {
 *   trackingNumber: string (optional)
 * }
 */
router.patch('/requests/:id/mark-returned', asyncHandler(ReturnController.markAsReturned));

module.exports = router;
