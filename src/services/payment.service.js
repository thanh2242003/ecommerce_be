'use strict';

const mongoose = require('mongoose');
const { BadRequestError, NotFoundError, AuthFailureError } = require('../core/error.response');
const { parsePagination, getPaginationMetadata } = require('../utils/pagination');
const NotificationService = require('./notification.service');
const Order = require('../models/order.model');
const OrderService = require('./order.service');
const {
    createPayment,
    findPaymentByIdForUser,
    findPendingPaymentByOrder,
    listPaymentsByUser,
    findPaymentByCode,
    findPaymentByTransactionId,
    acquirePaymentForProcessing,
    markPaymentSuccess,
    markPaymentFailed,
    markPaymentExpired,
    findExpiredPendingPaymentsByUser,
    upsertWebhookLog,
    markWebhookProcessed,
    incrementWebhookRetry,
} = require('../models/repositories/payment.repo');
const {
    verifySePaySignature,
    parseSePayPayload,
    validateSePayPayload,
    resolveSePayPaymentCode,
} = require('../utils/sepayWebhook');

const PAYMENT_TIMEOUT_MINUTES = Number(process.env.SEPAY_PAYMENT_TIMEOUT_MINUTES || 15);

class PaymentService {
    static buildPaymentCode(orderId) {
        const stamp = Date.now().toString().slice(-8);
        return `OD${String(orderId).slice(-6).toUpperCase()}${stamp}`;
    }

    static buildQrData({ paymentCode, amount }) {
        const bankAccount = process.env.SEPAY_BANK_ACCOUNT || '';
        const bankName = process.env.SEPAY_BANK_NAME || '';

        return {
            paymentCode,
            amount,
            bankName,
            bankAccount,
            transferContent: paymentCode,
            qrText: `https://qr.sepay.vn/img?acc=${encodeURIComponent(bankAccount)}&bank=${encodeURIComponent(bankName)}&amount=${amount}&des=${encodeURIComponent(paymentCode)}`,
        };
    }

    static async expirePendingPaymentsForUser({ userId }) {
        const now = new Date();
        const expired = await findExpiredPendingPaymentsByUser({ userId, now, limit: 50 });

        for (const payment of expired) {
            const updated = await markPaymentExpired({ paymentId: payment._id, now });
            if (updated) {
                await OrderService.cancelOrderByPaymentTimeout({
                    orderId: payment.orderId,
                    cancelReason: 'Payment timeout',
                });
            }
        }
    }

    static async createSePayPayment({ userId, orderId }) {
        if (!orderId) {
            throw new BadRequestError('orderId is required');
        }

        await this.expirePendingPaymentsForUser({ userId });
        await OrderService.expirePendingOnlineOrdersForUser({ userId });

        const order = await Order.findOne({ _id: orderId, userId }).lean();
        if (!order) {
            throw new NotFoundError('Order not found');
        }

        if (order.status !== 'pending') {
            throw new BadRequestError('Only pending order can create SePay payment');
        }

        if (order.paymentMethod !== 'bank_transfer') {
            throw new BadRequestError('Only bank_transfer order can create SePay payment');
        }

        if (order.paymentStatus !== 'pending') {
            throw new BadRequestError(`Only pending paymentStatus can create SePay payment`);
        }

        const existingPending = await findPendingPaymentByOrder({ orderId, userId });
        if (existingPending) {
            return existingPending;
        }

        const amount = Number(order.finalPrice || 0);
        if (amount <= 0) {
            throw new BadRequestError('Invalid order amount');
        }

        const paymentCode = this.buildPaymentCode(order._id);
        const expiredAt = new Date(Date.now() + PAYMENT_TIMEOUT_MINUTES * 60 * 1000);

        const payment = await createPayment({
            orderId: order._id,
            userId,
            amount,
            paymentMethod: 'SEPAY',
            qrData: this.buildQrData({ paymentCode, amount }),
            status: 'PENDING',
            expiredAt,
        });

        await Order.findByIdAndUpdate(order._id, {
            $set: {
                paymentMethod: 'bank_transfer',
                paymentStatus: 'pending',
                paymentExpiredAt: expiredAt,
                transactionId: null,
                paidAt: null,
            },
        });

        return payment.toObject();
    }

    static async getPaymentStatus({ userId, paymentId }) {
        await this.expirePendingPaymentsForUser({ userId });
        await OrderService.expirePendingOnlineOrdersForUser({ userId });

        const payment = await findPaymentByIdForUser({ paymentId, userId });
        if (!payment) {
            throw new NotFoundError('Payment not found');
        }

        return payment;
    }

    static async getPaymentHistory({ userId, query = {} }) {
        await this.expirePendingPaymentsForUser({ userId });
        await OrderService.expirePendingOnlineOrdersForUser({ userId });

        const { page, limit, skip } = parsePagination(query);
        const { items, total } = await listPaymentsByUser({ userId, skip, limit });

        return {
            items,
            pagination: getPaginationMetadata(total, page, limit),
        };
    }

