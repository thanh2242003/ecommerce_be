'use strict';

const { model, Schema } = require('mongoose');

const DOCUMENT_NAME = 'Order';
const COLLECTION_NAME = 'Orders';

// Snapshot of each product at the time of order — prices are frozen here
const orderItemSchema = new Schema({
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    image: { type: String, required: true },
    color: { type: String, required: true },
    size: { type: String, default: null }
}, { _id: false });

const orderSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },

    // Snapshot of receiver info — immutable after order creation
    receiverName: { type: String, required: true },
    receiverPhone: { type: String, required: true },
    address: { type: String, required: true },

    items: { type: [orderItemSchema], required: true, validate: v => v.length > 0 },
    totalPrice: { type: Number, required: true, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    finalPrice: { type: Number, required: true, min: 0 },

    status: {
        type: String,
        enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending',
        index: true
    },
    
    paymentMethod: {
        type: String,
        enum: ['cod', 'card', 'bank_transfer'],
        default: 'cod'
    },
    
    discountCode: { type: String, default: null },
    notes: { type: String, default: '' }
}, {
    timestamps: true,
    collection: COLLECTION_NAME
});

module.exports = model(DOCUMENT_NAME, orderSchema);