'use strict';

const Payment = require('../payment.model');
const WebhookLog = require('../webhookLog.model');

const createPayment = async (payload) => {
    return Payment.create(payload);
};

const findPaymentByIdForUser = async ({ paymentId, userId }) => {
    return Payment.findOne({ _id: paymentId, userId }).lean();
};

const findPendingPaymentByOrder = async ({ orderId, userId, now = new Date() }) => {
    return Payment.findOne({
        orderId,
        userId,
        status: { $in: ['PENDING', 'PROCESSING'] },
        expiredAt: { $gt: now },
    }).sort({ createdAt: -1 }).lean();
};

const listPaymentsByUser = async ({ userId, skip, limit }) => {
    const [items, total] = await Promise.all([
        Payment.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        Payment.countDocuments({ userId }),
    ]);

    return { items, total };
};

const findPaymentByCode = async ({ paymentCode }) => {
    return Payment.findOne({ 'qrData.paymentCode': paymentCode }).sort({ createdAt: -1 });
};

const findPaymentByTransactionId = async (transactionId) => {
    return Payment.findOne({ transactionId }).lean();
};

const acquirePaymentForProcessing = async ({ paymentId, transactionId, now = new Date() }) => {
    return Payment.findOneAndUpdate(
        {
            _id: paymentId,
            status: { $in: ['PENDING', 'PROCESSING'] },
        },
        {
            $set: {
                status: 'PROCESSING',
                transactionId,
                lastWebhookAt: now,
            },
        },
        { new: true }
    );
};

const markPaymentSuccess = async ({ paymentId, transactionId, webhookPayload, now = new Date(), session = null }) => {
    return Payment.findByIdAndUpdate(
        paymentId,
        {
            $set: {
                status: 'SUCCESS',
                transactionId,
                paidAt: now,
                lastWebhookAt: now,
                failureReason: null,
                'qrData.webhookPayload': webhookPayload,
            },
        },
        { new: true, session }
    );
};

const markPaymentFailed = async ({ paymentId, transactionId = null, reason, now = new Date() }) => {
    const setData = {
        status: 'FAILED',
        failureReason: reason,
        lastWebhookAt: now,
    };

    if (transactionId) {
        setData.transactionId = transactionId;
    }

    return Payment.findByIdAndUpdate(
        paymentId,
        { $set: setData },
        { new: true }
    );
};

const markPaymentExpired = async ({ paymentId, now = new Date() }) => {
    return Payment.findOneAndUpdate(
        {
            _id: paymentId,
            status: { $in: ['PENDING', 'PROCESSING'] },
            expiredAt: { $lte: now },
        },
        {
            $set: {
                status: 'EXPIRED',
                failureReason: 'Payment timeout',
            },
        },
        { new: true }
    );
};

const findExpiredPendingPaymentsByUser = async ({ userId, now = new Date(), limit = 20 }) => {
    return Payment.find({
        userId,
        status: { $in: ['PENDING', 'PROCESSING'] },
        expiredAt: { $lte: now },
    }).sort({ expiredAt: 1 }).limit(limit);
};

const upsertWebhookLog = async ({ eventId, payload, signature, timestamp }) => {
    const result = await WebhookLog.updateOne(
        { eventId },
        {
            $setOnInsert: {
                eventId,
                payload,
                signature,
                timestamp,
                processed: false,
                retryCount: 0,
            },
        },
        { upsert: true }
    );

    const log = await WebhookLog.findOne({ eventId }).lean();
    const isInserted = result.upsertedCount > 0;

    return { log, isInserted };
};

const markWebhookProcessed = async ({ eventId, processResult }) => {
    return WebhookLog.findOneAndUpdate(
        { eventId },
        {
            $set: {
                processed: true,
                processResult,
                errorMessage: null,
            },
        },
        { new: true }
    ).lean();
};

const incrementWebhookRetry = async ({ eventId, errorMessage }) => {
    return WebhookLog.findOneAndUpdate(
        { eventId },
        {
            $inc: { retryCount: 1 },
            $set: { errorMessage: errorMessage || 'Unknown error' },
        },
        { new: true }
    ).lean();
};

module.exports = {
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
};
