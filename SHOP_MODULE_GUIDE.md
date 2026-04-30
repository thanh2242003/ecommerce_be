# SHOP MODULE - IMPLEMENTATION GUIDE

## 📚 Quick Start

This document provides a complete guide to the Shop module implementation including setup, testing, and integration.

---

## 🏗️ Architecture Overview

### Directory Structure

```
src/
├── models/
│   ├── order.model.js           (Updated with shopId)
│   ├── product.model.js         (Added soft delete fields)
│   ├── inventory.model.js       (New schema with variants)
│   ├── discount.model.js        (Refactored with consistent naming)
│   └── shop.model.js            (Existing)
│
├── services/
│   ├── shop.order.service.js           (NEW)
│   ├── shop.dashboard.service.js       (NEW)
│   ├── shop.inventory.service.js       (NEW)
│   ├── shop.product.service.js         (NEW - soft delete)
│   ├── shop.discount.service.js        (NEW - update/delete)
│   └── product.service.js              (Updated - exclude deleted)
│
├── controllers/
│   ├── shop.order.controller.js        (NEW)
│   ├── shop.dashboard.controller.js    (NEW)
│   ├── shop.inventory.controller.js    (NEW)
│   ├── shop.product.controller.js      (NEW)
│   ├── shop.discount.controller.js     (NEW)
│   └── product.controller.js           (Existing)
│
├── routes/
│   ├── shop/
│   │   └── index.js                    (NEW)
│   ├── product/
│   │   └── index.js                    (Updated - soft delete)
│   ├── discount/
│   │   └── index.js                    (Updated - update/delete)
│   ├── inventory/
│   │   └── index.js                    (Updated - comprehensive)
│   └── index.js                        (Updated - register shop routes)
│
├── auth/
│   ├── shopAuth.js                     (NEW - shop middleware)
│   └── authUtils.js                    (Existing)
│
└── utils/
    ├── pagination.js                   (NEW)
    └── validation.js                   (NEW)
```

### Clean Architecture Layers

```
Routes (HTTP Entry) 
    ↓
Controllers (Request/Response Handler)
    ↓
Services (Business Logic)
    ↓
Models (Data Access)
    ↓
Database (MongoDB)
```

---

## 🔑 Key Components

### 1. Models

#### Order Model
- Added `shopId` (indexed) to identify order owner
- Added `discountAmount` and `finalPrice` for billing
- Updated status enum: pending → confirmed → processing → shipped → delivered
- Added `paymentMethod` and `discountCode` fields

**Usage:**
```javascript
const order = await orderModel.find({ shopId });
```

#### Product Model
- Added `isDeleted` (boolean, indexed) for soft deletes
- Added `deletedAt` (date) to track deletion time
- Excluded from queries automatically

**Usage:**
```javascript
// Automatically excludes deleted products
await Product.find({ isDeleted: false })
```

#### Inventory Model
- Complete refactor with clean naming (`productId`, `shopId`, `totalQuantity`)
- Support for variant inventory (size, color combinations)
- `status` auto-updated based on quantity (in_stock, low_stock, out_of_stock)
- Unique index on (productId, shopId)

**Usage:**
```javascript
const inventory = await inventoryModel.findOne({
    productId,
    shopId
});
```

#### Discount Model
- Refactored naming (discount_code → code, discount_value → value)
- `usedCount` for tracking usage
- `applicableProducts` and `applicableCategories` for targeting
- `usersUsed` array to track per-user usage

### 2. Services

#### Shop Order Service (`shop.order.service.js`)
**Methods:**
- `getShopOrders(shopId, query)` - Get paginated, filtered orders
- `getOrderById(orderId, shopId)` - Get order with ownership check
- `updateOrderStatus(orderId, shopId, newStatus)` - Update with validation
- `getOrderStats(shopId)` - Dashboard stats using aggregation
- `getOrdersByStatus(shopId)` - Grouped status analysis

**Key Features:**
- Validates status transitions before updating
- Checks shop ownership on all operations
- Aggregation pipeline for analytics
- Pagination support with metadata

#### Shop Dashboard Service (`shop.dashboard.service.js`)
**Methods:**
- `getShopDashboard(shopId)` - Complete dashboard metrics

**Metrics Included:**
- Total orders, revenue, products, customers
- Orders grouped by status
- Top 5 selling products
- Low/out-of-stock inventory

**Performance:**
- Uses `Promise.all()` to fetch metrics in parallel
- MongoDB aggregation for complex calculations
- Lean queries for read-only data

#### Shop Inventory Service (`shop.inventory.service.js`)
**Methods:**
- `createOrUpdateInventory(shopId, data)` - Create or update
- `getShopInventory(shopId, query)` - Get with pagination
- `getInventoryById(inventoryId, shopId)` - Get single
- `updateInventory(inventoryId, shopId, data)` - Update
- `deleteInventory(inventoryId, shopId)` - Delete
- `getInventorySummary(shopId)` - Summary stats

