'use strict';

const express = require('express');
const router = express.Router();

const PaymentController = require('../../controllers/payment.controller');
const { asyncHandler } = require('../../auth/checkAuth');
const { authenticationV2 } = require('../../auth/authUtils');

router.post('/sepay/webhook', asyncHandler(PaymentController.handleSePayWebhook));

router.use(authenticationV2);

router.post('/sepay/create', asyncHandler(PaymentController.createSePayPayment));
router.get('/:paymentId/status', asyncHandler(PaymentController.getPaymentStatus));
router.get('/history', asyncHandler(PaymentController.getPaymentHistory));

module.exports = router;
