'use strict';

const { model, Schema, Types } = require('mongoose');

const DOCUMENT_NAME = 'Inventory';
const COLLECTION_NAME = 'Inventories';

// Variant-specific inventory mapped 1-1 with Product.variants
const variantInventorySchema = new Schema({
    variantId: { type: Schema.Types.ObjectId, required: true },
    color: { type: String, required: true },
    size: { type: String, required: true },
    stock: { type: Number, required: true, min: 0, default: 0 }
}, { _id: false });

// Main inventory schema
const inventorySchema = new Schema({
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
    
    // Total quantity across all variants
    totalQuantity: { type: Number, required: true, min: 0, default: 0 },
    
    // Location/warehouse information
    location: { type: String, default: 'Main Warehouse' },
    
    // Variant-specific inventory (optional - mirrors Product.variants)
    variants: { type: [variantInventorySchema], default: [] },
    
    // Reserved quantity (in pending/processing orders)
    reserved: { type: Number, default: 0, min: 0 },
    
    // Available quantity = totalQuantity - reserved
    status: {
        type: String,
        enum: ['in_stock', 'low_stock', 'out_of_stock'],
        default: 'in_stock'
    }
}, {
    timestamps: true,
    collection: COLLECTION_NAME
});

// Index for fast lookups
inventorySchema.index({ productId: 1, shopId: 1 }, { unique: true });
inventorySchema.index({ status: 1 });

// Middleware to update status based on totalQuantity
inventorySchema.pre('save', function (next) {
    if (this.totalQuantity <= 0) {
        this.status = 'out_of_stock';
    } else if (this.totalQuantity <= 10) {
        this.status = 'low_stock';
    } else {
        this.status = 'in_stock';
    }
    next();
});

module.exports = model(DOCUMENT_NAME, inventorySchema);