'use strict';

const mongoose = require('mongoose');
const { Schema, model } = mongoose;
const slugify = require('slugify');

const DOCUMENT_NAME = 'Category';
const COLLECTION_NAME = 'Categories';

const categorySchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    maxLength: 100
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  image: {
    type: String,
    default: ''
  },
  adminId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: COLLECTION_NAME
});

// Auto generate slug before saving
categorySchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true });
  }
  next();
});

categorySchema.set('toJSON', {
  transform: (doc, ret) => {
    ret._id = ret._id.toString();
    return ret;
  }
});

module.exports = mongoose.models.Category || model(DOCUMENT_NAME, categorySchema);
