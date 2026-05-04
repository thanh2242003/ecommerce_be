# Product Variants System - Complete Guide

## Overview

The new variants system provides proper inventory management at the (color × size) combination level, while keeping colors and sizes for UI display.

**Key Points:**
- ✅ Each (color, size) combination is a unique variant
- ✅ Each variant has independent stock
- ✅ Variants auto-generate when product is created/updated
- ✅ Existing stock is preserved when colors/sizes change
- ✅ No global stock field — inventory is variant-based only

---

## 1. Product Schema Structure

### Before (Old)
```javascript
{
  title: "T-Shirt",
  price: 100,
  sizes: ["S", "M", "L"],
  colors: [
    { title: "Red", rgb: [255, 0, 0] },
    { title: "Blue", rgb: [0, 0, 255] }
  ],
  stock: 50  // ❌ Ambiguous — doesn't specify which color/size combo
}
```

### After (New)
```javascript
{
  title: "T-Shirt",
  price: 100,
  sizes: ["S", "M", "L"],
  colors: [
    { title: "Red", rgb: [255, 0, 0] },
    { title: "Blue", rgb: [0, 0, 255] }
  ],
  variants: [
    { _id: ObjectId(...), color: "Red", size: "S", stock: 10 },
    { _id: ObjectId(...), color: "Red", size: "M", stock: 15 },
    { _id: ObjectId(...), color: "Red", size: "L", stock: 8 },
    { _id: ObjectId(...), color: "Blue", size: "S", stock: 12 },
    { _id: ObjectId(...), color: "Blue", size: "M", stock: 20 },
    { _id: ObjectId(...), color: "Blue", size: "L", stock: 5 }
  ]
  // ✅ No global stock — only variant-level inventory
}
```

---

## 2. Creating/Updating a Product

### Creating a Product
```javascript
const Product = require('../models/product.model');

// When you create a product with sizes and colors...
const product = await Product.create({
  title: 'T-Shirt',
  categoryId: '63f...',
  price: 100,
  discountedPrice: 80,
  gender: 1,
  sizes: ['S', 'M', 'L'],
  colors: [
    { title: 'Red', rgb: [255, 0, 0] },
    { title: 'Blue', rgb: [0, 0, 255] }
  ],
  product_shop: '63f...',
  product_type: 'Clothing'
});

// ✅ variants are auto-generated automatically!
console.log(product.variants);
// [
//   { _id: ObjectId(...), color: 'Red', size: 'S', stock: 0 },
//   { _id: ObjectId(...), color: 'Red', size: 'M', stock: 0 },
//   { _id: ObjectId(...), color: 'Red', size: 'L', stock: 0 },
//   { _id: ObjectId(...), color: 'Blue', size: 'S', stock: 0 },
//   { _id: ObjectId(...), color: 'Blue', size: 'M', stock: 0 },
//   { _id: ObjectId(...), color: 'Blue', size: 'L', stock: 0 }
// ]
```

### Updating Sizes/Colors
```javascript
// Update sizes and colors...
product.sizes = ['XS', 'S', 'M', 'L', 'XL'];
product.colors = [
  { title: 'Red', rgb: [255, 0, 0] },
  { title: 'Blue', rgb: [0, 0, 255] },
  { title: 'Green', rgb: [0, 255, 0] }
];

// When you save, variants automatically regenerate!
await product.save();

// ✅ Old variants that still match (color + size) preserve their stock
// ✅ New combinations get stock: 0
// ✅ Removed combinations are deleted
```

---

## 3. Setting Variant Stock (Admin)

```javascript
const VariantHelper = require('../utils/variant.helper');

const productId = '63f...';
const variantId = '64a...';

// Set stock directly
await VariantHelper.updateVariantStock(productId, variantId, 50);
```

### Bulk Set Stock (Import CSV)
```javascript
// For each variant update in your CSV:
for (const row of csvData) {
  await VariantHelper.updateVariantStock(
    row.productId,
    row.variantId,
    row.stock
  );
}
```

