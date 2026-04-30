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
  // product_attributes: {
  //     type: Schema.Types.Mixed,
  //     default: {}
  // },
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

productSchema.pre('save', function (next) {
  this.slug = slugify(this.title, { lower: true });
  next();
});

// Thêm text index cho search
productSchema.index({
  title: 'text',
  description: 'text'
});
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

    return ret;
  }
});

module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);

