'use strict';

const { model, Schema } = require('mongoose');

const DOCUMENT_NAME = 'Payment';
const COLLECTION_NAME = 'Payments';

const paymentSchema = new Schema(
    {
        orderId: {
            type: Schema.Types.ObjectId,
            ref: 'Order',
            required: true,
            index: true,
        },
        transactionId: {
            type: String,
            default: null,
            trim: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        paymentMethod: {
            type: String,
            enum: ['SEPAY'],
            default: 'SEPAY',
        },
        qrData: {
            type: Schema.Types.Mixed,
            default: {},
        },
        status: {
            type: String,
            enum: ['PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'EXPIRED'],
            default: 'PENDING',
            index: true,
        },
        expiredAt: {
            type: Date,
            required: true,
        },
        failureReason: {
            type: String,
            default: null,
        },
        paidAt: {
            type: Date,
            default: null,
        },
        lastWebhookAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
        collection: COLLECTION_NAME,
    }
);

paymentSchema.index(
    { transactionId: 1 },
    {
        unique: true,
        partialFilterExpression: {
            transactionId: {
                $exists: true,
                $ne: null,
            },
        },
    }
);

paymentSchema.index({ userId: 1, createdAt: -1 });

module.exports = model(DOCUMENT_NAME, paymentSchema);
