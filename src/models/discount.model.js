'use strict';

const { model, Schema } = require('mongoose');

const DOCUMENT_NAME = 'Discount';
const COLLECTION_NAME = 'Discounts';

const discountSchema = new Schema({
    code: { type: String, required: true, unique: true, trim: true, uppercase: true },
    description: { type: String, required: true },
    
    type: { 
        type: String, 
        enum: ['percentage', 'fixed_amount'],
        default: 'percentage' 
    },
    
    value: { type: Number, required: true, min: 0 },
    
    // Date range
    startDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true },
    
    // Usage limits
    maxUses: { type: Number, required: true, min: 1 },
    usedCount: { type: Number, default: 0, min: 0 },
    maxUsesPerUser: { type: Number, default: 1, min: 1 },
    
    // Order conditions
    minOrderValue: { type: Number, default: 0, min: 0 },
    
    // Shop ownership
    shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
    
    // Applicability
    appliesTo: { 
        type: String, 
        enum: ['all', 'specific'],
        default: 'all' 
    },
    applicableProducts: { type: [Schema.Types.ObjectId], ref: 'Product', default: [] },
    applicableCategories: { type: [Schema.Types.ObjectId], ref: 'Category', default: [] },
    
    // Tracking
    usersUsed: { type: [Schema.Types.ObjectId], ref: 'User', default: [] },
    isActive: { type: Boolean, default: true, index: true }
}, {
    timestamps: true,
    collection: COLLECTION_NAME
});

// Index for fast lookups
discountSchema.index({ code: 1, shopId: 1 });
discountSchema.index({ shopId: 1, isActive: 1 });

//Export the model
module.exports = model(DOCUMENT_NAME, discountSchema);