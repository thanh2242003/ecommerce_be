# SHOP APIs - Tài Liệu Chi Tiết (v2.0)

Cập nhật: 2026-05-07

## Mục Lục
1. [Tổng Quan](#tổng-quan)
2. [Authentication](#authentication)
3. [Public Endpoints](#public-endpoints)
4. [Protected Endpoints](#protected-endpoints)
5. [Product Management](#product-management)
6. [Order Management](#order-management)
7. [Error Handling](#error-handling)

---

## Tổng Quan

**Base URL:** `http://192.168.50.218:3000/v1/api`

**Shop Routes Base:** `/shop`

Shop module cung cấp APIs cho cửa hàng quản lý:
- ✅ Đăng ký / Đăng nhập
- ✅ Quản lý sản phẩm (tạo, sửa, xóa, publish, soft delete)
- ✅ Xem danh sách đơn hàng
- ✅ Cập nhật trạng thái đơn hàng
- ✅ Xem dashboard thống kê
- ✅ Kiểm tra trạng thái tài khoản

---

## Authentication

### Schema Token

**Access Token Payload:**
```json
{
  "userId": "69bad18e38830c44e8185c0b",
  "email": "shoptest@gmail.com",
  "iat": 1778005052,
  "exp": 1778177852
}
```

### Header Requirements

**Public Endpoints (không cần auth):**
```
Không cần header đặc biệt
```

**Protected Endpoints (cần auth):**
```
Headers:
  x-client-id: <userId của shop>
  authorization: <accessToken>
```

**Ví dụ cURL:**
```bash
curl -X GET "http://192.168.50.218:3000/v1/api/shop/orders" \
  -H "x-client-id: 69bad18e38830c44e8185c0b" \
  -H "authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Ví dụ JavaScript/Fetch:**
```javascript
const headers = {
  'x-client-id': '69bad18e38830c44e8185c0b',
  'authorization': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  'Content-Type': 'application/json'
};

fetch('http://192.168.50.218:3000/v1/api/shop/orders', {
  method: 'GET',
  headers: headers
})
```

---

## Public Endpoints

### 1. POST /shop/signup - Đăng Ký Shop

**Mô tả:** Tạo tài khoản shop mới

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Áo Thời Trang Plus",
  "email": "ao.thoi.trang@gmail.com",
  "password": "SecurePassword123!"
}
```

**Response (201 Created):**
```json
{
  "code": 201,
  "message": "Created",
  "metadata": {
    "shop": {
      "_id": "69bad18e38830c44e8185c0b",
      "name": "Áo Thời Trang Plus",
      "email": "ao.thoi.trang@gmail.com"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OWJhZDE4ZTM4ODMwYzQ0ZTgxODVjMGIiLCJlbWFpbCI6ImFvLnRob2kuXHRyYW5nQGdtYWlsLmNvbSIsImlhdCI6MTc3ODAwNTA1MiwiZXhwIjoxNzc4MTc3ODUyfQ.HICHTi6JcnDwji9oWEbyHSOc69C1fjnF7kltsqvk1iQ",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OWJhZDE4ZTM4ODMwYzQ0ZTgxODVjMGIiLCJlbWFpbCI6ImFvLnRob2kuXHRyYW5nQGdtYWlsLmNvbSIsImlhdCI6MTc3ODAwNTA1MiwiZXhwIjoxNzc4MTc3ODUyfQ.HICHTi6JcnDwji9oWEbyHSOc69C1fjnF7kltsqvk1iQ"
    }
  }
}
```

**Error Response (409 Conflict):**
```json
{
  "code": 409,
  "message": "Error: Shop already registered"
}
```

---

### 2. POST /shop/signin - Đăng Nhập Shop

**Mô tả:** Đăng nhập và lấy access/refresh token

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "shoptest@gmail.com",
  "password": "SecurePassword123!"
}
```

**Response (200 OK):**
```json
{
  "code": 200,
  "message": "OK",
  "metadata": {
    "shop": {
      "_id": "69bad18e38830c44e8185c0b",
      "name": "Shop Test",
      "email": "shoptest@gmail.com"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OWJhZDE4ZTM4ODMwYzQ0ZTgxODVjMGIiLCJlbWFpbCI6InNob3B0ZXN0QGdtYWlsLmNvbSIsImlhdCI6MTc3ODAwNTA1MiwiZXhwIjoxNzc4MTc3ODUyfQ.HICHTi6JcnDwji9oWEbyHSOc69C1fjnF7kltsqvk1iQ",
      "refreshToken": "..."
    }
  }
}
```

**Error Response (403 Forbidden) - Shop chưa được duyệt:**
```json
{
  "code": 403,
  "message": "Shop account is pending verification by admin. Please wait or contact support."
}
```

---

## Protected Endpoints

> **Yêu cầu:** Tất cả endpoint sau cần header `x-client-id` + `authorization` (shop token)

### 3. GET /shop/status - Kiểm Tra Trạng Thái Shop

**Mô tả:** Lấy thông tin trạng thái tài khoản shop

**Headers:**
```
x-client-id: 69bad18e38830c44e8185c0b
authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request:** 
- Không có body

**Response (200 OK):**
```json
{
  "code": 200,
  "message": "OK",
  "metadata": {
    "_id": "69bad18e38830c44e8185c0b",
    "name": "Shop Test",
    "email": "shoptest@gmail.com",
    "status": "active",
    "isActive": true,
    "isBlocked": false,
    "isPending": false,
    "verify": true,
    "verifiedAt": "2026-04-15T10:30:00.000Z",
    "createdAt": "2026-04-01T08:00:00.000Z"
  }
}
```

---

### 4. GET /shop/dashboard - Xem Dashboard

**Mô tả:** Lấy dữ liệu tổng hợp dashboard (thống kê đơn, doanh thu, sản phẩm)

**Headers:**
```
x-client-id: 69bad18e38830c44e8185c0b
authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request:** 
- Không có body

**Response (200 OK):**
```json
{
  "code": 200,
  "message": "OK",
  "metadata": {
    "totalOrders": 156,
    "totalRevenue": 45670000,
    "pendingCount": 12,
    "confirmedCount": 45,
    "processingCount": 30,
    "shippedCount": 55,
    "deliveredCount": 14,
    "cancelledCount": 0,
    "totalProducts": 42,
    "publishedProducts": 38,
    "draftProducts": 4,
    "lowStockProducts": 5
  }
}
```

---

## Product Management

> **Yêu cầu Auth:** Tất cả endpoint product cần `shopAuthenticationV2`

### 5. POST /product - Tạo Sản Phẩm

**Mô tả:** Tạo sản phẩm mới (shop chỉ có thể tạo sản phẩm của chính mình)

**Headers:**
```
x-client-id: 69bad18e38830c44e8185c0b
authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Áo Polo Nam Xanh Đen",
  "description": "Áo polo cao cấp, thoáng mát, phù hợp công sở",
  "price": 250000,
  "discountedPrice": 199000,
  "categoryId": "5f7c1c8c9d4e2a1b3c5d6e7f",
  "gender": 1,
  "images": [
    "https://example.com/polo-blue.jpg",
    "https://example.com/polo-blue-back.jpg"
  ],
  "sizes": ["S", "M", "L", "XL", "XXL"],
  "colors": [
    {
      "title": "Xanh",
      "rgb": [0, 100, 200]
    },
    {
      "title": "Đen",
      "rgb": [0, 0, 0]
    }
  ],
  "variants": [
    {
      "color": "Xanh",
      "size": "S",
      "stock": 10
    },
    {
      "color": "Xanh",
      "size": "M",
      "stock": 15
    },
    {
      "color": "Xanh",
      "size": "L",
      "stock": 20
    },
    {
      "color": "Đen",
      "size": "M",
      "stock": 12
    },
    {
      "color": "Đen",
      "size": "L",
      "stock": 18
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "code": 200,
  "message": "OK",
  "metadata": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Áo Polo Nam Xanh Đen",
    "description": "Áo polo cao cấp, thoáng mát, phù hợp công sở",
    "price": 250000,
    "discountedPrice": 199000,
    "product_shop": "69bad18e38830c44e8185c0b",
    "categoryId": "5f7c1c8c9d4e2a1b3c5d6e7f",
    "gender": 1,
    "images": ["https://example.com/polo-blue.jpg", "..."],
    "sizes": ["S", "M", "L", "XL", "XXL"],
    "colors": [...],
    "variants": [
      {
        "_id": "507f1f77bcf86cd79943a001",
        "color": "Xanh",
        "size": "S",
        "stock": 10
      },
      "..."
    ],
    "isDraft": true,
    "isPublished": false,
    "isDeleted": false,
    "salesNumber": 0,
    "ratings": 0,
    "reviews": [],
    "createdAt": "2026-05-07T10:15:30.000Z",
    "updatedAt": "2026-05-07T10:15:30.000Z"
  }
}
```

**Error Response (403 Forbidden) - User bình thường cố tạo product:**
```json
{
  "code": 403,
  "message": "Forbidden"
}
```

---

### 6. GET /product/shop/drafts - Danh Sách Sản Phẩm Nháp

**Mô tả:** Lấy tất cả sản phẩm ở trạng thái nháp (chưa publish)

**Headers:**
```
x-client-id: 69bad18e38830c44e8185c0b
authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters (Optional):**
```
?page=1&limit=10
```

**Response (200 OK):**
```json
{
  "code": 200,
  "message": "OK",
  "metadata": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Áo Polo Nam Xanh Đen",
      "price": 250000,
      "discountedPrice": 199000,
      "product_shop": "69bad18e38830c44e8185c0b",
      "isDraft": true,
      "isPublished": false,
      "variants": 5,
      "createdAt": "2026-05-07T10:15:30.000Z"
    }
  ]
}
```

---

### 7. GET /product/shop/published - Danh Sách Sản Phẩm Đã Publish

**Mô tả:** Lấy tất cả sản phẩm đã được publish (công khai)

**Headers:**
```
x-client-id: 69bad18e38830c44e8185c0b
authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters (Optional):**
```
?page=1&limit=10
```

**Response (200 OK):**
```json
{
  "code": 200,
  "message": "OK",
  "metadata": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Áo Polo Nam Xanh Đen",
      "price": 250000,
      "discountedPrice": 199000,
      "product_shop": "69bad18e38830c44e8185c0b",
      "isDraft": false,
      "isPublished": true,
      "variants": 5,
      "salesNumber": 23,
      "ratings": 4.5,
      "createdAt": "2026-05-07T10:15:30.000Z"
    }
  ]
}
```

---

### 8. PATCH /product/:productId - Sửa Sản Phẩm

**Mô tả:** Cập nhật thông tin sản phẩm (chỉ shop sở hữu được sửa)

**Headers:**
```
x-client-id: 69bad18e38830c44e8185c0b
authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Request Body (chỉ cần truyền field cần sửa):**
```json
{
  "title": "Áo Polo Nam Xanh Đen (Cao Cấp)",
  "price": 280000,
  "discountedPrice": 229000,
  "description": "Áo polo cao cấp 100% cotton, thoáng mát"
}
```

**Response (200 OK):**
```json
{
  "code": 200,
  "message": "OK",
  "metadata": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Áo Polo Nam Xanh Đen (Cao Cấp)",
    "price": 280000,
    "discountedPrice": 229000,
    "description": "Áo polo cao cấp 100% cotton, thoáng mát",
    "product_shop": "69bad18e38830c44e8185c0b",
    "updatedAt": "2026-05-07T11:30:00.000Z"
  }
}
```

**Error Response (403 Forbidden) - Shop không sở hữu product:**
```json
{
  "code": 403,
  "message": "You do not have permission to update this product"
}
```

---

### 9. PATCH /product/:productId/publish - Publish Sản Phẩm

**Mô tả:** Công khai sản phẩm (đưa từ nháp sang published)

**Headers:**
```
x-client-id: 69bad18e38830c44e8185c0b
authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request:** 
- Không có body

**Response (200 OK):**
```json
{
  "code": 200,
  "message": "OK",
  "metadata": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Áo Polo Nam Xanh Đen",
    "isDraft": false,
    "isPublished": true,
    "product_shop": "69bad18e38830c44e8185c0b",
    "publishedAt": "2026-05-07T12:00:00.000Z"
  }
}
```

---

### 10. PATCH /product/:productId/unpublish - Unpublish Sản Phẩm

**Mô tả:** Thu hồi công khai sản phẩm (đưa về nháp)

**Headers:**
```
x-client-id: 69bad18e38830c44e8185c0b
authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request:** 
- Không có body

**Response (200 OK):**
```json
{
  "code": 200,
  "message": "OK",
  "metadata": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Áo Polo Nam Xanh Đen",
    "isDraft": true,
    "isPublished": false,
    "product_shop": "69bad18e38830c44e8185c0b"
  }
}
```

---

### 11. DELETE /product/:productId - Xóa Sản Phẩm (Hard Delete)

**Mô tả:** Xóa vĩnh viễn sản phẩm (chỉ shop sở hữu được xóa)

**Headers:**
```
x-client-id: 69bad18e38830c44e8185c0b
authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request:** 
- Không có body

**Response (200 OK):**
```json
{
  "code": 200,
  "message": "OK",
  "metadata": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Áo Polo Nam Xanh Đen",
    "message": "Product permanently deleted"
  }
}
```

---

### 12. PATCH /product/:id/soft-delete - Soft Delete Sản Phẩm

**Mô tả:** Ẩn tạm thời sản phẩm (có thể restore lại)

**Headers:**
```
x-client-id: 69bad18e38830c44e8185c0b
authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request:** 
- Không có body

**Response (200 OK):**
```json
{
  "code": 200,
  "message": "OK",
  "metadata": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Áo Polo Nam Xanh Đen",
    "isDeleted": true,
    "deletedAt": "2026-05-07T13:00:00.000Z"
  }
}
```

---

### 13. PATCH /product/:id/restore - Khôi Phục Sản Phẩm

**Mô tả:** Phục hồi sản phẩm đã bị soft delete

**Headers:**
```
x-client-id: 69bad18e38830c44e8185c0b
authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request:** 
- Không có body

**Response (200 OK):**
```json
{
  "code": 200,
  "message": "OK",
  "metadata": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Áo Polo Nam Xanh Đen",
    "isDeleted": false,
    "deletedAt": null
  }
}
```

---

### 14. GET /product/shop/deleted - Danh Sách Sản Phẩm Đã Xóa

**Mô tả:** Xem danh sách sản phẩm bị soft delete

**Headers:**
```
x-client-id: 69bad18e38830c44e8185c0b
authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters (Optional):**
```
?page=1&limit=10
```

**Response (200 OK):**
```json
{
  "code": 200,
  "message": "OK",
  "metadata": {
    "products": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "title": "Áo Polo Nam Xanh Đen",
        "isDeleted": true,
        "deletedAt": "2026-05-07T13:00:00.000Z",
        "createdAt": "2026-05-07T10:15:30.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "pages": 1
    }
  }
}
```

---

### 15. DELETE /product/:id/permanent - Xóa Vĩnh Viễn

**Mô tả:** Xóa hoàn toàn sản phẩm đã soft delete (hard delete)

**Headers:**
```
x-client-id: 69bad18e38830c44e8185c0b
authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request:** 
- Không có body

**Response (200 OK):**
```json
{
  "code": 200,
  "message": "OK",
  "metadata": {
    "message": "Product permanently deleted",
    "deletedId": "507f1f77bcf86cd799439011"
  }
}
```

---

## Order Management

### 16. GET /shop/orders - Danh Sách Đơn Hàng

**Mô tả:** Lấy danh sách tất cả đơn hàng của shop

**Headers:**
```
x-client-id: 69bad18e38830c44e8185c0b
authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters (Optional):**
```
?page=1&limit=10&status=pending
```

**Status Options:** `pending | confirmed | processing | shipped | delivered | cancelled`

**Response (200 OK):**
```json
{
  "code": 200,
  "message": "OK",
  "metadata": {
    "orders": [
      {
        "_id": "60d5ec49c1234567890abcde",
        "userId": {
          "_id": "60d5ec49c1234567890xyz",
          "name": "Nguyễn Văn A",
          "email": "vana@gmail.com",
          "phone": "0912345678"
        },
        "shopId": "69bad18e38830c44e8185c0b",
        "receiverName": "Nguyễn Văn A",
        "receiverPhone": "0912345678",
        "address": "123 Đường ABC, Quận 1, TP.HCM",
        "items": [
          {
            "productId": {
              "_id": "507f1f77bcf86cd799439011",
              "title": "Áo Polo Nam Xanh Đen",
              "price": 199000,
              "images": ["https://example.com/polo.jpg"]
            },
            "variantId": "507f1f77bcf86cd79943a002",
            "quantity": 2,
            "color": "Xanh",
            "size": "M"
          }
        ],
        "totalPrice": 500000,
        "discountAmount": 0,
        "finalPrice": 500000,
        "status": "pending",
        "paymentMethod": "cod",
        "notes": "Giao giờ hành chính",
        "createdAt": "2026-05-07T08:00:00.000Z",
        "updatedAt": "2026-05-07T08:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 45,
      "pages": 5
    }
  }
}
```

---

### 17. GET /shop/orders/:id - Chi Tiết Đơn Hàng

**Mô tả:** Lấy chi tiết một đơn hàng cụ thể

**Headers:**
```
x-client-id: 69bad18e38830c44e8185c0b
authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**URL Parameters:**
```
/shop/orders/60d5ec49c1234567890abcde
```

**Response (200 OK):**
```json
{
  "code": 200,
  "message": "OK",
  "metadata": {
    "_id": "60d5ec49c1234567890abcde",
    "userId": {
      "_id": "60d5ec49c1234567890xyz",
      "name": "Nguyễn Văn A",
      "email": "vana@gmail.com",
      "phone": "0912345678"
    },
    "shopId": "69bad18e38830c44e8185c0b",
    "receiverName": "Nguyễn Văn A",
    "receiverPhone": "0912345678",
    "address": "123 Đường ABC, Quận 1, TP.HCM",
    "items": [
      {
        "productId": {
          "_id": "507f1f77bcf86cd799439011",
          "title": "Áo Polo Nam Xanh Đen",
          "price": 199000,
          "images": ["https://example.com/polo.jpg"]
        },
        "variantId": "507f1f77bcf86cd79943a002",
        "productName": "Áo Polo Nam Xanh Đen",
        "quantity": 2,
        "price": 199000,
        "color": "Xanh",
        "size": "M"
      }
    ],
    "totalPrice": 500000,
    "discountAmount": 0,
    "finalPrice": 500000,
    "status": "pending",
    "paymentMethod": "cod",
    "notes": "Giao giờ hành chính",
    "createdAt": "2026-05-07T08:00:00.000Z",
    "updatedAt": "2026-05-07T08:00:00.000Z"
  }
}
```

---

### 18. PATCH /shop/orders/:id/status - Cập Nhật Trạng Thái

**Mô tả:** Thay đổi trạng thái đơn hàng

**Headers:**
```
x-client-id: 69bad18e38830c44e8185c0b
authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**URL Parameters:**
```
/shop/orders/60d5ec49c1234567890abcde/status
```

**Request Body:**
```json
{
  "status": "confirmed"
}
```

**Workflow Chuyển Đổi Trạng Thái Hợp Lệ:**
```
pending → confirmed | cancelled
confirmed → processing | cancelled
processing → shipped
shipped → delivered
```

**Response (200 OK):**
```json
{
  "code": 200,
  "message": "OK",
  "metadata": {
    "_id": "60d5ec49c1234567890abcde",
    "status": "confirmed",
    "updatedAt": "2026-05-07T09:30:00.000Z"
  }
}
```

**Error Response (400 Bad Request) - Chuyển đổi không hợp lệ:**
```json
{
  "code": 400,
  "message": "Invalid status transition: pending -> shipped"
}
```

---

## Error Handling

### Common Error Responses

**401 Unauthorized - Token không hợp lệ:**
```json
{
  "code": 401,
  "message": "Invalid request - missing access token"
}
```

**403 Forbidden - Không có quyền:**
```json
{
  "code": 403,
  "message": "You do not have permission to update this product"
}
```

**404 Not Found - Resource không tồn tại:**
```json
{
  "code": 404,
  "message": "Product not found"
}
```

**400 Bad Request - Dữ liệu không hợp lệ:**
```json
{
  "code": 400,
  "message": "Missing required fields: title, price, variants"
}
```

---

## Flow Ví Dụ: Tạo Shop & Quản Lý Sản Phẩm

### Bước 1: Đăng Ký Shop
```bash
POST /shop/signup
Content-Type: application/json

{
  "name": "Shop Quần Áo XYZ",
  "email": "shop@example.com",
  "password": "SecurePass123"
}

Response → Lấy accessToken và refreshToken
```

### Bước 2: Đăng Nhập (lần sau)
```bash
POST /shop/signin
{
  "email": "shop@example.com",
  "password": "SecurePass123"
}

Response → Lấy accessToken
```

### Bước 3: Tạo Sản Phẩm
```bash
POST /product
Headers:
  x-client-id: <userId từ token>
  authorization: <accessToken>

Body: { title, price, variants, ... }
```

### Bước 4: Publish Sản Phẩm
```bash
PATCH /product/:productId/publish
Headers: [như trên]

Response: isDraft = false, isPublished = true
```

### Bước 5: Xem Danh Sách Đơn Hàng
```bash
GET /shop/orders?page=1&limit=10&status=pending
Headers: [như trên]

Response: Danh sách đơn hàng chưa xác nhận
```

### Bước 6: Cập Nhật Trạng Thái Đơn
```bash
PATCH /shop/orders/:orderId/status
Headers: [như trên]
Body: { status: "confirmed" }

Response: Đơn được xác nhận
```

---

## Lưu Ý Quan Trọng

### ✅ Luôn Gửi Đúng Header
- `x-client-id` = Shop ID (từ token)
- `authorization` = Access Token (không có "Bearer" prefix)

### ✅ Shop Chỉ Được Quản Lý Sản Phẩm Của Chính Mình
- Nếu shop A cố sửa sản phẩm của shop B → 403 Forbidden

### ✅ Trạng Thái Shop
- `active`: Shop đã được admin duyệt, có thể hoạt động
- `inactive`: Đang chờ duyệt, không thể dùng API
- `blocked`: Admin khóa shop, không thể dùng API

### ✅ Variants
- Mỗi variant = 1 kết hợp color + size
- Khi tạo product, phải gửi danh sách variants với stock

### ✅ Soft Delete vs Hard Delete
- **Soft Delete**: Ẩn sản phẩm (có thể restore)
- **Hard Delete**: Xóa vĩnh viễn (không thể khôi phục)

---

## Postman Collection

Để test API dễ dàng, import collection vào Postman:

```json
{
  "info": {
    "name": "Shop APIs v2.0",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Shop Signup",
      "request": {
        "method": "POST",
        "url": "http://192.168.50.218:3000/v1/api/shop/signup",
        "body": {
          "mode": "raw",
          "raw": "{\"name\":\"Shop Name\",\"email\":\"shop@example.com\",\"password\":\"Password123\"}"
        }
      }
    },
    {
      "name": "Shop Orders",
      "request": {
        "method": "GET",
        "url": "http://192.168.50.218:3000/v1/api/shop/orders",
        "header": [
          {"key": "x-client-id", "value": "{{shopId}}"},
          {"key": "authorization", "value": "{{accessToken}}"}
        ]
      }
    }
  ]
}
```

---

**Cập nhật lần cuối:** 2026-05-07  
**Phiên bản:** 2.0
