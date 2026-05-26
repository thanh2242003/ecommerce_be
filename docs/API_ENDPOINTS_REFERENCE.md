# 🔌 API Endpoints Reference Guide

## Phần 1: Authentication & Access (Xác Thực)

### 1.1 User Registration

```http
POST /v1/api/user/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "hashed_password",
  "name": "John Doe",
  "phone": "0123456789"
}

Response: 201 Created
{
  "code": 201,
  "message": "User created successfully",
  "metadata": {
    "user": {
      "_id": "user_id",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "tokens": {
      "accessToken": "jwt_token",
      "refreshToken": "refresh_token"
    }
  }
}
```

### 1.2 User Login

```http
POST /v1/api/user/signin
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}

Response: 200 OK
{
  "code": 200,
  "message": "Login successful",
  "metadata": {
    "user": { /* user object */ },
    "tokens": { /* tokens */ }
  }
}
```

### 1.3 Shop Registration

```http
POST /v1/api/shop/signup
Content-Type: application/json

{
  "email": "shop@example.com",
  "password": "password",
  "name": "My Shop"
}

Response: 201 Created
```

### 1.4 Shop Login

```http
POST /v1/api/shop/signin
Content-Type: application/json

{
  "email": "shop@example.com",
  "password": "password"
}

Response: 200 OK
```

### 1.5 Admin Login

```http
POST /v1/api/admin/auth/login
Content-Type: application/json

{
  "account": "admin_username",
  "password": "admin_password"
}

Response: 200 OK
```

### 1.6 Logout

```http
POST /v1/api/logout
Authorization: Bearer {accessToken}

Response: 200 OK
{
  "code": 200,
  "message": "Logout successful"
}
```

### 1.7 Refresh Token

```http
POST /v1/api/handlerRefreshToken
Content-Type: application/json

{
  "refreshToken": "refresh_token"
}

Response: 200 OK
{
  "code": 200,
  "metadata": {
    "tokens": {
      "accessToken": "new_access_token",
      "refreshToken": "new_refresh_token"
    }
  }
}
```

### 1.8 Get User Profile

```http
GET /v1/api/user/profile
Authorization: Bearer {userAccessToken}

Response: 200 OK
{
  "code": 200,
  "message": "Get profile successfully!",
  "metadata": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "user@example.com",
    "phone": "0123456789",
    "address": "123 Main Street",
    "avatar": "https://example.com/avatar.jpg",
    "status": "active",
    "roles": ["user"],
    "verify": true
  }
}
```

**Mục đích:** lấy thông tin profile hiện tại của user đang đăng nhập.

**Yêu cầu xác thực:**
- Bắt buộc có `Authorization: Bearer {userAccessToken}`.
- Route đang nằm dưới middleware `authenticationV2`.

**Dữ liệu trả về hiện tại trong code:**
- `name`
- `email`
- `phone`
- `address`
- `avatar`
- `status`
- `roles`
- `verify`

### 1.9 Update User Profile

```http
PATCH /v1/api/user/profile
Authorization: Bearer {userAccessToken}
Content-Type: application/json

{
  "name": "John Updated",
  "phone": "0987654321",
  "address": "456 New Street",
  "avatar": "https://example.com/new-avatar.jpg"
}

Response: 200 OK
{
  "code": 200,
  "message": "Update profile successfully!",
  "metadata": {
    "_id": "user_id",
    "name": "John Updated",
    "email": "user@example.com",
    "phone": "0987654321",
    "address": "456 New Street",
    "avatar": "https://example.com/new-avatar.jpg",
    "status": "active",
    "roles": ["user"],
    "verify": true
  }
}
```

**Mục đích:** cập nhật các thông tin profile cơ bản của user.

**Trường có thể cập nhật:**
- `name`
- `phone`
- `address`
- `avatar`

**Hành vi hiện tại trong code:**
- Chỉ cập nhật các field được gửi lên trong body.
- Nếu một field không truyền lên, giá trị cũ được giữ nguyên.
- API trả về user sau khi cập nhật thành công.

