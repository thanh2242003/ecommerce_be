'use strict';

const { model, Schema } = require('mongoose');

const DOCUMENT_NAME = 'Address';
const COLLECTION_NAME = 'Addresses';

const addressSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    receiverName: { type: String, required: true, trim: true },
    receiverPhone: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    isDefault: { type: Boolean, default: false }
}, {
    timestamps: true,
    collection: COLLECTION_NAME
});

module.exports = model(DOCUMENT_NAME, addressSchema);