---

## 4. Cart Operations (Use variantId)

### OLD: Color + Size separate
```javascript
// ❌ OLD WAY — Don't use this anymore
{
  productId: '63f...',
  color: 'Red',
  size: 'M',
  quantity: 2
}
```

### NEW: Use variantId
```javascript
// ✅ NEW WAY — Use variantId
{
  productId: '63f...',
  variantId: '64a...',  // ← This uniquely identifies Red + M combo
  quantity: 2
}
```

**Adding to Cart:**
```javascript
const Cart = require('../models/cart.model');
const VariantHelper = require('../utils/variant.helper');

// 1. Verify variant exists and has stock
await VariantHelper.checkStock(productId, variantId, quantity);

// 2. Add to cart
await Cart.findOneAndUpdate(
  { user: userId },
  {
    $push: {
      items: {
        product: productId,
        variantId,
        quantity,
        addedAt: new Date()
      }
    }
  }
);
```

---

## 5. Order/Checkout (Deduct Variant Stock)

### Using MongoDB Transaction
```javascript
const OrderService = require('../services/order.service');
const VariantHelper = require('../utils/variant.helper');

static async createOrder({ userId, type, addressId, ...rest }) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Get cart items
    const userCart = await Cart.findOne({ user: userId })
      .populate('items.product')
      .session(session);

    for (const item of userCart.items) {
      // Extract shopId from product
      const shopId = item.product.product_shop;
      
      // Check variant stock
      await VariantHelper.checkStock(item.product._id, item.variantId, item.quantity);

      // Create order item snapshot
      orderItems.push({
        productId: item.product._id,
        variantId: item.variantId,
        productName: item.product.title,
        quantity: item.quantity
      });

      // ✅ Deduct stock at variant level
      await Product.findByIdAndUpdate(
        item.product._id,
        { $inc: { 'variants.$.stock': -item.quantity, salesNumber: item.quantity } },
        { session }
      );
    }

    // Create order document
    const newOrder = await Order.create([{
      userId,
      shopId,
      items: orderItems,
      // ... other fields
    }], { session });

    await session.commitTransaction();
    return newOrder[0];
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
```

---

## 6. API Response Examples

### Get Single Product (with variants)
```
GET /v1/api/product/products/63f...
```

**Response:**
```json
{
  "_id": "63f...",
  "title": "T-Shirt",
  "price": 100,
  "discountedPrice": 80,
  "sizes": ["S", "M", "L"],
  "colors": [
    { "_id": "64a...", "title": "Red", "rgb": [255, 0, 0] },
    { "_id": "64b...", "title": "Blue", "rgb": [0, 0, 255] }
  ],
  "variants": [
    { "_id": "64c1", "color": "Red", "size": "S", "stock": 10 },
    { "_id": "64c2", "color": "Red", "size": "M", "stock": 15 },
    { "_id": "64c3", "color": "Red", "size": "L", "stock": 8 },
    { "_id": "64c4", "color": "Blue", "size": "S", "stock": 12 },
    { "_id": "64c5", "color": "Blue", "size": "M", "stock": 20 },
    { "_id": "64c6", "color": "Blue", "size": "L", "stock": 5 }
  ]
}
```

### Add to Cart (New)
```
POST /v1/api/cart/add
Content-Type: application/json

{
  "productId": "63f...",
  "variantId": "64c2",
  "quantity": 2
}
```

### Create Order (New)
```
POST /v1/api/order/orders
Content-Type: application/json

{
  "type": "cart",
  "addressId": "65a..."
}
```

Response (order item):
```json
{
  "productId": "63f...",
  "variantId": "64c2",
  "productName": "T-Shirt",
  "color": "Red",
  "size": "M",
  "price": 80,
  "quantity": 2,
  "image": "..."
}
```

---

## 7. VariantHelper Usage Examples