---

## Phần 2: Product Management (Quản Lý Sản Phẩm)

### 2.1 Get All Products (Public)

```http
GET /v1/api/product?categoryId=123&price[gte]=100&price[lte]=500&gender=1&page=1&limit=20
```


**Mục đích:** lấy danh sách sản phẩm công khai và lọc theo `categoryId`, khoảng giá, giới tính và phân trang.

**Query params:**
- `categoryId`: lọc theo danh mục sản phẩm.
- `minPrice`: giá tối thiểu.
- `maxPrice`: giá tối đa.
- `gender`: lọc theo giới tính.
- `sort`: trường sắp xếp, mặc định là `createdAt`.
- `page`: trang hiện tại, mặc định `1`.
- `limit`: số lượng bản ghi mỗi trang, mặc định `10`.

**Ví dụ:**
```http
GET /v1/api/product?categoryId=66f1b2c9e12a4a0012345678&minPrice=100000&maxPrice=500000&gender=1&page=1&limit=20
```

**Hành vi hiện tại trong code:**
- Nếu có `categoryId`, hệ thống thêm điều kiện `query.categoryId = categoryId`.
- Nếu không truyền `categoryId`, API vẫn trả sản phẩm công khai theo mặc định `isPublished = true` và `status = approved`.
- Nếu truyền thêm `minPrice` hoặc `maxPrice`, hệ thống lọc theo khoảng giá tương ứng.

**Response: 200 OK**
```json
{
  "code": 200,
  "metadata": {
    "products": [
      {
        "_id": "product_id",
        "title": "T-Shirt",
        "slug": "t-shirt",
        "price": 250000,
        "images": ["url1", "url2"],
        "sizes": ["S", "M", "L"],
        "colors": [
          { "title": "Red", "rgb": [255, 0, 0] }
        ],
        "variants": [
          { "color": "Red", "size": "S", "stock": 10 }
        ],
        "reviews": [/* reviews array */],
        "status": "approved",
        "isPublished": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100
    }
  }
}
```

### 2.2 Get Product Detail

```http
GET /v1/api/product/{productId}

Response: 200 OK
{
  "code": 200,
  "metadata": {
    "product": {
      /* Full product object with reviews */
    }
  }
}
```

### 2.3 Search Products

```http
GET /v1/api/product/search?q=t-shirt&categoryId=123
```

**Mục đích:** tìm kiếm sản phẩm theo từ khóa và có thể kết hợp lọc theo danh mục.

**Query params:**
- `q`: từ khóa tìm kiếm trong `title`.
- `categoryId`: danh mục cần lọc thêm.

**Ví dụ kết hợp search + category:**
```http
GET /v1/api/product/search?q=shirt&categoryId=66f1b2c9e12a4a0012345678
```

**Hành vi hiện tại trong code:**
- API chỉ tìm trong các sản phẩm `isPublished = true` và `status = approved`.
- Nếu truyền `q`, hệ thống match theo regex không phân biệt hoa/thường trên trường `title`.
- Nếu truyền `categoryId`, hệ thống lọc thêm theo `categoryId`.
- Search route đang dùng `optionalAuth`, nên nếu người dùng đã đăng nhập thì keyword có thể được lưu vào search history.

### 2.4 Get Top Selling Products

```http
GET /v1/api/product/top-selling?limit=10

Response: 200 OK
{
  "code": 200,
  "metadata": {
    "products": [/* top selling products */]
  }
}
```

### 2.5 Get Suggested Products

```http
GET /v1/api/product/suggested/{userId}

Response: 200 OK
{
  "code": 200,
  "metadata": {
    "products": [/* based on search history */]
  }
}
```

### 2.6 Create Product (Shop)

