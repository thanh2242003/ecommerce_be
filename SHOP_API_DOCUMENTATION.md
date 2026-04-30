# SHOP API DOCUMENTATION

## 📋 Table of Contents
1. [Overview](#overview)
2. [Authentication & Authorization](#authentication--authorization)
3. [Shop Account Status](#shop-account-status)
4. [Endpoints](#endpoints)
   - [Authentication Endpoints](#authentication-endpoints)
   - [Shop Status Endpoints](#shop-status-endpoints)
   - [Order Management](#order-management)
   - [Dashboard & Analytics](#dashboard--analytics)
5. [Error Responses](#error-responses)
6. [Examples](#examples)

---

## Overview

**Base URL:** `http://localhost:3000/v1/api`

The Shop API provides endpoints for e-commerce shop owners to:
- Manage authentication (sign in, sign up)
- View and update their account status
- Manage customer orders
- Access business analytics & dashboard

**Technology Stack:**
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- Status-based authorization

---

## Authentication & Authorization

### Shop Account Status

Shops have three possible status states:

| Status | Description | Can Access API? | Notes |
|--------|-------------|-----------------|-------|
| **active** | Shop is verified and operational | ✅ Yes | Normal operation |
| **inactive** | Shop pending admin verification | ❌ No | Login succeeds but API blocked |
| **blocked** | Shop blocked by admin | ❌ No | Includes `blockedReason` & `blockedAt` |

### Login Flow

1. **Shop Signup** → `status=inactive` (default)
2. **Admin Verification** → `status=active`, `verify=true`
3. **Shop Login Success** → Returns `accessToken` + `refreshToken`
4. **Shop API Access** → Headers required:
   ```
   x-client-id: {userId_from_login}
   authorization: {accessToken_from_login}
   ```

### Blocked Shop Error
```json
{
  "code": 403,
  "message": "Shop account has been blocked. Reason: Vi phạm điều khoản",
  "metadata": null
}
```

---

## Endpoints

### Authentication Endpoints

#### 1. Shop Sign Up

**Endpoint:** `POST /shop/signup`

**Description:** Register a new shop account (no auth required)

**Request Body:**
```json
{
  "name": "My Cool Shop",
  "email": "shop@example.com",
  "password": "SecurePassword123!"
}
```

**Success Response (201):**
```json
{
  "code": 201,
  "message": "Registered successfully!",
  "metadata": {
    "shop": {
      "_id": "shop_id_123",
      "name": "My Cool Shop",
      "email": "shop@example.com",
      "status": "inactive",
      "verify": false
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
    }
  }
}
```

**Error Response (400):**
```json
{
  "code": 400,
  "message": "Error: Shop already registered",
  "metadata": null
}
```

---

#### 2. Shop Sign In

**Endpoint:** `POST /shop/signin`

**Description:** Login to shop account and get tokens (no auth required)

**Request Body:**
```json
{
  "email": "shop@example.com",
  "password": "SecurePassword123!"
}
```

**Success Response (200):**
```json
{
  "code": 200,
  "message": "Login successfully!",
  "metadata": {
    "shop": {
      "_id": "shop_id_123",
      "name": "My Cool Shop",
      "email": "shop@example.com"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
    }
  }
}
```

**Error Cases:**

❌ Shop not found (400):
```json
{
  "code": 400,
  "message": "Error: Shop not found",
  "metadata": null
}
```

❌ Invalid password (401):
```json
{
  "code": 401,
  "message": "Error: Invalid password",
  "metadata": null
}
```

❌ Shop pending verification (403):
```json
{
  "code": 403,
  "message": "Shop account is pending verification by admin. Please wait or contact support.",
  "metadata": null
}
```

❌ Shop blocked (403):
```json
{
  "code": 403,
  "message": "Shop account has been blocked. Reason: Vi phạm điều khoản",
  "metadata": null
}
```

---

### Shop Status Endpoints

#### 3. Get Shop Account Status

**Endpoint:** `GET /shop/status`

**Description:** Check current shop account status and verification info (requires auth)

**Headers:**
```
x-client-id: {userId}
authorization: {accessToken}
```

**Success Response (200):**
```json
{
  "code": 200,
  "message": "Get shop status successfully!",
  "metadata": {
    "status": "active",
    "isActive": true,
    "isBlocked": false,
    "isPending": false,
    "verify": true,
    "verifiedAt": "2026-04-30T10:00:00.000Z",
    "verifiedBy": "admin_id_123",
    "blockedAt": null,
    "blockedReason": ""
  }
}
```

**Status Flags:**
- `status`: Current status (active|inactive|blocked)
- `isActive`: Is shop active and operational?
- `isBlocked`: Is shop blocked by admin?
- `isPending`: Is shop awaiting verification?
- `verify`: Is shop verified?
- `verifiedAt`: When was shop verified?
- `blockedAt`: When was shop blocked? (null if not blocked)
- `blockedReason`: Why was shop blocked? (empty if not blocked)

---

### Order Management

#### 4. Get All Shop Orders

**Endpoint:** `GET /shop/orders`

**Description:** Retrieve all orders for the shop with pagination and filtering (requires auth)

**Headers:**
```
x-client-id: {userId}
authorization: {accessToken}
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number (1-indexed) |
| limit | number | 10 | Items per page (max 100) |
| status | string | - | Filter by status: pending, confirmed, processing, shipped, delivered, cancelled |

**Example Request:**
```
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
        "_id": "order_123",
        "userId": "user_456",
        "shopId": "shop_789",
        "status": "pending",
        "items": [
          {
            "productId": "prod_111",
            "quantity": 2,
            "price": 150000
          }
        ],
        "totalAmount": 300000,
        "shippingAddress": "123 Main St, HCM",
        "createdAt": "2026-04-30T10:00:00.000Z",
        "updatedAt": "2026-04-30T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

---

#### 5. Get Order Detail

**Endpoint:** `GET /shop/orders/:id`

**Description:** Get detailed information about a specific order (requires auth)

**Headers:**
```
x-client-id: {userId}
authorization: {accessToken}
```

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Order ID (MongoDB ObjectId) |

**Example Request:**
```
GET /v1/api/shop/orders/507f1f77bcf86cd799439011
```

**Success Response (200):**
```json
{
  "code": 200,
  "message": "Get order successfully!",
  "metadata": {
    "_id": "order_123",
    "userId": {
      "_id": "user_456",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "0901234567"
    },
    "shopId": "shop_789",
    "status": "pending",
    "items": [
      {
        "productId": {
          "_id": "prod_111",
          "title": "T-Shirt",
          "images": ["https://..."],
          "price": 150000
        },
        "quantity": 2,
        "color": "Red",
        "size": "M"
      }
    ],
    "totalAmount": 300000,
    "shippingAddress": "123 Main St, HCM",
    "createdAt": "2026-04-30T10:00:00.000Z",
    "updatedAt": "2026-04-30T10:00:00.000Z"
  }
}
```

**Error Responses:**

❌ Order not found (404):
```json
{
  "code": 404,
  "message": "Order not found",
  "metadata": null
}
```

❌ Not owner of order (403):
```json
{
  "code": 403,
  "message": "You do not have permission to view this order",
  "metadata": null
}
```

---

#### 6. Update Order Status

**Endpoint:** `PATCH /shop/orders/:id/status`

**Description:** Update order status (requires auth)

**Headers:**
```
x-client-id: {userId}
authorization: {accessToken}
Content-Type: application/json
```

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Order ID (MongoDB ObjectId) |

**Request Body:**
```json
{
  "status": "confirmed"
}
```

**Valid Status Values:**
```
pending → confirmed → processing → shipped → delivered
         ↘                                    ↓
          ————————— cancelled ←————————————————
```

**Success Response (200):**
```json
{
  "code": 200,
  "message": "Update order status successfully!",
  "metadata": {
    "_id": "order_123",
    "status": "confirmed",
    "updatedAt": "2026-04-30T11:00:00.000Z"
  }
}
```

**Error Responses:**

❌ Invalid status (400):
```json
{
  "code": 400,
  "message": "Invalid status transition",
  "metadata": null
}
```

❌ Order not found (404):
```json
{
  "code": 404,
  "message": "Order not found",
  "metadata": null
}
```

---

### Dashboard & Analytics

#### 7. Get Shop Dashboard

**Endpoint:** `GET /shop/dashboard`

**Description:** Get comprehensive dashboard metrics (requires auth)

**Headers:**
```
x-client-id: {userId}
authorization: {accessToken}
```

**Success Response (200):**
```json
{
  "code": 200,
  "message": "Get shop dashboard successfully!",
  "metadata": {
    "totalRevenue": 5000000,
    "totalOrders": 45,
    "totalProducts": 120,
    "totalCustomers": 32,
    "ordersByStatus": {
      "pending": 5,
      "confirmed": 8,
      "processing": 12,
      "shipped": 15,
      "delivered": 5,
      "cancelled": 0
    },
    "topSellingProducts": [
      {
        "productId": "prod_111",
        "title": "T-Shirt",
        "totalSold": 150,
        "revenue": 1500000
      },
      {
        "productId": "prod_222",
        "title": "Jeans",
        "totalSold": 95,
        "revenue": 950000
      }
    ],
    "lowStockProducts": [
      {
        "productId": "prod_333",
        "title": "Limited Edition Cap",
        "currentStock": 2
      }
    ]
  }
}
```

---

## Error Responses

### Common Error Codes

| Code | Error | Meaning |
|------|-------|---------|
| 400 | Bad Request | Invalid input or validation failed |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Authenticated but not authorized (shop inactive/blocked) |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists |
| 500 | Server Error | Internal server error |

### Auth Error Examples

**Missing client ID (401):**
```json
{
  "code": 401,
  "message": "Invalid request - missing client ID",
  "metadata": null
}
```

**Missing access token (401):**
```json
{
  "code": 401,
  "message": "Invalid request - missing access token",
  "metadata": null
}
```

**Invalid token (401):**
```json
{
  "code": 401,
  "message": "Invalid user ID",
  "metadata": null
}
```

**Shop not found (404):**
```json
{
  "code": 404,
  "message": "Shop not found",
  "metadata": null
}
```

---

## Examples

### Example 1: Complete Shop Login Flow

```bash
# 1. Sign up new shop
curl -X POST http://localhost:3000/v1/api/shop/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tech Shop",
    "email": "tech@example.com",
    "password": "Pass@123"
  }'

# Response:
# {
#   "code": 201,
#   "message": "Registered successfully!",
#   "metadata": {
#     "shop": {
#       "_id": "60d5ec49c1234567890abcde",
#       "name": "Tech Shop",
#       "email": "tech@example.com",
#       "status": "inactive",
#       "verify": false
#     },
#     "tokens": {
#       "accessToken": "eyJhbGciOiJIUzI1NiIs...",
#       "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
#     }
#   }
# }

# 2. Try to login (will be blocked - status is inactive)
curl -X POST http://localhost:3000/v1/api/shop/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tech@example.com",
    "password": "Pass@123"
  }'

# Response: 403 Forbidden - pending verification

# 3. Admin verifies shop via admin API...

# 4. Now login succeeds
curl -X POST http://localhost:3000/v1/api/shop/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tech@example.com",
    "password": "Pass@123"
  }'

# Response: 200 OK with tokens
```

### Example 2: Get Shop Orders with Auth

```bash
# Using tokens from login response
curl -X GET http://localhost:3000/v1/api/shop/orders?page=1&limit=10 \
  -H "x-client-id: 60d5ec49c1234567890abcde" \
  -H "authorization: eyJhbGciOiJIUzI1NiIs..."

# Response: 200 OK with paginated orders
```

### Example 3: Update Order Status

```bash
curl -X PATCH http://localhost:3000/v1/api/shop/orders/507f1f77bcf86cd799439011/status \
  -H "x-client-id: 60d5ec49c1234567890abcde" \
  -H "authorization: eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "status": "confirmed"
  }'

# Response: 200 OK with updated order
```

### Example 4: Check Shop Status

```bash
curl -X GET http://localhost:3000/v1/api/shop/status \
  -H "x-client-id: 60d5ec49c1234567890abcde" \
  -H "authorization: eyJhbGciOiJIUzI1NiIs..."

# Response: 
# {
#   "code": 200,
#   "message": "Get shop status successfully!",
#   "metadata": {
#     "status": "active",
#     "isActive": true,
#     "verify": true,
#     "verifiedAt": "2026-04-30T10:00:00.000Z"
#   }
# }
```

---

## HTTP Status Codes Summary

```
✅ 200 - OK (Successful GET/PATCH)
✅ 201 - Created (Successful POST for signup)
❌ 400 - Bad Request (Invalid input)
❌ 401 - Unauthorized (Missing/invalid auth)
❌ 403 - Forbidden (Auth OK but not permitted)
❌ 404 - Not Found (Resource not found)
❌ 500 - Server Error (Internal error)
```

---

## Notes

1. **Status Verification**: New shops must be verified by admin before API access
2. **Rate Limiting**: Consider implementing rate limiting for production
3. **Token Expiry**: Access tokens expire after 2 days, use refresh token to get new one
4. **HTTPS**: Always use HTTPS in production
5. **Pagination**: Default page size is 10, max is 100
6. **Timestamps**: All timestamps are in ISO 8601 format (UTC)

