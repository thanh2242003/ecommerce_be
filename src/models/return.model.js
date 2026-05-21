'use strict';

const { model, Schema } = require('mongoose');

const DOCUMENT_NAME = 'Return';
const COLLECTION_NAME = 'Returns';

const returnSchema = new Schema({
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },

    // Return reason
    reason: { type: String, required: true },
    description: { type: String, default: '' },

    // Items to return (specific products from order or all)
    returnItems: [{
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        variantId: { type: Schema.Types.ObjectId, required: true },
        productName: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true }
    }],

    returnPrice: { type: Number, required: true, min: 0 }, // Total refund amount

    // Status tracking
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'returned', 'completed', 'cancelled'],
        default: 'pending',
        index: true
    },

    // Admin decision
    adminId: { type: Schema.Types.ObjectId, ref: 'Admin', default: null },
    approvalReason: { type: String, default: '' },
    approvedAt: { type: Date, default: null },

    // Return tracking
    returnedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },

    // Timestamps
    requestedAt: { type: Date, default: Date.now },

    // Notes
    notes: { type: String, default: '' }
}, {
    timestamps: true,
    collection: COLLECTION_NAME
});

// Index for finding returns by order
returnSchema.index({ orderId: 1, status: 1 });
returnSchema.index({ userId: 1, status: 1 });
returnSchema.index({ shopId: 1, status: 1 });
returnSchema.index({ requestedAt: 1 });

module.exports = model(DOCUMENT_NAME, returnSchema);