```http
POST /v1/api/product
Authorization: Bearer {shopAccessToken}
Content-Type: multipart/form-data

{
  "title": "New T-Shirt",
  "categoryId": "category_id",
  "price": 250000,
  "gender": 1,
  "description": "Premium quality t-shirt",
  "sizes": ["S", "M", "L", "XL"],
  "colors": [
    { "title": "Red", "rgb": [255, 0, 0] },
    { "title": "Blue", "rgb": [0, 0, 255] }
  ],
  "variants": [
    { "color": "Red", "size": "S", "stock": 10 },
    { "color": "Red", "size": "M", "stock": 15 }
  ],
  "images": [/* file uploads */]
}

Response: 201 Created
{
  "code": 201,
  "metadata": {
    "product": {
      "_id": "new_product_id",
      "status": "pending",
      "isDraft": true,
      "isPublished": false
    }
  }
}
```

### 2.7 Update Product (Shop)

```http
PATCH /v1/api/product/{productId}
Authorization: Bearer {shopAccessToken}
Content-Type: multipart/form-data

{
  "title": "Updated Title",
  "price": 300000,
  /* updated fields */
}

Response: 200 OK
```

### 2.8 Publish Product (Shop)

```http
PATCH /v1/api/product/{productId}/publish
Authorization: Bearer {shopAccessToken}

Response: 200 OK
{
  "code": 200,
  "metadata": {
    "product": {
      "isPublished": true,
      "status": "pending"  // Awaiting admin approval
    }
  }
}
```

### 2.9 Delete Product (Shop)

```http
DELETE /v1/api/product/{productId}
Authorization: Bearer {shopAccessToken}

Response: 200 OK
```

---

## Phần 3: Cart Management (Quản Lý Giỏ Hàng)

### 3.1 Add to Cart

```http
POST /v1/api/cart/add
Authorization: Bearer {userAccessToken}
Content-Type: application/json

{
  "productId": "product_id",
  "variantId": "variant_id",
  "quantity": 2,
  "price": 250000
}

Response: 201 Created
{
  "code": 201,
  "metadata": {
    "cart": {
      "_id": "cart_id",
      "items": [
        {
          "product": "product_id",
          "variantId": "variant_id",
          "quantity": 2,
          "price": 250000
        }
      ],
      "totalPrice": 500000
    }
  }
}
```

### 3.2 Get Cart

```http
GET /v1/api/cart
Authorization: Bearer {userAccessToken}

Response: 200 OK
{
  "code": 200,
  "metadata": {
    "cart": { /* cart object */ }
  }
}
```

### 3.3 Update Cart Item

```http
POST /v1/api/cart/update
Authorization: Bearer {userAccessToken}
Content-Type: application/json

{
  "productId": "product_id",
  "variantId": "variant_id",
  "quantity": 3
}

Response: 200 OK
```

### 3.4 Delete Cart Item

```http
DELETE /v1/api/cart?productId=product_id&variantId=variant_id
Authorization: Bearer {userAccessToken}

Response: 200 OK
```

---

## Phần 4: Order Management (Quản Lý Đơn Hàng)

### 4.1 Create Order (User)

```http
POST /v1/api/order/orders
Authorization: Bearer {userAccessToken}
Content-Type: application/json

{
  "items": [
    {
      "productId": "product_id",
      "variantId": "variant_id",
      "quantity": 2
    }
  ],
  "address": "123 Main St, City",
  "receiverName": "John Doe",
  "receiverPhone": "0123456789",
  "paymentMethod": "cod",
  "discountCode": "SAVE20"
}

Response: 201 Created
{
  "code": 201,
  "metadata": {
    "order": {
      "_id": "order_id",
      "userId": "user_id",
      "shopId": "shop_id",
      "status": "pending",
      "totalPrice": 500000,
      "discountAmount": 100000,
      "finalPrice": 400000,
      "createdAt": "2026-05-18T10:00:00Z"
    }
  }
}
```

### 4.2 Get User Orders

```http
GET /v1/api/order/orders?page=1&limit=10&status=pending
Authorization: Bearer {userAccessToken}

Response: 200 OK
{
  "code": 200,
  "metadata": {
    "orders": [/* user orders */],
    "pagination": { /* pagination */ }
  }
}
```