    static async processSePayWebhook({ rawBody, headers }) {
        const signature = headers['x-sepay-signature'];
        const timestamp = headers['x-sepay-timestamp'];

        const verifyResult = verifySePaySignature({
            rawBody,
            signature,
            timestamp,
            secret: process.env.SEPAY_WEBHOOK_SECRET,
        });

        if (!verifyResult.ok) {
            throw new AuthFailureError(verifyResult.reason);
        }

        let payload;
        try {
            payload = parseSePayPayload(rawBody);
        } catch (error) {
            throw new BadRequestError('Invalid webhook JSON payload');
        }

        const payloadValidation = validateSePayPayload(payload);
        if (!payloadValidation.ok) {
            throw new BadRequestError(payloadValidation.reason);
        }

        const eventId = String(payload.id);
        const { log, isInserted } = await upsertWebhookLog({
            eventId,
            payload,
            signature,
            timestamp,
        });

        if (!isInserted && log?.processed) {
            return { duplicate: true };
        }

        try {
            const duplicateTransaction = await findPaymentByTransactionId(String(payload.id));
            if (duplicateTransaction && duplicateTransaction.status === 'SUCCESS') {
                await markWebhookProcessed({ eventId, processResult: 'duplicate_transaction' });
                return { duplicate: true };
            }

            const paymentCode = resolveSePayPaymentCode(payload);
            const payment = await findPaymentByCode({ paymentCode });
            if (!payment) {
                await markWebhookProcessed({ eventId, processResult: 'payment_not_found' });
                return { ignored: true };
            }

            if (payment.status === 'SUCCESS') {
                await markWebhookProcessed({ eventId, processResult: 'already_success' });
                return { duplicate: true };
            }

            if (['FAILED', 'EXPIRED'].includes(payment.status)) {
                await markWebhookProcessed({ eventId, processResult: `payment_already_${payment.status.toLowerCase()}` });
                console.log(`[SePay] ignored webhook ${eventId}: payment already ${payment.status}`);
                return { ignored: true };
            }

            const order = await Order.findById(payment.orderId).lean();
            if (!order) {
                await markWebhookProcessed({ eventId, processResult: 'order_not_found' });
                console.log(`[SePay] ignored webhook ${eventId}: order not found for payment ${payment._id}`);
                return { ignored: true };
            }

            const closedPaymentStatuses = ['failed', 'expired', 'refund_pending', 'refunded'];
            if (
                order.status === 'cancelled' ||
                closedPaymentStatuses.includes(order.paymentStatus)
            ) {
                await markWebhookProcessed({ eventId, processResult: 'order_not_payable' });
                console.log(
                    `[SePay] ignored webhook ${eventId}: order ${order._id} status=${order.status}, paymentStatus=${order.paymentStatus}`
                );
                return { ignored: true };
            }

            if (
                order.paymentMethod !== 'bank_transfer' ||
                order.status !== 'pending' ||
                order.paymentStatus !== 'pending'
            ) {
                await markWebhookProcessed({ eventId, processResult: 'order_not_payable' });
                console.log(
                    `[SePay] ignored webhook ${eventId}: order ${order._id} paymentMethod=${order.paymentMethod}, status=${order.status}, paymentStatus=${order.paymentStatus}`
                );
                return { ignored: true };
            }

            if (payment.expiredAt && new Date(payment.expiredAt).getTime() < Date.now()) {
                await markPaymentExpired({ paymentId: payment._id, now: new Date() });
                await OrderService.cancelOrderByPaymentTimeout({
                    orderId: payment.orderId,
                    cancelReason: 'Payment timeout',
                });
                await markWebhookProcessed({ eventId, processResult: 'expired' });
                return { expired: true };
            }

            if (String(payload.transferType).toLowerCase() !== 'in') {
                await markPaymentFailed({
                    paymentId: payment._id,
                    transactionId: String(payload.id),
                    reason: 'Unsupported transferType',
                });
                await OrderService.cancelOrderByPaymentFailure({
                    orderId: payment.orderId,
                    paymentStatus: 'failed',
                    cancelReason: 'Unsupported transferType',
                });
                await markWebhookProcessed({ eventId, processResult: 'invalid_transfer_type' });
                return { failed: true };
            }

            const callbackAmount = Number(payload.transferAmount || 0);
            if (callbackAmount !== Number(payment.amount)) {
                await markPaymentFailed({
                    paymentId: payment._id,
                    transactionId: String(payload.id),
                    reason: 'Amount mismatch',
                });
                await OrderService.cancelOrderByPaymentFailure({
                    orderId: payment.orderId,
                    paymentStatus: 'failed',
                    cancelReason: 'Amount mismatch',
                });
                await markWebhookProcessed({ eventId, processResult: 'amount_mismatch' });
                return { failed: true };
            }

            const lockPayment = await acquirePaymentForProcessing({
                paymentId: payment._id,
                transactionId: String(payload.id),
                now: new Date(),
            });

            if (!lockPayment) {
                await markWebhookProcessed({ eventId, processResult: 'race_lost' });
                return { duplicate: true };
            }

            const session = await mongoose.startSession();
            session.startTransaction();

            try {
                await OrderService.markOrderPaidFromPayment({
                    orderId: payment.orderId,
                    transactionId: String(payload.id),
                    paymentMethod: 'bank_transfer',
                    session,
                });

                await markPaymentSuccess({
                    paymentId: payment._id,
                    transactionId: String(payload.id),
                    webhookPayload: payload,
                    now: new Date(),
                    session,
                });

                await session.commitTransaction();
            } catch (error) {
                await session.abortTransaction();
                throw error;
            } finally {
                session.endSession();
            }

            await markWebhookProcessed({ eventId, processResult: 'success' });

            try {
                await NotificationService.createNotification({
                    userId: payment.userId,
                    title: 'Payment successful',
                    body: `Your payment for order ${payment.orderId} has been confirmed.`,
                    type: 'order',
                    data: {
                        orderId: String(payment.orderId),
                        paymentId: String(payment._id),
                        transactionId: String(payload.id),
                    },
                    sendPush: true,
                });
            } catch (notifyError) {
                console.log(`[SePay] notification error: ${notifyError.message}`);
            }

            return { processed: true };
        } catch (error) {
            await incrementWebhookRetry({ eventId, errorMessage: error.message });
            throw error;
        }
    }
}

module.exports = PaymentService;