**Features:**
- Variant support (size/color combinations)
- Automatic status calculation
- Shop ownership verification
- Full CRUD operations

#### Shop Product Service (`shop.product.service.js`)
**Methods:**
- `softDeleteProduct(productId, shopId)` - Soft delete
- `restoreProduct(productId, shopId)` - Restore
- `permanentlyDeleteProduct(productId, shopId)` - Hard delete
- `getDeletedProducts(shopId, query)` - List deleted

**Soft Delete Benefits:**
- Data preservation for compliance/analytics
- Easy restoration
- Historical tracking with `deletedAt`
- Excluded from public product queries

#### Shop Discount Service (`shop.discount.service.js`)
**Methods:**
- `updateDiscount(discountId, shopId, updateData)` - Update
- `deleteDiscount(discountId, shopId, allowIfUsed)` - Delete
- `getDiscountByCode(code, shopId)` - Retrieve for validation
- `validateDiscountApplicability(discount, productIds, orderValue)` - Check eligibility

**Validations:**
- Cannot update expired discounts
- Cannot reduce maxUses below usedCount
- Validates date ranges
- Checks usage limits

### 3. Controllers

All controllers use `asyncHandler` middleware for clean error handling.

**Pattern:**
```javascript
methodName = asyncHandler(async (req, res, next) => {
    const shopId = req.shopId;
    const result = await Service.method(...);
    new SuccessResponse({
        message: '...',
        metadata: result
    }).send(res);
});
```

### 4. Auth Middleware

#### Shop Authentication (`shopAuth.js`)
```javascript
const { shopAuthenticationV2 } = require('../../auth/shopAuth');

// Verify shop ownership and extract shopId
router.use(shopAuthenticationV2);
```

**What it does:**
- Validates JWT token
- Verifies shop exists and is active
- Attaches `req.shopId` to request
- Throws error if not a shop owner

**Optional variant:**
```javascript
const { optionalShopAuth } = require('../../auth/shopAuth');
```

### 5. Utilities

#### Pagination (`pagination.js`)
```javascript
const { parsePagination, getPaginationMetadata } = require('../../utils/pagination');

const { page, limit, skip } = parsePagination(req.query);
const pagination = getPaginationMetadata(total, page, limit);
```

**Features:**
- Validates page/limit ranges
- Max limit: 100 items
- Returns pagination metadata

#### Validation (`validation.js`)
```javascript
// Validate order status transitions
validateOrderStatusTransition(currentStatus, newStatus);

// Validate discount data
validateDiscountData(discountData);

// Validate inventory data
validateInventoryData(inventoryData);

// Check discount expiry
isDiscountExpired(expiryDate);

// Validate ObjectId format
isValidObjectId(id);
```

---

## 🚀 API Endpoints Summary

### Order Management
```
GET    /v1/api/shop/orders                    - List orders
GET    /v1/api/shop/orders/:id                - Get order detail
PATCH  /v1/api/shop/orders/:id/status         - Update status
```

### Dashboard
```
GET    /v1/api/shop/dashboard                 - Get metrics
```

### Inventory
```
POST   /v1/api/inventory                      - Create/update
GET    /v1/api/inventory                      - List
GET    /v1/api/inventory/:id                  - Get single
GET    /v1/api/inventory/summary              - Get summary
PATCH  /v1/api/inventory/:id                  - Update
DELETE /v1/api/inventory/:id                  - Delete
```

### Products
```
PATCH  /v1/api/product/:id/soft-delete        - Soft delete
PATCH  /v1/api/product/:id/restore            - Restore
DELETE /v1/api/product/:id/permanent          - Permanent delete
GET    /v1/api/product/shop/deleted           - List deleted
```

### Discounts
```
PATCH  /v1/api/discount/:id                   - Update
DELETE /v1/api/discount/:id                   - Delete
```

---

## 🧪 Testing Examples

### 1. Create Inventory

```bash
curl -X POST http://localhost:3000/v1/api/inventory \
  -H "Content-Type: application/json" \
  -H "x-client-id: user_123" \
  -H "authorization: eyJhbGc..." \
  -d '{
    "productId": "507f1f77bcf86cd799439011",
    "totalQuantity": 100,
    "location": "Warehouse A",
    "variants": [
      {
        "size": "M",
        "color": "Red",
        "quantity": 50
      }
    ]
  }'
```

### 2. Get Orders with Filter

```bash
curl -X GET "http://localhost:3000/v1/api/shop/orders?page=1&limit=10&status=pending" \
  -H "x-client-id: user_123" \
  -H "authorization: eyJhbGc..."
```

### 3. Update Order Status

```bash
curl -X PATCH http://localhost:3000/v1/api/shop/orders/507f1f77bcf86cd799439011/status \
  -H "Content-Type: application/json" \
  -H "x-client-id: user_123" \
  -H "authorization: eyJhbGc..." \
  -d '{
    "status": "confirmed"
  }'
```