### 4.3 Get Order Detail (User)

```http
GET /v1/api/order/orders/{orderId}
Authorization: Bearer {userAccessToken}

Response: 200 OK
{
  "code": 200,
  "metadata": {
    "order": { /* full order object */ }
  }
}
```

### 4.4 Cancel Order (User)

```http
PATCH /v1/api/order/orders/{orderId}/cancel
Authorization: Bearer {userAccessToken}
Content-Type: application/json

{
  "cancelReason": "Changed my mind"
}

Response: 200 OK
{
  "code": 200,
  "metadata": {
    "order": {
      "status": "cancelled",
      "cancelReason": "Changed my mind",
      "cancelledAt": "2026-05-18T10:30:00Z",
      "cancelledBy": "user"
    }
  }
}
```

### 4.5 Get Shop Orders

```http
GET /v1/api/shop/orders?page=1&limit=20&status=pending
Authorization: Bearer {shopAccessToken}

Response: 200 OK
{
  "code": 200,
  "metadata": {
    "orders": [/* shop orders */]
  }
}
```

### 4.6 Get Order Detail (Shop)

```http
GET /v1/api/shop/orders/{orderId}
Authorization: Bearer {shopAccessToken}

Response: 200 OK
```

### 4.7 Update Order Status (Shop)

```http
PATCH /v1/api/shop/orders/{orderId}/status
Authorization: Bearer {shopAccessToken}
Content-Type: application/json

{
  "status": "confirmed"  // pending -> confirmed -> processing -> shipped -> delivered
}

Response: 200 OK
{
  "code": 200,
  "metadata": {
    "order": {
      "status": "confirmed",
      "updatedAt": "2026-05-18T10:30:00Z"
    }
  }
}
```

---

## Phần 5: Discount & Promotions (Khuyến Mãi)

### 5.1 Create Discount Code (Shop)

```http
POST /v1/api/discount
Authorization: Bearer {shopAccessToken}
Content-Type: application/json

{
  "code": "SAVE20",
  "description": "Save 20% on all products",
  "type": "percentage",
  "value": 20,
  "startDate": "2026-05-18T00:00:00Z",
  "expiryDate": "2026-06-18T23:59:59Z",
  "maxUses": 100,
  "maxUsesPerUser": 1,
  "minOrderValue": 100000,
  "appliesTo": "all"
}

Response: 201 Created
{
  "code": 201,
  "metadata": {
    "discount": {
      "_id": "discount_id",
      "code": "SAVE20",
      "status": "active"
    }
  }
}
```

### 5.2 Validate Discount Code

```http
POST /v1/api/discount/validate
Content-Type: application/json

{
  "code": "SAVE20",
  "orderValue": 500000
}

Response: 200 OK
{
  "code": 200,
  "metadata": {
    "discount": {
      "valid": true,
      "type": "percentage",
      "value": 20,
      "discountAmount": 100000
    }
  }
}
```

---

## Phần 6: Reviews & Ratings (Đánh Giá)

### 6.1 Add Review

```http
POST /v1/api/product/{productId}/reviews
Authorization: Bearer {userAccessToken}
Content-Type: application/json

{
  "rating": 5,
  "content": "Great product! Very satisfied with the quality.",
  "orderId": "order_id"
}

Response: 201 Created
{
  "code": 201,
  "metadata": {
    "review": {
      "_id": "review_id",
      "userId": "user_id",
      "userName": "John Doe",
      "rating": 5,
      "content": "Great product!",
      "createdAt": "2026-05-18T10:00:00Z"
    }
  }
}
```

### 6.2 Get Reviews

```http
GET /v1/api/product/{productId}/reviews?page=1&limit=10

Response: 200 OK
{
  "code": 200,
  "metadata": {
    "reviews": [/* all reviews */],
    "averageRating": 4.5,
    "totalReviews": 120
  }
}
```