### Check Stock Before Adding to Cart
```javascript
const VariantHelper = require('../utils/variant.helper');

try {
  await VariantHelper.checkStock(productId, variantId, quantity);
  // ✅ Stock available
} catch (error) {
  // ❌ Insufficient stock
  console.log(error.message);
}
```

### Get All Variants
```javascript
const variants = await VariantHelper.getAllVariants(productId);
console.log(variants);
// [
//   { variantId: ObjectId(...), color: 'Red', size: 'S', stock: 10 },
//   { variantId: ObjectId(...), color: 'Red', size: 'M', stock: 15 },
//   // ...
// ]
```

### Deduct Stock (During Checkout)
```javascript
await VariantHelper.deductStock(
  productId,
  variantId,
  quantity,
  session // ← include session for transaction
);
```

### Restore Stock (Cancelled Order)
```javascript
await VariantHelper.restoreStock(
  productId,
  variantId,
  quantity,
  session
);
```

### Bulk Check Multiple Items
```javascript
const result = await VariantHelper.checkMultiple([
  { productId: '63f...', variantId: '64c1', quantity: 2 },
  { productId: '63f...', variantId: '64c3', quantity: 1 },
  { productId: '63g...', variantId: '64d1', quantity: 5 }
]);

// [
//   { productId: '63f...', variantId: '64c1', available: true },
//   { productId: '63f...', variantId: '64c3', available: true },
//   { productId: '63g...', variantId: '64d1', available: false, error: '...' }
// ]
```

---

## 8. Migration Guide (Existing Projects)

If you have existing products with old stock system:

```javascript
// Script to initialize variants from existing products
const Product = require('./models/product.model');

const migrateToVariants = async () => {
  const products = await Product.find();
  
  for (const product of products) {
    // The pre-save hook will auto-generate variants!
    product.generateVariants();
    await product.save();
    
    // Optional: If you had a global stock field, distribute to variants
    if (product.stock) {
      const itemsPerVariant = Math.floor(product.stock / product.variants.length);
      product.variants.forEach(v => {
        v.stock = itemsPerVariant;
      });
      await product.save();
    }
  }
};

migrateToVariants().then(() => console.log('Migration complete!'));
```

---

## 9. Best Practices

✅ **DO:**
- Always use `variantId` in cart/order items
- Check stock with `VariantHelper.checkStock()` before deducting
- Use transactions with session when deducting stock
- Call `product.generateVariants()` when sizes/colors change
- Update stock at variant level: `{ $inc: { 'variants.$.stock': -quantity } }`

❌ **DON'T:**
- Don't use global `stock` field — only use `variants[].stock`
- Don't pass color + size separately in cart items
- Don't forget to include variantId in order snapshots
- Don't manually manipulate variants array — use `generateVariants()`

---

## 10. Database Query Examples

### Get total stock for a product
```javascript
db.products.aggregate([
  { $match: { _id: ObjectId("63f...") } },
  { $unwind: '$variants' },
  { $group: { _id: '$_id', totalStock: { $sum: '$variants.stock' } } }
]);
```

### Find low-stock variants (< 5)
```javascript
db.products.find({
  'variants.stock': { $lt: 5 }
}, {
  'variants.$': 1
});
```

### Get variants grouped by color
```javascript
db.products.aggregate([
  { $match: { _id: ObjectId("63f...") } },
  { $unwind: '$variants' },
  { $group: {
    _id: '$variants.color',
    totalStock: { $sum: '$variants.stock' },
    sizes: { $push: '$variants.size' }
  } }
]);
```

---

## Summary

| Feature | Old System | New System |
|---------|-----------|-----------|
| Stock tracking | Global `stock` field | Per-variant `variants[].stock` |
| Cart items | color + size strings | variantId reference |
| Inventory query | Ambiguous | Clear (specific color + size) |
| Variant creation | Manual | Auto-generated on save |
| Stock updates | Simple increment | Atomic with `variants.$.stock` |

The new system provides **clear, traceable, granular inventory management** at the variant level! 🎉

