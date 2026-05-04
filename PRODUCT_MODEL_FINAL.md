'use strict';

const mongoose = require('mongoose');
const { Schema, model } = mongoose;
const slugify = require('slugify');

const DOCUMENT_NAME = 'Product';
const COLLECTION_NAME = 'Products';

const reviewSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  userName: { type: String, required: true, trim: true },
  content: { type: String, required: true, trim: true },
  rating: { type: Number, required: true, min: 0, max: 5 }
}, { _id: false, timestamps: false });

// Variant schema — represents a unique (color, size) combination with its own stock
const variantSchema = new Schema({
  color: { type: String, required: true },      // must match colors.title
  size: { type: String, required: true },       // must match sizes
  stock: { type: Number, default: 0, min: 0 }
}, { _id: true });

const productSchema = new Schema({
  title: { type: String, required: true },
  slug: String,
  categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  price: { type: Number, required: true },
  discountedPrice: { type: Number, default: 0 },
  gender: { type: Number, required: true },
  images: { type: [String], default: [] },
  sizes: { type: [String], default: [] },
  colors: [
    {
      title: { type: String, required: true },
      rgb: {
        type: [Number], // [R, G, B]
        required: true
      }
    }
  ],
  // Inventory variants — each (color + size) combination has independent stock
  variants: { type: [variantSchema], default: [] },
  salesNumber: { type: Number, default: 0 },
  description: { type: String, default: '' },
  reviews: { type: [reviewSchema], default: [] },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true
  },
  moderatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  moderatedAt: { type: Date, default: null },
  moderationNote: { type: String, default: '', trim: true },
  product_type: {
    type: String,
    enum: ['Electronic', 'Clothing', 'Furniture'],
    required: true
  },
  product_shop: {
    type: Schema.Types.ObjectId,
    ref: 'Shop'
  },
  isDraft: { type: Boolean, default: true },
  isPublished: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date, default: null }
}, {
  timestamps: true,
  collection: COLLECTION_NAME
});

// ──────────────────────────────────────────────────────────────────────────
// HOOKS
// ──────────────────────────────────────────────────────────────────────────

productSchema.pre('save', function (next) {
  this.slug = slugify(this.title, { lower: true });
  
  // ── Auto-generate variants when sizes or colors change ──────────
  this.generateVariants();
  
  next();
});

// ──────────────────────────────────────────────────────────────────────────
// INSTANCE METHODS
// ──────────────────────────────────────────────────────────────────────────

/**
 * Auto-generate all (color × size) combinations as variants
 * Preserves existing stock if variant already exists
 */
productSchema.methods.generateVariants = function() {
  if (!this.colors || this.colors.length === 0 || !this.sizes || this.sizes.length === 0) {
    this.variants = [];
    return;
  }

  const existingVariantMap = new Map();
  
  // Build a map of existing variants by (color, size)
  if (this.variants && this.variants.length > 0) {
    this.variants.forEach(variant => {
      const key = `${variant.color}::${variant.size}`;
      existingVariantMap.set(key, variant);
    });
  }

  // Generate all (color × size) combinations
  const newVariants = [];
  const colorTitles = this.colors.map(c => c.title);
  
  for (const color of colorTitles) {
    for (const size of this.sizes) {
      const key = `${color}::${size}`;
      
      // If variant exists, preserve its stock; otherwise, create new with 0 stock
      if (existingVariantMap.has(key)) {
        newVariants.push(existingVariantMap.get(key));
      } else {
        newVariants.push({
          color,
          size,
          stock: 0
        });
      }
    }
  }

  this.variants = newVariants;
};

/**
 * Get a variant by variantId
 */
productSchema.methods.getVariant = function(variantId) {
  if (!variantId) return null;
  return this.variants.find(v => v._id.toString() === variantId.toString());
};

/**
 * Check if variant has sufficient stock
 */
productSchema.methods.hasStock = function(variantId, quantity = 1) {
  const variant = this.getVariant(variantId);
  return variant && variant.stock >= quantity;
};

// ──────────────────────────────────────────────────────────────────────────
// STATIC METHODS
// ──────────────────────────────────────────────────────────────────────────

/**
 * Static: Update variant stock by variantId
 * Usage: Product.updateVariantStock(productId, variantId, -1)
 */
productSchema.statics.updateVariantStock = function(productId, variantId, increment) {
  return this.findByIdAndUpdate(
    productId,
    { $inc: { 'variants.$.stock': increment } },
    { new: true }
  );
};

/**
 * Static: Get product with variant details
 */
productSchema.statics.getProductWithVariants = function(productId) {
  return this.findById(productId).select('colors sizes variants price discountedPrice');
};

// ──────────────────────────────────────────────────────────────────────────
// INDEXES
// ──────────────────────────────────────────────────────────────────────────

// Thêm text index cho search
productSchema.index({
  title: 'text',
  description: 'text'
});

// Index for variant queries
productSchema.index({ 'variants.color': 1, 'variants.size': 1 });

// ──────────────────────────────────────────────────────────────────────────
// SERIALIZATION
// ──────────────────────────────────────────────────────────────────────────

productSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret._id = ret._id.toString();

    if (ret.product_shop) {
      ret.product_shop = ret.product_shop.toString();
    }

    if (ret.colors && ret.colors.length) {
      ret.colors = ret.colors.map(color => ({
        ...color,
        _id: color._id ? color._id.toString() : undefined
      }));
    }

    if (ret.variants && ret.variants.length) {
      ret.variants = ret.variants.map(variant => ({
        _id: variant._id ? variant._id.toString() : undefined,
        color: variant.color,
        size: variant.size,
        stock: variant.stock
      }));
    }

    return ret;
  }
});

module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);
