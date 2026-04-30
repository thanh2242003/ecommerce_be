const { model, Schema, Types } = require('mongoose');

const DOCUMENT_NAME = 'Shop';
const COLLECTION_NAME = 'Shops';

// Declare the Schema of the Mongo model
var shopSchema = new Schema({
    name: {
        type: String,
        trim: true,
        maxLength: 150
    },
    email: {
        type: String,
        trim: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'blocked'],
        default: 'inactive',
    },
    verify: {
        type: Schema.Types.Boolean,
        default: false,
    },
    verifiedAt: {
        type: Date,
        default: null,
    },
    verifiedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    blockedAt: {
        type: Date,
        default: null,
    },
    blockedReason: {
        type: String,
        default: '',
        trim: true,
    },
    roles: {
        type: Array,
        default: [],
    }
}, {
    timestamps: true,
    collection: COLLECTION_NAME
}
);
//Export the model
module.exports = model(DOCUMENT_NAME, shopSchema);