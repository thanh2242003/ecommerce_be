const { model, Schema } = require('mongoose');

const DOCUMENT_NAME = 'Admin';
const COLLECTION_NAME = 'Admins';

const adminSchema = new Schema({
    name: {
        type: String,
        trim: true,
        maxLength: 150,
        required: true
    },
    account: {
        type: String,
        trim: true,
        unique: true,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'blocked'],
        default: 'active',
    },
    verify: {
        type: Schema.Types.Boolean,
        default: true,
    },
    roles: {
        type: Array,
        default: ['ADMIN'],
    },
    permissions: {
        type: Array,
        default: [],
    },
    lastLogin: {
        type: Date,
        default: null,
    }
}, {
    timestamps: true,
    collection: COLLECTION_NAME
});

module.exports = model(DOCUMENT_NAME, adminSchema);
