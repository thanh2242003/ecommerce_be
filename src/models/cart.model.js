'use strict';

const { model, Schema } = require('mongoose');

const DOCUMENT_NAME = 'Cart';
const COLLECTION_NAME = 'Carts';

const cartItemSchema = new Schema({
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    variantId: { type: Schema.Types.ObjectId, required: true },  // Reference to Product.variants._id
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true }
}, { _id: false });

const cartSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    items: [cartItemSchema],
    totalPrice: { type: Number, default: 0 }
}, {
    timestamps: true,
    collection: COLLECTION_NAME
});

cartSchema.set('toJSON', {
    transform: (doc, ret) => {
        // convert cart id
        ret._id = ret._id.toString();

        // convert user
        if (ret.user) {
            ret.user = ret.user.toString();
        }

        // convert items
        if (ret.items && ret.items.length) {
            ret.items = ret.items.map(item => ({
                ...item,
                product: item.product ? item.product.toString() : null
            }));
        }

        return ret;
    }
});


module.exports = { cart: model(DOCUMENT_NAME, cartSchema) }