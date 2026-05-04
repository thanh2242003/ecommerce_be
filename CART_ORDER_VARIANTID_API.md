# Cart & Order API - Updated with variantId

## Overview

The Cart and Order APIs have been updated to use `variantId` (reference to `Product.variants._id`) instead of separate `color` and `size` fields.

**Key Changes:**
- ✅ Cart items now use `variantId` (ObjectId) instead of color + size strings
- ✅ Order items snapshot `variantId` for audit trail
- ✅ Stock is deducted at variant level: `{ $inc: { "variants.$.stock": -quantity } }`
- ✅ Color and size information comes from the variant data

---

## Cart API

### 1. Add to Cart

**Endpoint:** `POST /v1/api/cart/add`

**NEW Request Body:**
```json
{
  "productId": "507f1f77bcf86cd799439013",
  "variantId": "508a3...",
  "quantity": 2
}
```

**OLD (deprecated):**
```json
{
  "productId": "507f1f77bcf86cd799439013",
  "quantity": 2,
  "color": "Black",
  "size": "M"
}
```

**Response:**
```json
{
  "status": 200,
  "message": "Item added to cart successfully!",
  "metadata": {
    "_id": "509...",
    "user": "507f1f77bcf86cd799439010",
    "items": [
      {
        "product": "507f1f77bcf86cd799439013",
        "variantId": "508a3...",
        "quantity": 2,
        "price": 199000
      }
    ],
    "totalPrice": 398000
  }
}
```

---

### 2. Update Cart Item Quantity

**Endpoint:** `POST /v1/api/cart/update`

**NEW Request Body:**
```json
{
  "productId": "507f1f77bcf86cd799439013",
  "variantId": "508a3...",
  "quantity": 3
}
```

**Response:**
```json
{
  "status": 200,
  "message": "Update quantity cart successfully!",
  "metadata": {
    "_id": "509...",
    "user": "507f1f77bcf86cd799439010",
    "items": [
      {
        "product": "507f1f77bcf86cd799439013",
        "variantId": "508a3...",
        "quantity": 3,
        "price": 199000
      }
    ],
    "totalPrice": 597000
  }
}
```

---

### 3. Remove from Cart

**Endpoint:** `DELETE /v1/api/cart`

**NEW Request Body:**
```json
{
  "productId": "507f1f77bcf86cd799439013",
  "variantId": "508a3..."
}
```

**OLD (deprecated):**
```json
{
  "productId": "507f1f77bcf86cd799439013",
  "color": "Black",
  "size": "M"
}
```

**Response:**
```json
{
  "status": 200,
  "message": "Delete cart item successfully!",
  "metadata": {
    "_id": "509...",
    "user": "507f1f77bcf86cd799439010",
    "items": [],
    "totalPrice": 0
  }
}
```

---

### 4. Get Cart

**Endpoint:** `GET /v1/api/cart`

**Response:**
```json
{
  "status": 200,
  "message": "Get list to cart successfully",
  "metadata": {
    "_id": "509...",
    "user": "507f1f77bcf86cd799439010",
    "items": [
      {
        "product": {
          "_id": "507f1f77bcf86cd799439013",
          "title": "Classic T-Shirt",
          "images": ["url1"],
          "price": 299000,
          "discountedPrice": 199000,
          "colors": [
            { "_id": "507g...", "title": "Black", "rgb": [0, 0, 0] },
            { "_id": "507h...", "title": "White", "rgb": [255, 255, 255] }
          ],
          "sizes": ["S", "M", "L"],
          "variants": [
            { "_id": "508a1...", "color": "Black", "size": "S", "stock": 10 },
            { "_id": "508a2...", "color": "Black", "size": "M", "stock": 15 },
            { "_id": "508a3...", "color": "Black", "size": "L", "stock": 8 }
          ]
        },
        "variantId": "508a3...",
        "quantity": 2,
        "price": 199000
      }
    ],
    "totalPrice": 398000
  }
}
```

---

## Order API

### 1. Create Order (Cart Checkout)

**Endpoint:** `POST /v1/api/order/orders`

**Request Body:**
```json
{
  "type": "cart",
  "addressId": "510f1f77bcf86cd799439015"
}
```

**Response:**
```json
{
  "status": 201,
  "message": "Order created successfully",
  "metadata": {
    "_id": "511f...",
    "userId": "507f1f77bcf86cd799439010",
    "shopId": "507f1f77bcf86cd799439012",
    "receiverName": "John Doe",
    "receiverPhone": "0987654321",
    "address": "123 Main St, City",
    "items": [
      {
        "productId": "507f1f77bcf86cd799439013",
        "variantId": "508a3...",
        "productName": "Classic T-Shirt",
        "price": 199000,
        "quantity": 2,
        "image": "url1",
        "color": "Black",
        "size": "M"
      }
    ],
    "totalPrice": 398000,
    "discountAmount": 0,
    "finalPrice": 398000,
    "status": "pending",
    "paymentMethod": "cod",
    "createdAt": "2024-01-15T11:00:00Z"
  }
}
```

