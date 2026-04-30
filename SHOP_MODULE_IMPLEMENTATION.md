# SHOP MODULE - COMPREHENSIVE API DOCUMENTATION

## 📋 Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Part 1: Order Management](#part-1-order-management)
4. [Part 2: Dashboard](#part-2-dashboard)
5. [Part 3: Inventory Management](#part-3-inventory-management)
6. [Part 4: Product Soft Delete](#part-4-product-soft-delete)
7. [Part 5: Discount Management](#part-5-discount-management)
8. [Status Codes & Errors](#status-codes--errors)

---

## Overview

This Shop module provides comprehensive APIs for e-commerce shop owners to manage orders, products, inventory, discounts, and access business analytics.

**Base URL:** `https://api.example.com/v1/api`

**Architecture:**
- Routes → Controllers → Services → Models
- Clean architecture with separation of concerns
- MongoDB with Mongoose ORM
- JWT-based authentication

---

## Authentication

All shop endpoints require shop-level authentication. Include the following headers:

```
x-client-id: {userId}
authorization: {accessToken}
```

### Auth Response Format
```json
{
  "code": 200,
  "message": "Authenticated successfully",
  "metadata": {
    "user": { "userId": "...", "shopId": "..." },
    "tokens": { "accessToken": "...", "refreshToken": "..." }
  }
}
```

---

# PART 1: ORDER MANAGEMENT

## 1. Get All Shop Orders

**Endpoint:** `GET /shop/orders`

**Description:** Retrieve all orders for the authenticated shop with pagination and filtering.

**Headers:**
```
x-client-id: {userId}
authorization: {accessToken}
```

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | number | No | 1 | Page number |
| limit | number | No | 10 | Items per page (max 100) |
| status | string | No | - | Filter by status: pending, confirmed, processing, shipped, delivered, cancelled |

**Example Request:**
```bash
GET /v1/api/shop/orders?page=1&limit=10&status=pending
```

**Success Response (200):**
```json
{
  "code": 200,
  "message": "Get shop orders successfully!",
  "metadata": {
    "orders": [
      {
        "_id": "order_id_123",
        "userId": "user_id_456",
        "shopId": "shop_id_789",
        "receiverName": "John Doe",
        "receiverPhone": "0901234567",
        "address": "123 Main St, Ho Chi Minh",
        "items": [
          {
            "productId": "prod_id",
            "productName": "T-Shirt",
            "quantity": 2,
            "price": 150000,
            "color": "Red",
            "size": "M",
            "image": "https://..."
          }
        ],
        "totalPrice": 300000,
        "discountAmount": 30000,
        "finalPrice": 270000,
        "status": "pending",
        "paymentMethod": "cod",
        "discountCode": "SALE2024",
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "total": 45,
      "page": 1,
      "limit": 10,
      "totalPages": 5,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

**Error Responses:**
```json
{
  "code": 401,
  "message": "Invalid request - missing client ID",
  "metadata": {}
}
```

---

## 2. Get Order Detail

**Endpoint:** `GET /shop/orders/:id`

**Description:** Retrieve detailed information about a specific order.

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Order ID |

**Example Request:**
```bash
GET /v1/api/shop/orders/507f1f77bcf86cd799439011
```

**Success Response (200):**
```json
{
  "code": 200,
  "message": "Get order successfully!",
  "metadata": {
    "_id": "order_id_123",
    "userId": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "0901234567"
    },
    "items": [
      {
        "productId": {
          "_id": "prod_id",
          "title": "T-Shirt",
          "images": ["..."],
          "price": 150000
        },
        "quantity": 2,
        "price": 150000,
        "color": "Red",
        "size": "M"
      }
    ],
    "totalPrice": 300000,
    "finalPrice": 270000,
    "status": "pending",
    "paymentMethod": "cod"
  }
}
```

**Error Responses:**
```json
{
  "code": 404,
  "message": "Order not found",
  "metadata": {}
}
```

```json
{
  "code": 403,
  "message": "You do not have permission to view this order",
  "metadata": {}
}
```

---

## 3. Update Order Status

**Endpoint:** `PATCH /shop/orders/:id/status`

**Description:** Update the status of an order with validation of status transitions.

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Order ID |

**Request Body:**
```json
{
  "status": "confirmed"
}
```

**Valid Status Transitions:**
```
pending → confirmed → processing → shipped → delivered
pending → cancelled
confirmed → cancelled
```

**Example Request:**
```bash
PATCH /v1/api/shop/orders/507f1f77bcf86cd799439011/status
Content-Type: application/json

{
  "status": "confirmed"
}
```

**Success Response (200):**
```json
{
  "code": 200,
  "message": "Update order status successfully!",
  "metadata": {
    "_id": "order_id_123",
    "status": "confirmed",
    "updatedAt": "2024-01-15T11:00:00Z"
  }
}
```

**Error Responses:**
```json
{
  "code": 400,
  "message": "Cannot transition from pending to shipped",
  "metadata": {}
}
```

---

# PART 2: DASHBOARD

## 1. Get Shop Dashboard

**Endpoint:** `GET /shop/dashboard`

**Description:** Retrieve comprehensive dashboard metrics for shop analytics.

**Example Request:**
```bash
GET /v1/api/shop/dashboard
```

**Success Response (200):**
```json
{
  "code": 200,
  "message": "Get shop dashboard successfully!",
  "metadata": {
    "overview": {
      "totalOrders": 150,
      "totalRevenue": 45000000,
      "totalProducts": 25,
      "totalCustomers": 89
    },
    "ordersByStatus": {
      "pending": {
        "count": 5,
        "revenue": 2000000
      },
      "confirmed": {
        "count": 10,
        "revenue": 5000000
      },
      "processing": {
        "count": 8,
        "revenue": 4000000
      },
      "shipped": {
        "count": 20,
        "revenue": 10000000
      },
      "delivered": {
        "count": 100,
        "revenue": 22000000
      },
      "cancelled": {
        "count": 7,
        "revenue": 2000000
      }
    },
    "topSellingProducts": [
      {
        "_id": "product_id_1",
        "productTitle": "Best Seller T-Shirt",
        "productImage": "https://...",
        "totalSold": 450,
        "totalRevenue": 67500000
      },
      {
        "_id": "product_id_2",
        "productTitle": "Popular Jeans",
        "productImage": "https://...",
        "totalSold": 320,
        "totalRevenue": 48000000
      }
    ],
    "lowStockInventory": [
      {
        "_id": "inventory_id",
        "productId": "product_id",
        "productTitle": "Low Stock Item",
        "totalQuantity": 5,
        "status": "low_stock",
        "location": "Warehouse A"
      }
    ]
  }
}
```

---

# PART 3: INVENTORY MANAGEMENT

## 1. Create or Update Inventory

**Endpoint:** `POST /inventory`

**Description:** Create new inventory or update existing inventory for a product.

**Request Body:**
```json
{
  "productId": "product_id_123",
  "totalQuantity": 100,
  "location": "Main Warehouse",
  "reserved": 10,
  "variants": [
    {
      "size": "M",
      "color": "Red",
      "quantity": 30
    },
    {
      "size": "L",
      "color": "Red",
      "quantity": 25
    },
    {
      "size": "M",
      "color": "Blue",
      "quantity": 45
    }
  ]
}
```

**Example Request:**
```bash
POST /v1/api/inventory
Content-Type: application/json

{
  "productId": "507f1f77bcf86cd799439011",
  "totalQuantity": 100,
  "location": "Warehouse A"
}
```

**Success Response (201/200):**
```json
{
  "code": 201,
  "message": "Inventory created/updated successfully!",
  "metadata": {
    "_id": "inventory_id",
    "productId": "product_id",
    "shopId": "shop_id",
    "totalQuantity": 100,
    "reserved": 0,
    "location": "Warehouse A",
    "status": "in_stock",
    "variants": [],
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  }
}
```

**Error Responses:**
```json
{
  "code": 404,
  "message": "Product not found",
  "metadata": {}
}
```

```json
{
  "code": 403,
  "message": "You do not own this product",
  "metadata": {}
}
```

---

## 2. Get All Shop Inventory

**Endpoint:** `GET /inventory`

**Description:** Retrieve all inventory records for the shop with pagination and filtering.

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | number | No | 1 | Page number |
| limit | number | No | 10 | Items per page |
| status | string | No | - | Filter: in_stock, low_stock, out_of_stock |

**Example Request:**
```bash
GET /v1/api/inventory?page=1&limit=20&status=low_stock
```

**Success Response (200):**
```json
{
  "code": 200,
  "message": "Get shop inventory successfully!",
  "metadata": {
    "inventories": [
      {
        "_id": "inventory_id",
        "productId": {
          "_id": "product_id",
          "title": "T-Shirt",
          "images": ["..."],
          "price": 150000
        },
        "totalQuantity": 100,
        "reserved": 10,
        "location": "Warehouse A",
        "status": "in_stock",
        "variants": []
      }
    ],
    "pagination": {
      "total": 25,
      "page": 1,
      "limit": 20,
      "totalPages": 2,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

---

## 3. Get Inventory Summary

**Endpoint:** `GET /inventory/summary`

**Description:** Get overall inventory statistics for the shop.

**Example Request:**
```bash
GET /v1/api/inventory/summary
```

**Success Response (200):**
```json
{
  "code": 200,
  "message": "Get inventory summary successfully!",
  "metadata": {
    "totalItems": 45,
    "totalQuantity": 5000,
    "inStockCount": 35,
    "lowStockCount": 8,
    "outOfStockCount": 2
  }
}
```

---

## 4. Get Single Inventory

**Endpoint:** `GET /inventory/:id`

**Description:** Retrieve detailed inventory information.

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Inventory ID |

**Success Response (200):**
```json
{
  "code": 200,
  "message": "Get inventory successfully!",
  "metadata": {
    "_id": "inventory_id",
    "productId": "product_id",
    "shopId": "shop_id",
    "totalQuantity": 100,
    "reserved": 5,
    "location": "Warehouse A",
    "status": "in_stock",
    "variants": [
      {
        "size": "M",
        "color": "Red",
        "quantity": 30
      }
    ]
  }
}
```

---

## 5. Update Inventory

**Endpoint:** `PATCH /inventory/:id`

**Description:** Update inventory quantity, location, or variants.

**Request Body:**
```json
{
  "totalQuantity": 150,
  "location": "Warehouse B",
  "reserved": 15,
  "variants": [
    {
      "size": "M",
      "color": "Red",
      "quantity": 50
    }
  ]
}
```

**Success Response (200):**
```json
{
  "code": 200,
  "message": "Update inventory successfully!",
  "metadata": {
    "_id": "inventory_id",
    "totalQuantity": 150,
    "location": "Warehouse B",
    "status": "in_stock",
    "updatedAt": "2024-01-15T11:00:00Z"
  }
}
```

**Validation Errors:**
```json
{
  "code": 400,
  "message": "Total quantity cannot be negative",
  "metadata": {}
}
```

---

## 6. Delete Inventory

**Endpoint:** `DELETE /inventory/:id`

**Description:** Delete inventory record.

**Success Response (200):**
```json
{
  "code": 200,
  "message": "Delete inventory successfully!",
  "metadata": {
    "message": "Inventory deleted successfully"
  }
}
```

---

# PART 4: PRODUCT SOFT DELETE

## 1. Soft Delete Product

**Endpoint:** `PATCH /product/:id/soft-delete`

**Description:** Soft delete a product (marks as deleted but doesn't remove data).

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Product ID |

**Example Request:**
```bash
PATCH /v1/api/product/507f1f77bcf86cd799439011/soft-delete
```

**Success Response (200):**
```json
{
  "code": 200,
  "message": "Product soft deleted successfully!",
  "metadata": {
    "_id": "product_id",
    "title": "T-Shirt",
    "isDeleted": true,
    "deletedAt": "2024-01-15T11:00:00Z",
    "price": 150000
  }
}
```

**Error Responses:**
```json
{
  "code": 403,
  "message": "You do not have permission to delete this product",
  "metadata": {}
}
```

---

## 2. Restore Deleted Product

**Endpoint:** `PATCH /product/:id/restore`

**Description:** Restore a soft-deleted product.

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Product ID |

**Example Request:**
```bash
PATCH /v1/api/product/507f1f77bcf86cd799439011/restore
```

**Success Response (200):**
```json
{
  "code": 200,
  "message": "Product restored successfully!",
  "metadata": {
    "_id": "product_id",
    "title": "T-Shirt",
    "isDeleted": false,
    "deletedAt": null,
    "price": 150000
  }
}
```

---

## 3. Permanently Delete Product

**Endpoint:** `DELETE /product/:id/permanent`

**Description:** Permanently delete a product (hard delete from database).

**Example Request:**
```bash
DELETE /v1/api/product/507f1f77bcf86cd799439011/permanent
```

**Success Response (200):**
```json
{
  "code": 200,
  "message": "Product permanently deleted!",
  "metadata": {
    "message": "Product permanently deleted"
  }
}
```

---

## 4. Get Deleted Products

**Endpoint:** `GET /product/shop/deleted`

**Description:** View all soft-deleted products for the shop.

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | number | No | 1 | Page number |
| limit | number | No | 10 | Items per page |

**Success Response (200):**
```json
{
  "code": 200,
  "message": "Get deleted products successfully!",
  "metadata": {
    "products": [
      {
        "_id": "product_id",
        "title": "Deleted Product",
        "price": 150000,
        "isDeleted": true,
        "deletedAt": "2024-01-15T10:00:00Z"
      }
    ],
    "pagination": {
      "total": 5,
      "page": 1,
      "limit": 10
    }
  }
}
```

---

# PART 5: DISCOUNT MANAGEMENT

## 1. Update Discount

**Endpoint:** `PATCH /discount/:id`

**Description:** Update discount details with validation.

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Discount ID |

**Request Body:**
```json
{
  "description": "Updated Sale Description",
  "value": 15,
  "maxUses": 200,
  "expiryDate": "2024-12-31T23:59:59Z",
  "minOrderValue": 100000,
  "applicableProducts": ["product_id_1", "product_id_2"]
}
```

**Allowed Update Fields:**
- `description` (string)
- `value` (number) - > 0, <= 100 for percentage
- `maxUses` (number) - >= currentUsedCount
- `expiryDate` (date) - must be in future
- `applicableProducts` (array of product IDs)
- `applicableCategories` (array of category IDs)
- `minOrderValue` (number) - >= 0

**Example Request:**
```bash
PATCH /v1/api/discount/507f1f77bcf86cd799439011
Content-Type: application/json

{
  "value": 15,
  "maxUses": 200
}
```

**Success Response (200):**
```json
{
  "code": 200,
  "message": "Discount updated successfully!",
  "metadata": {
    "_id": "discount_id",
    "code": "SALE2024",
    "description": "Updated description",
    "value": 15,
    "maxUses": 200,
    "usedCount": 45,
    "expiryDate": "2024-12-31T23:59:59Z"
  }
}
```

**Validation Errors:**
```json
{
  "code": 400,
  "message": "Cannot update expired discount",
  "metadata": {}
}
```

```json
{
  "code": 400,
  "message": "Max uses cannot be less than already used count",
  "metadata": {}
}
```

---

## 2. Delete Discount

**Endpoint:** `DELETE /discount/:id`

**Description:** Delete a discount code.

**Request Body (optional):**
```json
{
  "allowIfUsed": false
}
```

**Example Request:**
```bash
DELETE /v1/api/discount/507f1f77bcf86cd799439011
Content-Type: application/json

{
  "allowIfUsed": false
}
```

**Success Response (200):**
```json
{
  "code": 200,
  "message": "Discount deleted successfully!",
  "metadata": {
    "message": "Discount deleted successfully",
    "discountId": "discount_id",
    "usedCount": 0
  }
}
```

**Error Response:**
```json
{
  "code": 400,
  "message": "Cannot delete discount that has been used (45 times). Set allowIfUsed=true to force deletion.",
  "metadata": {}
}
```

---

# STATUS CODES & ERRORS

## Standard Response Format

**Success:**
```json
{
  "code": 200,
  "message": "Description",
  "metadata": {}
}
```

**Error:**
```json
{
  "code": 400,
  "message": "Error description",
  "metadata": {}
}
```

## HTTP Status Codes

| Code | Status | Description |
|------|--------|-------------|
| 200 | OK | Successful GET, PATCH, DELETE |
| 201 | Created | Successful POST |
| 400 | Bad Request | Invalid input, validation error |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | No permission for resource |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource conflict (e.g., duplicate) |
| 500 | Internal Server Error | Server error |

## Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Invalid request - missing client ID" | Missing x-client-id header | Include `x-client-id` header |
| "Invalid accessToken" | Missing or invalid token | Include valid `authorization` header |
| "Shop not found" | Shop doesn't exist | Verify shopId |
| "You do not have permission" | Wrong shop owner | Ensure authenticated as correct shop |
| "Cannot transition from X to Y" | Invalid status transition | Use valid status transition |
| "Order not found" | Order ID doesn't exist | Verify order ID |
| "Product not found" | Product ID doesn't exist | Verify product ID |

---

## Integration Guide

### Example: Complete Order Management Workflow

```bash
# 1. Get pending orders
GET /v1/api/shop/orders?status=pending

# 2. View order details
GET /v1/api/shop/orders/{orderId}

# 3. Confirm order
PATCH /v1/api/shop/orders/{orderId}/status
Body: { "status": "confirmed" }

# 4. Mark as processing
PATCH /v1/api/shop/orders/{orderId}/status
Body: { "status": "processing" }

# 5. Mark as shipped
PATCH /v1/api/shop/orders/{orderId}/status
Body: { "status": "shipped" }
```

### Example: Inventory & Dashboard Workflow

```bash
# 1. Get dashboard metrics
GET /v1/api/shop/dashboard

# 2. Check low stock items
GET /v1/api/inventory?status=low_stock

# 3. Update inventory
PATCH /v1/api/inventory/{inventoryId}
Body: { "totalQuantity": 150, "location": "Warehouse B" }

# 4. Get inventory summary
GET /v1/api/inventory/summary
```

---

## Notes

- All monetary values are in Vietnamese Dong (VND)
- Timestamps are in ISO 8601 format (UTC)
- Pagination default: page=1, limit=10, max limit=100
- Soft deleted products are excluded from all public queries automatically
- Order status transitions are validated and enforced
- Discounts cannot be updated if expired
- Shop ownership is verified for all operations

