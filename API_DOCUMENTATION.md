# API DOCUMENTATION - Complete Reference

## 📋 Table of Contents
1. [Authentication APIs](#authentication-apis)
2. [User APIs](#user-apis)
3. [Category APIs](#category-apis)
4. [Product APIs](#product-apis)
5. [Cart APIs](#cart-apis)
6. [Order APIs](#order-apis)

---

# AUTHENTICATION APIS

## 1. Register (Sign Up)
```
POST /v1/api/access/signup
```
**Description:** Đăng ký tài khoản mới
**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```
**Response:**
```json
{
  "code": 201,
  "message": "Register successfully!",
  "metadata": {
    "user": {
      "_id": "user_id",
      "email": "user@example.com",
      "name": "John Doe",
      "roles": ["USER"]
    },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc..."
    }
  }
}
```

---

## 2. Login
```
POST /v1/api/access/login
```
**Description:** Đăng nhập với email và password
**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
**Response:**
```json
{
  "code": 200,
  "message": "Login successfully!",
  "metadata": {
    "user": {
      "_id": "user_id",
      "email": "user@example.com",
      "name": "John Doe",
      "roles": ["USER"]
    },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc..."
    }
  }
}
```

---

## 3. Refresh Token
```
POST /v1/api/access/refresh-token
```
**Description:** Làm mới access token bằng refresh token
**Headers:**
```
Authorization: Bearer <refresh_token>
```
**Response:**
```json
{
  "code": 200,
  "message": "Refresh token successfully!",
  "metadata": {
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc..."
    }
  }
}
```

---

## 4. Logout
```
POST /v1/api/access/logout
```
**Description:** Đăng xuất
**Headers:**
```
Authorization: Bearer <access_token>
```
**Response:**
```json
{
  "code": 200,
  "message": "Logout successfully!"
}
```

---

# USER APIS

## 1. Get Profile
```
GET /v1/api/user/profile
```
**Description:** Lấy thông tin hồ sơ của user hiện tại
**Headers:**
```
Authorization: Bearer <access_token>
```
**Response:**
```json
{
  "code": 200,
  "message": "Get profile successfully!",
  "metadata": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "user@example.com",
    "phone": "0123456789",
    "address": "123 Main St, City",
    "avatar": "https://example.com/avatar.jpg",
    "status": "active",
    "verify": false,
    "roles": ["USER"],
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

---

## 2. Update Profile
```
PATCH /v1/api/user/profile
```
**Description:** Cập nhật thông tin hồ sơ
**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```
**Request Body:**
```json
{
  "name": "John Doe Updated",
  "phone": "0987654321",
  "address": "456 New St, City",
  "avatar": "https://example.com/new-avatar.jpg"
}
```
**Response:**
```json
{
  "code": 200,
  "message": "Update profile successfully!",
  "metadata": {
    "_id": "user_id",
    "name": "John Doe Updated",
    "email": "user@example.com",
    "phone": "0987654321",
    "address": "456 New St, City",
    "avatar": "https://example.com/new-avatar.jpg",
    "status": "active",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

## 3. Change Password
```
PATCH /v1/api/user/password
```
**Description:** Đổi mật khẩu
**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```
**Request Body:**
```json
{
  "oldPassword": "password123",
  "newPassword": "newPassword456"
}
```
**Response:**
```json
{
  "code": 200,
  "message": "Password changed successfully!"
}
```
**Error Cases:**
- `401`: Wrong old password
- `400`: New password same as old password

---

## 4. Update FCM Token
```
PATCH /v1/api/user/fcm-token
```
**Description:** Cập nhật FCM token cho push notification
**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```
**Request Body:**
```json
{
  "fcmToken": "eFp7XXXXXXX..."
}
```
**Response:**
```json
{
  "code": 200,
  "message": "FCM token updated successfully!"
}
```

---

## 5. Remove FCM Token
```
DELETE /v1/api/user/fcm-token
```
**Description:** Xóa FCM token
**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```
**Request Body:**
```json
{
  "fcmToken": "eFp7XXXXXXX..."
}
```
**Response:**
```json
{
  "code": 200,
  "message": "FCM token removed successfully!"
}
```

---

# CATEGORY APIS

## 1. Get All Categories
```
GET /v1/api/category
```
**Description:** Lấy danh sách tất cả categories
**Query Parameters:**
- `isActive` (optional): true/false

**Response:**
```json
{
  "code": 200,
  "message": "Get all categories successfully!",
  "metadata": [
    {
      "_id": "category_id",
      "name": "Quần áo",
      "slug": "quan-ao",
      "description": "Các loại quần áo, áo sơ mi, áo khoác",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

## 2. Get Category By ID
```
GET /v1/api/category/:categoryId
```
**Description:** Lấy chi tiết category theo ID
**Response:**
```json
{
  "code": 200,
  "message": "Get category successfully!",
  "metadata": {
    "_id": "category_id",
    "name": "Quần áo",
    "slug": "quan-ao",
    "description": "Các loại quần áo",
    "isActive": true
  }
}
```

---

## 3. Create Category (Admin)
```
POST /v1/api/category
```
**Headers:**
```
Authorization: Bearer <admin_token>
```
**Request Body:**
```json
{
  "name": "Quần áo",
  "description": "Các loại quần áo"
}
```
**Response:** See Get Category By ID

---

## 4. Update Category (Admin)
```
PATCH /v1/api/category/:categoryId
```
**Headers:**
```
Authorization: Bearer <admin_token>
```
**Request Body:**
```json
{
  "name": "Quần áo nam",
  "isActive": true
}
```

---

## 5. Delete Category (Admin)
```
DELETE /v1/api/category/:categoryId
```
**Headers:**
```
Authorization: Bearer <admin_token>
```

---

# PRODUCT APIS

## 1. Get All Products
```
GET /v1/api/product
```
**Query Parameters:**
- `categoryId` (optional): Filter by category
- `minPrice` (optional): Minimum price
- `maxPrice` (optional): Maximum price
- `gender` (optional): 0=Female, 1=Male, 2=Unisex
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:**
```json
{
  "code": 200,
  "message": "Get all products successfully!",
  "metadata": [
    {
      "_id": "product_id",
      "title": "Áo sơ mi nam",
      "categoryId": "category_id",
      "price": 150000,
      "discountedPrice": 120000,
      "gender": 1,
      "images": ["url1", "url2"],
      "sizes": ["S", "M", "L"],
      "colors": [{ "title": "White", "rgb": [255, 255, 255] }],
      "variants": [
        { "_id": "variant_id", "color": "White", "size": "M", "stock": 10 }
      ],
      "salesNumber": 25,
      "product_type": "Clothing",
      "product_shop": "shop_id"
    }
  ]
}
```

---

## 2. Search Products
```
GET /v1/api/product/search?q=<keyword>
```
**Query Parameters:**
- `q` (required): Search keyword
- `categoryId` (optional): Filter by category

---

## 3. Get Product By ID
```
GET /v1/api/product/:productId
```
**Response:** Same as Get All Products

---

## 4. Create Product (Shop)
```
POST /v1/api/product
```
**Headers:**
```
Authorization: Bearer <access_token>
```
**Request Body:**
```json
{
  "title": "Áo sơ mi nam",
  "categoryId": "category_id",
  "price": 150000,
  "discountedPrice": 120000,
  "gender": 1,
  "images": ["url1"],
  "sizes": ["S", "M", "L"],
  "colors": [{ "title": "White", "rgb": [255, 255, 255] }],
  "product_type": "Clothing"
}
```

---

## 5. Update Product
```
PATCH /v1/api/product/:productId
```
**Headers:**
```
Authorization: Bearer <access_token>
```

---

## 6. Delete Product
```
DELETE /v1/api/product/:productId
```

---

# ADDRESS APIS

## 1. Get All Addresses
```
GET /v1/api/address
```
**Headers:**
```
Authorization: Bearer <access_token>
```

---

## 2. Create Address
```
POST /v1/api/address
```
**Request Body:**
```json
{
  "receiverName": "John Doe",
  "receiverPhone": "0123456789",
  "address": "123 Main St, City",
  "isDefault": false
}
```

---

## 3. Update Address
```
PATCH /v1/api/address/:addressId
```

---

## 4. Delete Address
```
DELETE /v1/api/address/:addressId
```

---

# CART APIS

## 1. Add to Cart
```
POST /v1/api/cart/add
```
**Headers:**
```
Authorization: Bearer <access_token>
```
**Request Body:**
```json
{
  "productId": "product_id",
  "variantId": "variant_id",
  "quantity": 2
}
```

---

## 2. Get Cart
```
GET /v1/api/cart
```

---

## 3. Update Cart Item
```
POST /v1/api/cart/update
```
**Request Body:**
```json
{
  "productId": "product_id",
  "variantId": "variant_id",
  "quantity": 3
}
```

---

## 4. Remove from Cart
```
DELETE /v1/api/cart
```
**Request Body:**
```json
{
  "productId": "product_id",
  "variantId": "variant_id"
}
```

---

# ORDER APIS

## 1. Create Order (Cart Checkout)
```
POST /v1/api/order/orders
```
**Headers:**
```
Authorization: Bearer <access_token>
```
**Request Body:**
```json
{
  "type": "cart",
  "addressId": "address_id"
}
```

---

## 2. Create Order (Buy Now)
```
POST /v1/api/order/orders
```
**Request Body:**
```json
{
  "type": "buy_now",
  "addressId": "address_id",
  "productId": "product_id",
  "variantId": "variant_id",
  "quantity": 1
}
```

---

## 3. Get All Orders
```
GET /v1/api/order/orders
```

---

## 4. Get Order By ID
```
GET /v1/api/order/orders/:orderId
```

---

## 5. Cancel Order
```
PATCH /v1/api/order/orders/:orderId/cancel
```

---

# DISCOUNT APIS

## 1. Get Discount Codes
```
GET /v1/api/discount
```

---

## 2. Apply Discount
```
POST /v1/api/discount/apply
```
**Request Body:**
```json
{
  "code": "DISCOUNT10"
}
```

---

## 2. Mark Notification as Read
```
PATCH /v1/api/notification/:notificationId
```

---

# COMMON RESPONSE FORMATS

## Success Response
```json
{
  "code": 200,
  "message": "Operation successfully!",
  "metadata": {
    // Response data here
  }
}
```

## Error Response
```json
{
  "code": 400,
  "message": "Error message",
  "status": "error"
}
```

---

# ERROR CODES

| Code | Message | Meaning |
|------|---------|---------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request body/parameters |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Access denied (insufficient permissions) |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists |
| 422 | Unprocessable Entity | Validation error |
| 500 | Internal Server Error | Server error |

---

# AUTHENTICATION

All protected endpoints require:
```
Authorization: Bearer <access_token>
```

Get access token from Login response.

---

# VARIANT SYSTEM

Products support variants with auto-generated combinations:
- Each (color × size) combination = unique variant
- Stock managed at variant level
- Cart and Order use `variantId` (ObjectId reference to `Product.variants._id`)

Example variant:
```json
{
  "_id": "variant_id",
  "color": "Black",
  "size": "M",
  "stock": 15
}
```

---

# SHOP APIs (Summary)

- `GET /v1/api/shop/profile` - Get shop profile
- `PATCH /v1/api/shop/profile` - Update shop profile
- `GET /v1/api/shop/products` - Get shop products
- `GET /v1/api/shop/orders` - Get shop orders
- `GET /v1/api/shop/stats` - Get shop statistics

---

# ADMIN APIs (Summary)

- `GET /v1/api/admin/users` - Get all users
- `GET /v1/api/admin/products` - Get all products
- `GET /v1/api/admin/orders` - Get all orders
- `GET /v1/api/admin/shops` - Get all shops
- `POST /v1/api/admin/products/:id/approve` - Approve product
- `POST /v1/api/admin/products/:id/reject` - Reject product
- `PATCH /v1/api/admin/users/:id/status` - Update user status
- `GET /v1/api/admin/analytics` - Get system analytics
- `GET /v1/api/admin/notifications` - Send notifications to users

---

# INTEGRATION FLOW

## 1. User Registration & Login
1. POST `/v1/api/access/signup` - Register
2. POST `/v1/api/access/login` - Login
3. Get `accessToken` and `refreshToken`

## 2. Browse Products
1. GET `/v1/api/category` - Get categories
2. GET `/v1/api/product` - Get products (filter by category)
3. GET `/v1/api/product/:id` - Get product details with variants

## 3. Shopping
1. User selects color + size → get `variantId` from variants
2. POST `/v1/api/cart/add` - Add to cart with variantId
3. POST `/v1/api/cart/update` - Update quantity
4. DELETE `/v1/api/cart` - Remove item

## 4. Checkout
1. POST `/v1/api/address` - Create delivery address (if needed)
2. GET `/v1/api/discount/apply` - Apply discount code (optional)
3. POST `/v1/api/order/orders` - Create order (cart mode)
4. Stock deducted automatically at variant level

## 5. Track Order
1. GET `/v1/api/order/orders` - List orders
2. GET `/v1/api/order/orders/:id` - Get order details
3. PATCH `/v1/api/notification` - Get order updates

---

# USAGE EXAMPLES

## Example 1: Register and Login
```bash
# Sign up
curl -X POST http://localhost:3000/v1/api/access/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }'

# Login
curl -X POST http://localhost:3000/v1/api/access/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

## Example 2: Get Products by Category
```bash
# Get all categories
curl http://localhost:3000/v1/api/category

# Get products by category
curl "http://localhost:3000/v1/api/product?categoryId=<category_id>&limit=10"

# Search products
curl "http://localhost:3000/v1/api/product/search?q=shirt"
```

## Example 3: Add to Cart and Checkout
```bash
# Get product with variants
curl http://localhost:3000/v1/api/product/<product_id> \
  -H "Authorization: Bearer <access_token>"

# Add to cart
curl -X POST http://localhost:3000/v1/api/cart/add \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "<product_id>",
    "variantId": "<variant_id>",
    "quantity": 2
  }'

# Create order
curl -X POST http://localhost:3000/v1/api/order/orders \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "cart",
    "addressId": "<address_id>"
  }'
```

## Example 4: Update Profile
```bash
curl -X PATCH http://localhost:3000/v1/api/user/profile \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "phone": "0987654321",
    "address": "456 New St, City"
  }'
```

---

# BASE URL

```
http://localhost:3000
```

or

```
https://api.example.com
```

---

**Last Updated:** May 5, 2024
**Version:** 1.0.0