### 4. Get Dashboard

```bash
curl -X GET http://localhost:3000/v1/api/shop/dashboard \
  -H "x-client-id: user_123" \
  -H "authorization: eyJhbGc..."
```

### 5. Soft Delete Product

```bash
curl -X PATCH http://localhost:3000/v1/api/product/507f1f77bcf86cd799439011/soft-delete \
  -H "x-client-id: user_123" \
  -H "authorization: eyJhbGc..."
```

### 6. Update Discount

```bash
curl -X PATCH http://localhost:3000/v1/api/discount/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -H "x-client-id: user_123" \
  -H "authorization: eyJhbGc..." \
  -d '{
    "value": 20,
    "maxUses": 500
  }'
```

---

## 🔍 Error Handling

All errors follow this format:

```json
{
  "code": 400,
  "message": "Error description",
  "metadata": {}
}
```

### Common Status Transitions Error
```json
{
  "code": 400,
  "message": "Cannot transition from pending to delivered",
  "metadata": {}
}
```

### Permission Error
```json
{
  "code": 403,
  "message": "You do not have permission to view this order",
  "metadata": {}
}
```

### Validation Error
```json
{
  "code": 400,
  "message": "Discount value must be greater than 0",
  "metadata": {}
}
```

---

## 💾 Database Migration Notes

### If Migrating from Old Schema

```javascript
// Update existing orders to include shopId
db.orders.updateMany(
  { shopId: { $exists: false } },
  { $set: { shopId: ObjectId("...") } }
);

// Update existing products to include soft delete fields
db.products.updateMany(
  { isDeleted: { $exists: false } },
  { $set: { isDeleted: false, deletedAt: null } }
);

// Recreate indexes
db.orders.createIndex({ shopId: 1, status: 1 });
db.products.createIndex({ isDeleted: 1 });
db.inventories.createIndex({ productId: 1, shopId: 1 }, { unique: true });
db.discounts.createIndex({ code: 1, shopId: 1 });
```

---

## 📝 Best Practices

### 1. Always Check Ownership
```javascript
if (resource.shopId.toString() !== shopId.toString()) {
    throw new ForbiddenError('Unauthorized');
}
```

### 2. Use Aggregation for Analytics
```javascript
const stats = await orderModel.aggregate([
    { $match: { shopId } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
]);
```

### 3. Validate Before Updating
```javascript
validateOrderStatusTransition(currentStatus, newStatus);
validateDiscountData(updateData);
validateInventoryData(inventoryData);
```

### 4. Exclude Deleted Products
```javascript
const products = await Product.find({ isDeleted: false });
```

### 5. Use Lean for Read-Only
```javascript
const data = await Model.find(query).lean();
```

### 6. Populate Related Data
```javascript
const order = await orderModel
    .findById(orderId)
    .populate('userId', 'name email')
    .populate('items.productId', 'title images');
```

---

## 🚨 Common Issues & Solutions

### Issue: "Cannot transition from X to Y"
**Solution:** Check status transition rules in `validation.js`

### Issue: "You do not have permission"
**Solution:** Verify shop ownership or use correct shopId

### Issue: "Discount expired"
**Solution:** Use future expiryDate when updating

### Issue: "Product not found"
**Solution:** Ensure product belongs to the shop (check product_shop field)

### Issue: Inventory status not updating
**Solution:** Inventory status auto-updates after save(). Check totalQuantity value.

---

## 📚 Additional Resources

- [Complete API Documentation](./SHOP_MODULE_IMPLEMENTATION.md)
- [Error Handling Guide](../core/error.response.js)
- [Database Models](../models/)
- [Validation Utilities](../utils/validation.js)

---

## 🎯 Future Enhancements

1. **Bulk Operations**
   - Bulk update order statuses
   - Bulk update inventory

2. **Advanced Analytics**
   - Revenue trends
   - Customer lifetime value
   - Product performance analysis

3. **Notifications**
   - Low stock alerts
   - New order notifications
   - Status change notifications

4. **Exports**
   - Export orders to CSV
   - Export sales reports

5. **Integrations**
   - Payment gateway
   - Shipping provider
   - Email notifications

---

## ✅ Implementation Checklist

- [x] Update Order model with shopId
- [x] Update Product model with soft delete
- [x] Update Inventory model with variants
- [x] Refactor Discount model
- [x] Create shop auth middleware
- [x] Create pagination utilities
- [x] Create validation utilities
- [x] Implement shop order service
- [x] Implement shop dashboard service
- [x] Implement shop inventory service
- [x] Implement shop product service
- [x] Implement shop discount service
- [x] Create shop controllers
- [x] Create shop routes
- [x] Update product routes
- [x] Update discount routes
- [x] Update inventory routes
- [x] Register shop routes
- [x] Create comprehensive documentation

---

**Last Updated:** January 15, 2024
**Version:** 1.0.0
**Status:** Production Ready ✅