### 6.3 Update Review

```http
PATCH /v1/api/product/{productId}/reviews/{reviewId}
Authorization: Bearer {userAccessToken}
Content-Type: application/json

{
  "rating": 4,
  "content": "Updated review content"
}

Response: 200 OK
```

### 6.4 Delete Review

```http
DELETE /v1/api/product/{productId}/reviews/{reviewId}
Authorization: Bearer {userAccessToken}

Response: 200 OK
```

### 6.5 Shop Reply to Review

```http
POST /v1/api/product/{productId}/reviews/{reviewId}/reply
Authorization: Bearer {shopAccessToken}
Content-Type: application/json

{
  "content": "Thank you for your feedback! We appreciate your business."
}

Response: 201 Created
{
  "code": 201,
  "metadata": {
    "review": {
      "shopResponse": {
        "shopId": "shop_id",
        "content": "Thank you...",
        "respondedAt": "2026-05-18T10:00:00Z"
      }
    }
  }
}
```

---

## Phần 7: Address Management (Quản Lý Địa Chỉ)

### 7.1 Add Address

```http
POST /v1/api/address
Authorization: Bearer {userAccessToken}
Content-Type: application/json

{
  "receiverName": "John Doe",
  "receiverPhone": "0123456789",
  "address": "123 Main Street, District 1, Ho Chi Minh City",
  "isDefault": true
}

Response: 201 Created
{
  "code": 201,
  "metadata": {
    "address": {
      "_id": "address_id",
      "userId": "user_id",
      "receiverName": "John Doe",
      "isDefault": true
    }
  }
}
```

### 7.2 Get User Addresses

```http
GET /v1/api/address
Authorization: Bearer {userAccessToken}

Response: 200 OK
{
  "code": 200,
  "metadata": {
    "addresses": [/* user addresses */]
  }
}
```

### 7.3 Update Address

```http
PATCH /v1/api/address/{addressId}
Authorization: Bearer {userAccessToken}
Content-Type: application/json

{
  "address": "456 New Street",
  "isDefault": false
}

Response: 200 OK
```

### 7.4 Delete Address

```http
DELETE /v1/api/address/{addressId}
Authorization: Bearer {userAccessToken}

Response: 200 OK
```

---

## Phần 8: Admin Management (Quản Trị)

### 8.1 Get All Products (Admin)

```http
GET /v1/api/admin/products?status=pending&page=1&limit=20
Authorization: Bearer {adminAccessToken}

Response: 200 OK
{
  "code": 200,
  "metadata": {
    "products": [/* pending products */]
  }
}
```

### 8.2 Approve/Reject Product

```http
PATCH /v1/api/admin/products/{productId}/status
Authorization: Bearer {adminAccessToken}
Content-Type: application/json

{
  "status": "approved",
  "moderationNote": "Product meets all requirements"
}

Response: 200 OK
{
  "code": 200,
  "metadata": {
    "product": {
      "status": "approved",
      "moderatedBy": "admin_id",
      "moderatedAt": "2026-05-18T10:00:00Z"
    }
  }
}
```

### 8.3 Get All Shops

```http
GET /v1/api/admin/shops?page=1&limit=20
Authorization: Bearer {adminAccessToken}

Response: 200 OK
```

### 8.4 Verify Shop

```http
PATCH /v1/api/admin/shops/{shopId}/verify
Authorization: Bearer {adminAccessToken}
Content-Type: application/json

{
  "verify": true
}

Response: 200 OK
```

### 8.5 Update Shop Status

```http
PATCH /v1/api/admin/shops/{shopId}/status
Authorization: Bearer {adminAccessToken}
Content-Type: application/json

{
  "status": "blocked",
  "blockedReason": "Violation of terms"
}

Response: 200 OK
```

### 8.6 View Analytics