---

### 2. Create Order (Buy Now)

**Endpoint:** `POST /v1/api/order/orders`

**NEW Request Body:**
```json
{
  "type": "buy_now",
  "addressId": "510f1f77bcf86cd799439015",
  "productId": "507f1f77bcf86cd799439013",
  "variantId": "508a3...",
  "quantity": 1
}
```

**OLD (deprecated):**
```json
{
  "type": "buy_now",
  "addressId": "510f...",
  "productId": "507f...",
  "quantity": 1,
  "color": "Black",
  "size": "M"
}
```

**Response:**
```json
{
  "status": 201,
  "message": "Order created successfully",
  "metadata": {
    "_id": "511f...",
    "userId": "507f1f77bcf86cd799439010",
    "shopId": "507f1f77bcf86cd799439012",
    "items": [
      {
        "productId": "507f1f77bcf86cd799439013",
        "variantId": "508a3...",
        "productName": "Classic T-Shirt",
        "price": 199000,
        "quantity": 1,
        "image": "url1",
        "color": "Black",
        "size": "M"
      }
    ],
    "totalPrice": 199000,
    "status": "pending"
  }
}
```

---

## Frontend Implementation Example

### Get Product with Variants

```javascript
// Fetch product to get variant data
const response = await fetch('/v1/api/product/products/507f...');
const product = await response.json();

console.log(product.metadata);
// {
//   colors: [
//     { _id: '507g...', title: 'Black', rgb: [0, 0, 0] },
//     { _id: '507h...', title: 'White', rgb: [255, 255, 255] }
//   ],
//   sizes: ['S', 'M', 'L'],
//   variants: [
//     { _id: '508a1...', color: 'Black', size: 'S', stock: 10 },
//     { _id: '508a2...', color: 'Black', size: 'M', stock: 15 },
//     { _id: '508a3...', color: 'Black', size: 'L', stock: 8 }
//   ]
// }
```

### User Selects Color & Size

```javascript
// User selects: Black, Size M
const selectedColor = 'Black';
const selectedSize = 'M';

// Find matching variant
const variant = product.variants.find(v => 
  v.color === selectedColor && v.size === selectedSize
);

console.log(variant);
// { _id: '508a2...', color: 'Black', size: 'M', stock: 15 }
```

### Add to Cart

```javascript
// Send variantId (not color + size)
const response = await fetch('/v1/api/cart/add', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    productId: product._id,
    variantId: variant._id,  // ← Use variant._id
    quantity: 1
  })
});
```

### Update Quantity

```javascript
const response = await fetch('/v1/api/cart/update', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    productId: product._id,
    variantId: variant._id,
    quantity: 2
  })
});
```

### Remove from Cart

```javascript
const response = await fetch('/v1/api/cart', {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    productId: product._id,
    variantId: variant._id
  })
});
```

### Checkout (Cart Mode)

```javascript
const response = await fetch('/v1/api/order/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'cart',
    addressId: '510f...'
  })
});
```

### Buy Now

```javascript
const response = await fetch('/v1/api/order/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'buy_now',
    addressId: '510f...',
    productId: product._id,
    variantId: variant._id,
    quantity: 1
  })
});
```

---

## Database Changes

### Cart Model (Updated)
```javascript
{
  product: ObjectId,      // Reference to Product
  variantId: ObjectId,    // Reference to Product.variants._id
  quantity: Number,
  price: Number           // Snapshot at add time
  // ✅ REMOVED: color, size (redundant with variantId)
}
```

### Order Item Model (Updated)
```javascript
{
  productId: ObjectId,
  variantId: ObjectId,    // ✅ NEW: Reference to Product.variants._id
  productName: String,
  price: Number,
  quantity: Number,
  image: String,
  color: String,          // Optional: snapshot from variant
  size: String            // Optional: snapshot from variant
}
```

---

## Key Points

✅ **DO:**
- Use `variantId` (ObjectId) in all cart/order operations
- Get variantId from `Product.variants._id`
- Stock validation uses variant-level stock
- Color and size come from variant data

❌ **DON'T:**
- Send color and size strings (use variantId instead)
- Use global product stock (use variant stock)
- Generate variantId on frontend (retrieve from product data)

---

## Migration Checklist

- [ ] Update frontend to fetch variants from product API
- [ ] Update add-to-cart component to select variantId
- [ ] Update cart display to show variant info
- [ ] Update checkout flow to use variantId
- [ ] Update order history to display variant details
- [ ] Test all cart operations with new variantId format
- [ ] Test all order creation flows
- [ ] Verify stock deduction at variant level

