'use strict';

const { model, Schema } = require('mongoose');

const DOCUMENT_NAME = 'WebhookLog';
const COLLECTION_NAME = 'WebhookLogs';

const webhookLogSchema = new Schema(
    {
        eventId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        payload: {
            type: Schema.Types.Mixed,
            required: true,
        },
        signature: {
            type: String,
            required: true,
            trim: true,
        },
        timestamp: {
            type: String,
            default: null,
        },
        processed: {
            type: Boolean,
            default: false,
            index: true,
        },
        retryCount: {
            type: Number,
            default: 0,
            min: 0,
        },
        processResult: {
            type: String,
            default: null,
        },
        errorMessage: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
        collection: COLLECTION_NAME,
    }
);

module.exports = model(DOCUMENT_NAME, webhookLogSchema);
