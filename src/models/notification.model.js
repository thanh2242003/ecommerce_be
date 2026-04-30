'use strict';

const { model, Schema } = require('mongoose');

const DOCUMENT_NAME = 'Notification';
const COLLECTION_NAME = 'Notifications';

const notificationSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        title: { type: String, required: true, trim: true },
        body: { type: String, required: true, trim: true },
        type: {
            type: String,
            enum: ['order', 'promo', 'promotion', 'system', 'test', 'custom'],
            default: 'system',
            index: true,
        },
        data: {
            type: Schema.Types.Mixed,
            default: {},
        },
        isRead: {
            type: Boolean,
            default: false,
            index: true,
        },
    },
    {
        timestamps: true,
        collection: COLLECTION_NAME,
    }
);

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

module.exports = model(DOCUMENT_NAME, notificationSchema);
