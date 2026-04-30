# Tài liệu API Admin - Khớp với Mã Nguồn Hiện Tại

Tài liệu này mô tả chi tiết tất cả các endpoint Admin API hiện được triển khai trong ứng dụng.

## Thông Tin Chung

**Base URL:** `GET /v1/api/admin`

**Xác Thực:**
- Tất cả endpoint (ngoại trừ `POST /auth/login`) yêu cầu header: `Authorization: Bearer <adminAccessToken>`
- Middleware: `verifyAdmin` kiểm tra JWT token và vai trò admin
- Format response chuẩn cho tất cả endpoint:

```json
{
  "code": 200,
  "message": "...",
  "metadata": { ... }
}
```

**Phân Trang (Pagination):**
- Mặc định: `page=1, limit=10`
- Tối đa: `limit=100`
- Query params: `page`, `limit`

---

## 1. Admin Authentication (Xác Thực Admin)

### POST /auth/login
Đăng nhập admin

**Headers:** None

**Body:**
```json
{
  "account": "admin_account",
  "password": "password"
}
```

**Response:**
```json
{
  "code": 200,
  "message": "Admin login successfully!",
  "metadata": {
    "admin": {
      "_id": "admin_id",
      "name": "Admin Name",
      "account": "admin_account",
      "status": "active",
      "roles": ["admin"],
      "verify": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "tokens": {
      "accessToken": "jwt_token",
      "refreshToken": "jwt_refresh_token"
    }
  }
}
```

**Lỗi:**
- `401`: Invalid admin credentials
- `403`: Only admin accounts can login / Admin account is inactive

---

### GET /profile
Lấy thông tin profile admin hiện tại

**Headers:** `Authorization: Bearer <adminAccessToken>`

**Query Params:** None

