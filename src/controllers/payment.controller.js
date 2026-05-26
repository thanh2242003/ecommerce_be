'use strict';

const { CREATED, SuccessResponse } = require('../core/success.response');
const PaymentService = require('../services/payment.service');

class PaymentController {
    createSePayPayment = async (req, res, next) => {
        new CREATED({
            message: 'Create SePay payment successfully',
            metadata: await PaymentService.createSePayPayment({
                userId: req.user.userId,
                orderId: req.body.orderId,
            }),
        }).send(res);
    };

    getPaymentStatus = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get payment status successfully',
            metadata: await PaymentService.getPaymentStatus({
                userId: req.user.userId,
                paymentId: req.params.paymentId,
            }),
        }).send(res);
    };

    getPaymentHistory = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get payment history successfully',
            metadata: await PaymentService.getPaymentHistory({
                userId: req.user.userId,
                query: req.query,
            }),
        }).send(res);
    };

    handleSePayWebhook = async (req, res, next) => {
        await PaymentService.processSePayWebhook({
            rawBody: req.body,
            headers: req.headers,
        });

        return res.status(200).json({ success: true });
    };
}

module.exports = new PaymentController();