```http
GET /v1/api/admin/analytics/overview?dateRange=month
Authorization: Bearer {adminAccessToken}

Response: 200 OK
{
  "code": 200,
  "metadata": {
    "analytics": {
      "totalUsers": 1000,
      "totalShops": 50,
      "totalOrders": 5000,
      "totalRevenue": 1000000000,
      "topProducts": [/* top 10 */],
      "topShops": [/* top 10 */]
    }
  }
}
```

### 8.7 Send Bulk Notifications

```http
POST /v1/api/admin/notifications/send-bulk
Authorization: Bearer {adminAccessToken}
Content-Type: application/json

{
  "title": "New Feature Alert",
  "body": "Check out our new recommendation system!",
  "type": "promotion",
  "targetAudience": "all",  // all, users, shops
  "data": {
    "deeplink": "/app/recommendations"
  }
}

Response: 200 OK
{
  "code": 200,
  "metadata": {
    "sentTo": 10000,
    "timestamp": "2026-05-18T10:00:00Z"
  }
}
```

---

## Phần 9: Notifications (Thông Báo)

### 9.1 Get Notifications

```http
GET /v1/api/notification?page=1&limit=20&isRead=false
Authorization: Bearer {userAccessToken}

Response: 200 OK
{
  "code": 200,
  "metadata": {
    "notifications": [
      {
        "_id": "notif_id",
        "title": "Order Confirmed",
        "body": "Your order #123 has been confirmed",
        "type": "order",
        "isRead": false,
        "data": { "orderId": "123" },
        "createdAt": "2026-05-18T10:00:00Z"
      }
    ]
  }
}
```

### 9.2 Mark as Read

```http
PATCH /v1/api/notification/{notificationId}
Authorization: Bearer {userAccessToken}
Content-Type: application/json

{
  "isRead": true
}

Response: 200 OK
```

---

## Phần 10: Shop Dashboard

### 10.1 Get Shop Dashboard

```http
GET /v1/api/shop/dashboard
Authorization: Bearer {shopAccessToken}

Response: 200 OK
{
  "code": 200,
  "metadata": {
    "dashboard": {
      "stats": {
        "totalOrders": 250,
        "totalRevenue": 50000000,
        "totalProducts": 50,
        "lowStockItems": 5
      },
      "recentOrders": [/* last 10 orders */],
      "topProducts": [/* top 5 */],
      "averageRating": 4.5,
      "pendingOrders": 10
    }
  }
}
```

### 10.2 Get Shop Status

```http
GET /v1/api/shop/status
Authorization: Bearer {shopAccessToken}

Response: 200 OK
{
  "code": 200,
  "metadata": {
    "shop": {
      "_id": "shop_id",
      "name": "My Shop",
      "status": "active",
      "verify": true,
      "verifiedAt": "2026-05-01T10:00:00Z"
    }
  }
}
```

---

## Phần 11: Category Management

### 11.1 Get All Categories

```http
GET /v1/api/category

Response: 200 OK
{
  "code": 200,
  "metadata": {
    "categories": [
      {
        "_id": "cat_id",
        "name": "T-Shirts",
        "slug": "t-shirts",
        "description": "All kinds of t-shirts",
        "isActive": true
      }
    ]
  }
}
```

### 11.2 Get Category Detail

```http
GET /v1/api/category/{categoryId}

Response: 200 OK
```

---

## 📝 Common Response Format

### Success Response (2xx)

```json
{
  "code": 200,
  "message": "Operation description",
  "metadata": {
    /* response data */
  }
}
```

### Error Response (4xx, 5xx)

```json
{
  "code": 400,
  "message": "Error description",
  "status": "ERROR",
  "metadata": null
}
```

---

## 🔐 Authentication Headers

Tất cả protected routes yêu cầu:

```
Authorization: Bearer {accessToken}
x-client-id: {userId or shopId}
```

---

## 📋 Pagination

Query parameters cho pagination:

```
?page=1&limit=20&sort=createdAt&order=desc
```

Response includes:

```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

---

**Cập Nhật Lần Cuối:** 18 Tháng 5, 2026
**Phiên Bản:** 1.0.0