**Response:**
```json
{
  "code": 200,
  "message": "Get admin profile successfully!",
  "metadata": {
    "_id": "admin_id",
    "name": "Admin Name",
    "account": "admin_account",
    "status": "active",
    "roles": ["admin"],
    "verify": true,
    "permissions": [],
    "lastLogin": "2024-01-01T00:00:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## 2. Shop Management (Quản Lý Shop)

### GET /shops
Lấy danh sách shops với phân trang

**Headers:** `Authorization: Bearer <adminAccessToken>`

**Query Params:**
- `page` (number, default: 1)
- `limit` (number, default: 10, max: 100)
- `status` (string): `active`, `blocked`, `inactive` - lọc theo trạng thái
- `keyword` (string): tìm kiếm theo `name` hoặc `email`

**Response:**
```json
{
  "code": 200,
  "message": "Get shops successfully!",
  "metadata": {
    "shops": [
      {
        "_id": "shop_id",
        "name": "Shop Name",
        "email": "shop@example.com",
        "phone": "0123456789",
        "status": "active",
        "verify": true,
        "avatar": "url_to_image",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 10,
      "totalPages": 5,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

---

### GET /shops/:shopId
Lấy chi tiết một shop cụ thể

**Headers:** `Authorization: Bearer <adminAccessToken>`

**Params:** `shopId` (MongoDB ObjectId)

**Response:**
```json
{
  "code": 200,
  "message": "Get shop successfully!",
  "metadata": {
    "_id": "shop_id",
    "name": "Shop Name",
    "email": "shop@example.com",
    "phone": "0123456789",
    "status": "active",
    "verify": true,
    "avatar": "url_to_image",
    "blockedAt": null,
    "blockedReason": "",
    "verifiedAt": "2024-01-01T00:00:00.000Z",
    "verifiedBy": "admin_id",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Lỗi:**
- `400`: Invalid shop ID
- `404`: Shop not found

---

### PATCH /shops/:shopId/status
Cập nhật trạng thái shop (kích hoạt/chặn)

**Headers:** `Authorization: Bearer <adminAccessToken>`

**Params:** `shopId` (MongoDB ObjectId)

**Body:**
```json
{
  "status": "active|blocked|inactive",
  "reason": "Lý do chặn (tuỳ chọn)"
}
```

**Status Values:**
- `active`: Kích hoạt shop
- `blocked` / `inactive`: Chặn shop

**Response:**
```json
{
  "code": 200,
  "message": "Update shop status successfully!",
  "metadata": {
    "_id": "shop_id",
    "name": "Shop Name",
    "status": "blocked",
    "blockedAt": "2024-01-01T00:00:00.000Z",
    "blockedReason": "Vi phạm điều khoản"
  }
}
```

**Lỗi:**
- `400`: Invalid shop ID / Invalid status
- `404`: Shop not found

---

### PATCH /shops/:shopId/verify
Xác minh shop (cấp quyền hoạt động)

**Headers:** `Authorization: Bearer <adminAccessToken>`

**Params:** `shopId` (MongoDB ObjectId)

**Body:** `{}` (empty)

**Response:**
```json
{
  "code": 200,
  "message": "Verify shop successfully!",
  "metadata": {
    "_id": "shop_id",
    "name": "Shop Name",
    "verify": true,
    "status": "active",
    "verifiedAt": "2024-01-01T00:00:00.000Z",
    "verifiedBy": "admin_id"
  }
}
```

**Lỗi:**
- `400`: Invalid shop ID
- `404`: Shop not found

---

## 3. User Management (Quản Lý User)

### GET /users
Lấy danh sách users với phân trang

**Headers:** `Authorization: Bearer <adminAccessToken>`

**Query Params:**
- `page` (number, default: 1)
- `limit` (number, default: 10, max: 100)
- `status` (string): `active`, `inactive`, `ban`, `unban`
- `keyword` (string): tìm kiếm theo `name` hoặc `email`

**Response:**
```json
{
  "code": 200,
  "message": "Get users successfully!",
  "metadata": {
    "users": [
      {
        "_id": "user_id",
        "name": "User Name",
        "email": "user@example.com",
        "phone": "0123456789",
        "address": "Address",
        "avatar": "url_to_image",
        "status": "active",
        "roles": ["user"],
        "verify": true,
        "isAdmin": false,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "totalPages": 10,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

---

### GET /users/:userId
Lấy chi tiết một user cụ thể

**Headers:** `Authorization: Bearer <adminAccessToken>`

**Params:** `userId` (MongoDB ObjectId)

**Response:**
```json
{
  "code": 200,
  "message": "Get user successfully!",
  "metadata": {
    "_id": "user_id",
    "name": "User Name",
    "email": "user@example.com",
    "phone": "0123456789",
    "address": "Address",
    "avatar": "url_to_image",
    "status": "active",
    "roles": ["user"],
    "verify": true,
    "isAdmin": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Lỗi:**
- `400`: Invalid user ID
- `404`: User not found

---

### PATCH /users/:userId/status
Cập nhật trạng thái user (kích hoạt/ban)

**Headers:** `Authorization: Bearer <adminAccessToken>`

**Params:** `userId` (MongoDB ObjectId)

**Body:**
```json
{
  "status": "active|inactive|ban|unban"
}
```

**Status Values:**
- `active` / `unban`: Kích hoạt user (bỏ ban)
- `inactive` / `ban`: Ban user

**Response:**
```json
{
  "code": 200,
  "message": "Update user status successfully!",
  "metadata": {
    "_id": "user_id",
    "name": "User Name",
    "status": "inactive",
    "isAdmin": false
  }
}
```

**Lỗi:**
- `400`: Invalid user ID / Invalid status
- `403`: Cannot ban another admin / Cannot ban yourself
- `404`: User not found

---

## 4. Product Management (Kiểm Duyệt Sản Phẩm)

### GET /products
Lấy danh sách sản phẩm (bao gồm cả chưa công khai)

**Headers:** `Authorization: Bearer <adminAccessToken>`

**Query Params:**
- `page` (number, default: 1)
- `limit` (number, default: 10, max: 100)
- `status` (string): `pending`, `approved`, `rejected`

**Response:**
```json
{
  "code": 200,
  "message": "Get products successfully!",
  "metadata": {
    "products": [
      {
        "_id": "product_id",
        "title": "Product Name",
        "status": "pending",
        "price": 100000,
        "images": ["url1", "url2"],
        "product_type": "simple|variable",
        "categoryId": {
          "_id": "category_id",
          "name": "Category",
          "slug": "category"
        },
        "product_shop": {
          "_id": "shop_id",
          "name": "Shop Name",
          "email": "shop@example.com",
          "status": "active",
          "verify": true
        },
        "isPublished": false,
        "isDraft": true,
        "moderatedBy": null,
        "moderatedAt": null,
        "moderationNote": "",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 500,
      "page": 1,
      "limit": 10,
      "totalPages": 50,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

---

### PATCH /products/:id/status
Cập nhật trạng thái kiểm duyệt sản phẩm

**Headers:** `Authorization: Bearer <adminAccessToken>`

**Params:** `id` (MongoDB ObjectId)

**Body:**
```json
{
  "status": "pending|approved|rejected",
  "moderationNote": "Ghi chú (tuỳ chọn)"
}
```

**Status Values:**
- `pending`: Chờ duyệt
- `approved`: Phê duyệt / công khai
- `rejected`: Từ chối

**Response:**
```json
{
  "code": 200,
  "message": "Update product status successfully!",
  "metadata": {
    "_id": "product_id",
    "title": "Product Name",
    "status": "approved",
    "isPublished": true,
    "isDraft": false,
    "moderatedBy": "admin_id",
    "moderatedAt": "2024-01-01T00:00:00.000Z",
    "moderationNote": "Sản phẩm hợp lệ"
  }
}
```

**Lỗi:**
- `400`: Invalid product ID / Invalid status
- `404`: Product not found

---

### DELETE /products/:id
Xóa sản phẩm (vi phạm/không phù hợp)

**Headers:** `Authorization: Bearer <adminAccessToken>`

**Params:** `id` (MongoDB ObjectId)

**Response:**
```json
{
  "code": 200,
  "message": "Delete product successfully!",
  "metadata": {
    "deleted": true,
    "productId": "product_id"
  }
}
```

**Lỗi:**
- `400`: Invalid product ID
- `404`: Product not found

---

## 5. Order Management (Quản Lý Đơn Hàng)

### GET /orders
Lấy danh sách đơn hàng

**Headers:** `Authorization: Bearer <adminAccessToken>`

**Query Params:**
- `page` (number, default: 1)
- `limit` (number, default: 10, max: 100)
- `status` (string): `pending`, `confirmed`, `processing`, `shipped`, `delivered`, `cancelled`

**Response:**
```json
{
  "code": 200,
  "message": "Get orders successfully!",
  "metadata": {
    "orders": [
      {
        "_id": "order_id",
        "userId": {
          "_id": "user_id",
          "name": "User Name",
          "email": "user@example.com",
          "phone": "0123456789",
          "avatar": "url",
          "status": "active",
          "roles": ["user"]
        },
        "shopId": {
          "_id": "shop_id",
          "name": "Shop Name",
          "email": "shop@example.com",
          "status": "active",
          "verify": true
        },
        "items": [
          {
            "productId": {
              "_id": "product_id",
              "title": "Product",
              "images": [],
              "price": 100000,
              "product_type": "simple",
              "status": "approved"
            },
            "productName": "Product",
            "quantity": 1,
            "price": 100000,
            "image": "url"
          }
        ],
        "status": "pending",
        "totalPrice": 100000,
        "finalPrice": 100000,
        "notes": "",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 200,
      "page": 1,
      "limit": 10,
      "totalPages": 20,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

---

### GET /orders/:id
Lấy chi tiết một đơn hàng

**Headers:** `Authorization: Bearer <adminAccessToken>`

**Params:** `id` (MongoDB ObjectId)

**Response:**
```json
{
  "code": 200,
  "message": "Get order successfully!",
  "metadata": {
    "_id": "order_id",
    "userId": { ... },
    "shopId": { ... },
    "items": [ ... ],
    "status": "pending",
    "totalPrice": 100000,
    "finalPrice": 100000,
    "notes": ""
  }
}
```

**Lỗi:**
- `400`: Invalid order ID
- `404`: Order not found

---

### PATCH /orders/:id/status
Cập nhật trạng thái đơn hàng (xử lý tranh chấp)

**Headers:** `Authorization: Bearer <adminAccessToken>`

**Params:** `id` (MongoDB ObjectId)

**Body:**
```json
{
  "status": "pending|confirmed|processing|shipped|delivered|cancelled",
  "note": "Ghi chú (tuỳ chọn)"
}
```

**Status Values:**
- `pending`: Chờ xác nhận
- `confirmed`: Đã xác nhận
- `processing`: Đang xử lý
- `shipped`: Đã gửi
- `delivered`: Đã giao
- `cancelled`: Đã hủy

**Response:**
```json
{
  "code": 200,
  "message": "Update order status successfully!",
  "metadata": {
    "_id": "order_id",
    "status": "confirmed",
    "notes": "Admin confirmed order"
  }
}
```

**Lỗi:**
- `400`: Invalid order ID / Invalid status
- `404`: Order not found

---

## 6. Analytics (Thống Kê & Phân Tích)

### GET /analytics/overview
Lấy tổng quan thống kê hệ thống

**Headers:** `Authorization: Bearer <adminAccessToken>`

**Query Params:** None

**Response:**
```json
{
  "code": 200,
  "message": "Get analytics overview successfully!",
  "metadata": {
    "overview": {
      "totalUsers": 150,
      "totalShops": 50,
      "totalOrders": 500,
      "totalRevenue": 50000000
    },
    "ordersByStatus": {
      "pending": {
        "count": 10,
        "revenue": 1000000
      },
      "confirmed": {
        "count": 20,
        "revenue": 2000000
      },
      "processing": {
        "count": 30,
        "revenue": 3000000
      },
      "shipped": {
        "count": 40,
        "revenue": 4000000
      },
      "delivered": {
        "count": 350,
        "revenue": 35000000
      },
      "cancelled": {
        "count": 10,
        "revenue": 1000000
      }
    },
    "topSellingProducts": [
      {
        "productId": "product_id",
        "productName": "Best Seller",
        "productImage": "url",
        "totalSold": 500,
        "totalRevenue": 5000000
      }
    ]
  }
}
```

---

## 7. Notifications (Thông Báo Hàng Loạt)

### POST /notifications/send-bulk
Gửi thông báo tới nhiều users

**Headers:** `Authorization: Bearer <adminAccessToken>`

**Body:**
```json
{
  "userIds": ["user_id_1", "user_id_2"],
  "title": "Tiêu đề thông báo",
  "body": "Nội dung thông báo",
  "type": "promotion|system|custom|order|promo|test",
  "data": {
    "custom_field": "value"
  }
}
```

**Required Fields:**
- `userIds` (array of MongoDB ObjectId): danh sách user nhận thông báo
- `title` (string): tiêu đề thông báo
- `body` (string): nội dung thông báo
- `type` (string): loại thông báo

**Optional Fields:**
- `data` (object): dữ liệu tùy chỉnh

**Type Values:**
- `promotion`: Thông báo khuyến mãi
- `system`: Thông báo hệ thống
- `custom`: Thông báo tùy chỉnh
- `order`: Thông báo đơn hàng
- `promo`: Thông báo quảng cáo
- `test`: Thông báo test

**Response:**
```json
{
  "code": 200,
  "message": "Send bulk notifications successfully!",
  "metadata": {
    "requestedCount": 2,
    "successCount": 2,
    "failureCount": 0,
    "notifications": [
      {
        "_id": "notification_id",
        "userId": "user_id",
        "title": "Tiêu đề",
        "body": "Nội dung",
        "type": "promotion",
        "isRead": false,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "failedRecipients": []
  }
}
```

**Lỗi:**
- `400`: userIds must be a non-empty array / title is required / body is required / invalid type

---

## Lỗi Chung (Common Errors)

### 400 Bad Request
```json
{
  "code": 400,
  "message": "Bad request error"
}
```

### 401 Unauthorized
```json
{
  "code": 401,
  "message": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "code": 403,
  "message": "Forbidden"
}
```

### 404 Not Found
```json
{
  "code": 404,
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "code": 500,
  "message": "Internal server error"
}
```

---

## Ghi Chú Phát Triển

### Authentication Middleware
- `verifyAdmin`: kiểm tra token JWT và xác minh role admin
- Token được tạo bởi `src/auth/adminAuth.js`
- Duration: theo cấu hình trong JWT

### Encoding
- Request body: JSON
- Response: JSON
- Charset: UTF-8

### Rate Limiting
- Chưa áp dụng (có thể thêm sau)

### Versioning
- API version: `v1`
- Có thể nâng cấp sang v2 trong tương lai
PATCH /v1/api/admin/shops/:shopId/verify
```

Headers: `Authorization: Bearer <adminAccessToken>`

Response metadata: shop đã được verify (verify=true, status='active')

## User Management

1) Lấy danh sách users

```
GET /v1/api/admin/users
```

Query params:
- `page`, `limit`
- `status` — filter (`active`, `inactive`)
- `keyword` — tìm theo `name` hoặc `email`

Response metadata:
- `users`: list user (fields: `_id`, `name`, `email`, `phone`, `address`, `avatar`, `status`, `roles`, ...)
- `pagination`

2) Lấy chi tiết user

```
GET /v1/api/admin/users/:userId
```

Response metadata: chi tiết user

3) Cập nhật trạng thái user (ban/unban)

```
PATCH /v1/api/admin/users/:userId/status
```

Body (JSON):
```json
{
  "status": "active|inactive"
}
```

Lưu ý:
- Không thể ban admin khác hoặc ban chính mình.

Response metadata: user đã cập nhật (kèm `isAdmin` flag)

## Product Moderation

1) Lấy danh sách sản phẩm (cho admin)

```
GET /v1/api/admin/products
```

Query params:
- `page`, `limit`
- `status` — `pending|approved|rejected|draft` (nếu `pending` bao gồm cả không có field `status`)

Response metadata:
- `products`: mảng sản phẩm (populate `categoryId`, `product_shop`)
- `pagination`

2) Cập nhật trạng thái sản phẩm (moderation)

```
PATCH /v1/api/admin/products/:id/status
```

Body (JSON):
```json
{
  "status": "approved|rejected|pending",
  "moderationNote": "(tuỳ chọn) ghi chú"
}
```

Hành vi:
- `approved` → `isPublished=true`, `isDraft=false`
- `rejected` → `isPublished=false`, `isDraft=false`
- khác → `isDraft=true`

Response metadata: product đã cập nhật

3) Xóa sản phẩm

```
DELETE /v1/api/admin/products/:id
```

Response metadata:
- `{ deleted: true, productId: "..." }`

## Order Management

1) Lấy danh sách orders

```
GET /v1/api/admin/orders
```

Query params:
- `page`, `limit`
- `status`

Response metadata:
- `orders` (populate `userId`, `shopId`, `items.productId`)
- `pagination`

2) Lấy chi tiết order

```
GET /v1/api/admin/orders/:id
```

Response metadata: chi tiết order (kèm thông tin user, shop, items)

3) Cập nhật trạng thái order

```
PATCH /v1/api/admin/orders/:id/status
```

Body (JSON):
```json
{
  "status": "(trạng thái hợp lệ theo hệ thống)",
  "note": "(tuỳ chọn) ghi chú xử lý"
}
```

Response metadata: order sau khi cập nhật

## Analytics

1) Overview

```
GET /v1/api/admin/analytics/overview
```

Response metadata:
- `overview`: `{ totalUsers, totalShops, totalOrders, totalRevenue }`
- `ordersByStatus`: object mapping trạng thái → `{ count, revenue }`
- `topSellingProducts`: mảng top 5 sản phẩm bán chạy

## Notifications (bulk)

1) Gửi thông báo hàng loạt

```
POST /v1/api/admin/notifications/send-bulk
```

Body (JSON):
```json
{
  "userIds": ["userId1", "userId2"],
  "title": "Tiêu đề",
  "body": "Nội dung",
  "type": "promotion|system|order|product|custom",
  "data": { "key": "value" } (tuỳ chọn)
}
```

Response metadata:
- `{ requestedCount, successCount, failureCount, notifications, failedRecipients }`

---

Nếu bạn muốn tôi bổ sung ví dụ curl cụ thể cho từng endpoint hoặc trích xuất chính xác các trường trong `metadata` từ model/response, tôi sẽ tiếp tục tạo phần ví dụ chi tiết hơn.
GET    /v1/api/admin/users/:userId/activity     - Activity của user
```

---

## ANALYTICS & REPORTS - (Suggested)

### Suggested Admin Analytics APIs (To be implemented)

```
GET    /v1/api/admin/analytics/overview         - Tổng quan hệ thống
GET    /v1/api/admin/analytics/sales            - Doanh số bán
GET    /v1/api/admin/analytics/orders           - Thống kê đơn hàng
GET    /v1/api/admin/analytics/users            - Thống kê users
GET    /v1/api/admin/analytics/products         - Thống kê sản phẩm
GET    /v1/api/admin/analytics/shops            - Thống kê shops
GET    /v1/api/admin/reports/revenue            - Báo cáo doanh thu
GET    /v1/api/admin/reports/refunds            - Báo cáo hoàn tiền
```

---

## 📊 Standard Response Format

### Success Response
```json
{
  "code": 200,
  "message": "Description",
  "metadata": {}
}
```

### Error Response
```json
{
  "code": 400,
  "message": "Error description",
  "metadata": {}
}
```

---

## 🔐 Admin Authentication

### Using Hardcoded Admin IDs

File: `src/auth/adminAuth.js`

```javascript
const HARDCODED_ADMIN_USER_IDS = [
    '680f91f6f01b7d2a2fa9c001',  // Admin 1
    'your_admin_id_here'          // Add more admins
];
```

### Using Environment Variable

Set in `.env`:
```
ADMIN_USER_IDS=680f91f6f01b7d2a2fa9c001,another_admin_id,third_admin_id
```

---

## 🔌 Integration Examples

### Example 1: Create Category

```bash
curl -X POST http://localhost:3000/v1/api/category \
  -H "Content-Type: application/json" \
  -H "x-client-id: 680f91f6f01b7d2a2fa9c001" \
  -d '{
    "name": "Điện tử",
    "description": "Các sản phẩm điện tử"
  }'
```

### Example 2: Send Notification

```bash
curl -X POST http://localhost:3000/v1/api/notifications/send \
  -H "Content-Type: application/json" \
  -H "x-client-id: 680f91f6f01b7d2a2fa9c001" \
  -H "authorization: {accessToken}" \
  -d '{
    "userId": "user_id_123",
    "title": "Khuyến mãi mới",
    "body": "Có khuyến mãi mới cho bạn",
    "type": "promotion"
  }'
```

### Example 3: Get All Categories

```bash
curl -X GET http://localhost:3000/v1/api/category
```

---

## ⚠️ Error Codes

| Code | Status | Description |
|------|--------|-------------|
| 200 | OK | Success |
| 201 | Created | Resource created |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | Missing auth |
| 403 | Forbidden | No permission |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Duplicate resource |
| 500 | Server Error | Internal error |

---

## 🛠️ Common Admin Tasks

### 1. Add New Admin User

1. Thêm user ID vào `HARDCODED_ADMIN_USER_IDS` trong `src/auth/adminAuth.js`
2. Hoặc set environment variable:
   ```bash
   export ADMIN_USER_IDS=680f91f6f01b7d2a2fa9c001,new_admin_id
   ```

### 2. Create Category via Seed

```bash
curl -X POST http://localhost:3000/v1/api/category/seed/default \
  -H "x-client-id: 680f91f6f01b7d2a2fa9c001"
```

### 3. Send Bulk Notifications (To be implemented)

Suggested endpoint:
```bash
POST /v1/api/admin/notifications/send-bulk
```

### 4. Export Reports (To be implemented)

Suggested endpoints:
```bash
GET /v1/api/admin/reports/export?format=csv&type=sales
GET /v1/api/admin/reports/export?format=excel&type=revenue
```

---

## 📝 Category Model

```javascript
{
  "_id": ObjectId,
  "name": String,              // Unique, required
  "slug": String,              // Auto-generated from name
  "description": String,
  "isActive": Boolean,         // Default: true
  "adminId": ObjectId,         // Admin who created it
  "createdAt": Date,
  "updatedAt": Date
}
```

---

## 🎯 Future Admin Features (Recommended)

1. **Dashboard**
   - Platform statistics
   - Revenue overview
   - Active users count
   - Top selling products
   - Recent orders

2. **Shop Management**
   - View all shops
   - Verify/block shops
   - Set commission rates
   - Monitor shop performance

3. **User Management**
   - Manage user accounts
   - Ban/unban users
   - View user history
   - Send targeted notifications

4. **Product Management**
   - Monitor all products
   - Flag inappropriate content
   - Manage reviews/ratings
   - Category associations

5. **Order Management**
   - View all orders
   - Resolve disputes
   - Track refunds
   - Monitor payment issues

6. **Financial Reports**
   - Revenue breakdown
   - Commission calculations
   - Payment history
   - Tax reports

7. **System Settings**
   - Platform fees
   - Commission rates
   - Email templates
   - Site announcements

8. **Audit Log**
   - Track admin actions
   - Monitor system changes
   - User activity log
   - Security events

---

## 📚 Notes

- Admin access is currently controlled via hardcoded user IDs or environment variables
- Most suggested APIs are placeholders for future implementation
- Current implementation focuses on category and notification management
- Recommend implementing comprehensive admin dashboard soon
- Consider role-based access control (RBAC) for granular permissions

