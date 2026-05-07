# TONG HOP API BACKEND (BE-Learning)

Cap nhat theo code route hien tai ngay 2026-05-05.

## 1) Tong quan

- Base URL chinh: /v1/api
- Co 1 mount legacy cho notification: /api/users
- Tat ca endpoint ben duoi la duong dan day du (full path)

## 2) Co che xac thuc

### User/Shop token (authenticationV2, shopAuthenticationV2)
Dung cho phan lon API client/shop:
- Header x-client-id: userId
- Header authorization: accessToken
- Header x-rtoken-id: refreshToken (chi dung cho flow refresh)

### Admin token (verifyAdmin)
Dung cho admin API:
- Header Authorization: Bearer <admin_access_token>
- Hoac x-access-token: <admin_access_token>

## 3) Quy uoc response

Response thuong co dang:
- Thanh cong: code, message, metadata
- Loi: code, message

HTTP code pho bien: 200, 201, 400, 401, 403, 404, 409, 500.

---

## 4) API danh cho Access/Auth + User profile

### 4.1 Public auth

| Method | Endpoint | Auth | Mo ta |
|---|---|---|---|
| POST | /v1/api/shop/signup | Khong | Dang ky shop |
| POST | /v1/api/shop/signin | Khong | Dang nhap shop |
| POST | /v1/api/user/signup | Khong | Dang ky user |
| POST | /v1/api/user/signin | Khong | Dang nhap user |

### 4.2 Protected auth

| Method | Endpoint | Auth | Mo ta |
|---|---|---|---|
| POST | /v1/api/logout | User/Shop token | Dang xuat |
| POST | /v1/api/handlerRefreshToken | User/Shop token + refresh token | Lam moi token |

### 4.3 User profile APIs

| Method | Endpoint | Auth | Mo ta |
|---|---|---|---|
| GET | /v1/api/user/profile | User token | Lay profile |
| PATCH | /v1/api/user/profile | User token | Cap nhat profile |
| PATCH | /v1/api/user/password | User token | Doi mat khau |
| PATCH | /v1/api/user/fcm-token | User token | Cap nhat FCM token |
| DELETE | /v1/api/user/fcm-token | User token | Xoa FCM token |

---

## 5) Address APIs

| Method | Endpoint | Auth | Mo ta |
|---|---|---|---|
| POST | /v1/api/address | User token | Tao dia chi |
| GET | /v1/api/address | User token | Danh sach dia chi |
| GET | /v1/api/address/default | User token | Lay dia chi mac dinh |
| PUT | /v1/api/address/set-default/:id | User token | Dat mac dinh |
| PUT | /v1/api/address/:id | User token | Cap nhat dia chi |
| DELETE | /v1/api/address/:id | User token | Xoa dia chi |

---

## 6) Category APIs

### 6.1 Public

| Method | Endpoint | Auth | Mo ta |
|---|---|---|---|
| GET | /v1/api/category/ | Khong | Lay tat ca category |
| GET | /v1/api/category/slug/:slug | Khong | Lay category theo slug |
| GET | /v1/api/category/:categoryId | Khong | Lay category theo ID |

### 6.2 Admin only

| Method | Endpoint | Auth | Mo ta |
|---|---|---|---|
| POST | /v1/api/category/ | Admin token | Tao category |
| PATCH | /v1/api/category/:categoryId | Admin token | Sua category |
| DELETE | /v1/api/category/:categoryId | Admin token | Xoa category |
| POST | /v1/api/category/seed/default | Admin token | Seed category mac dinh |

---

## 7) Product APIs

### 7.1 Public

| Method | Endpoint | Auth | Mo ta |
|---|---|---|---|
| GET | /v1/api/product/search | Tuy chon token | Tim kiem san pham |
| GET | /v1/api/product/top-selling | Khong | Top ban chay |
| GET | /v1/api/product/suggested/:userId | Khong | Goi y theo lich su |
| GET | /v1/api/product/ | Khong | Danh sach san pham |
| GET | /v1/api/product/:productId | Khong | Chi tiet san pham |

### 7.2 Protected (authenticationV2 / shopAuthenticationV2)

| Method | Endpoint | Auth | Mo ta |
|---|---|---|---|
| POST | /v1/api/product/:productId/reviews | User token | Them danh gia |

### 7.3 Shop only - requires shopAuthenticationV2

| Method | Endpoint | Auth | Mo ta |
|---|---|---|---|
| POST | /v1/api/product/ | Shop token | Tao san pham |
| PATCH | /v1/api/product/:productId | Shop token | Sua san pham |
| DELETE | /v1/api/product/:productId | Shop token | Xoa cung san pham |
| GET | /v1/api/product/shop/drafts | Shop token | San pham nhap |
| GET | /v1/api/product/shop/published | Shop token | San pham da publish |
| PATCH | /v1/api/product/:productId/publish | Shop token | Publish san pham |
| PATCH | /v1/api/product/:productId/unpublish | Shop token | Unpublish san pham |

### 7.4 Shop soft delete APIs

| Method | Endpoint | Auth | Mo ta |
|---|---|---|---|
| PATCH | /v1/api/product/:id/soft-delete | Shop token | Soft delete |
| PATCH | /v1/api/product/:id/restore | Shop token | Restore |
| DELETE | /v1/api/product/:id/permanent | Shop token | Xoa vinh vien |
| GET | /v1/api/product/shop/deleted | Shop token | Danh sach da xoa |

---

## 8) Cart APIs

| Method | Endpoint | Auth | Mo ta |
|---|---|---|---|
| POST | /v1/api/cart/add | User token | Them vao gio |
| POST | /v1/api/cart/update | User token | Cap nhat so luong |
| DELETE | /v1/api/cart | User token | Xoa item khoi gio |
| GET | /v1/api/cart | User token | Lay gio hang |

---

## 9) Checkout APIs

| Method | Endpoint | Auth | Mo ta |
|---|---|---|---|
| POST | /v1/api/checkout/review | Theo route: khong bat buoc | Review don/so tien truoc checkout |

---

## 10) Discount APIs

### 10.1 Public

| Method | Endpoint | Auth | Mo ta |
|---|---|---|---|
| POST | /v1/api/discount/amount | Khong | Tinh so tien giam |
| GET | /v1/api/discount/list_product_code | Khong | Lay ma giam gia va san pham ap dung |

### 10.2 Shop APIs

| Method | Endpoint | Auth | Mo ta |
|---|---|---|---|
| POST | /v1/api/discount | Shop token | Tao ma giam gia |
| GET | /v1/api/discount | Shop token | Lay ds ma giam gia cua shop |
| PATCH | /v1/api/discount/:id | Shop token | Cap nhat ma giam gia |
| DELETE | /v1/api/discount/:id | Shop token | Xoa ma giam gia |

---

## 11) Inventory APIs (Shop)

| Method | Endpoint | Auth | Mo ta |
|---|---|---|---|
| POST | /v1/api/inventory | Shop token | Tao/cap nhat ton kho |
| GET | /v1/api/inventory | Shop token | Danh sach ton kho |
| GET | /v1/api/inventory/summary | Shop token | Tong quan ton kho |
| GET | /v1/api/inventory/:id | Shop token | Chi tiet ton kho |
| PATCH | /v1/api/inventory/:id | Shop token | Sua ton kho |
| DELETE | /v1/api/inventory/:id | Shop token | Xoa ban ghi ton kho |

---

## 12) Order APIs (User)

| Method | Endpoint | Auth | Mo ta |
|---|---|---|---|
| POST | /v1/api/order/orders | User token | Tao don hang |
| GET | /v1/api/order/orders | User token | Lay ds don hang cua user |
| GET | /v1/api/order/orders/:id | User token | Chi tiet don hang |

---

## 13) Search History APIs

| Method | Endpoint | Auth | Mo ta |
|---|---|---|---|
| POST | /v1/api/search/history | Khong (app tu xu ly) | Luu tu khoa tim kiem |
| GET | /v1/api/search/history/:userId | Khong (app tu xu ly) | Lay lich su tim kiem |
| DELETE | /v1/api/search/history/:userId | Khong (app tu xu ly) | Xoa lich su tim kiem |

---

## 14) Notification APIs

### 14.1 Register token + admin send (mount: /v1/api/users)

| Method | Endpoint | Auth | Mo ta |
|---|---|---|---|
| POST | /v1/api/users/fcm-token | User token | Dang ky FCM token |
| DELETE | /v1/api/users/fcm-token | User token | Xoa FCM token |
| POST | /v1/api/users/notifications/send | Admin token | Admin gui thong bao |

### 14.2 User notification box (mount: /v1/api)

| Method | Endpoint | Auth | Mo ta |
|---|---|---|---|
| GET | /v1/api/notifications/:userId | User token | Lay danh sach thong bao |
| PATCH | /v1/api/notifications/read/:id | User token | Danh dau da doc |
| PATCH | /v1/api/notifications/read-all/:userId | User token | Danh dau doc tat ca |
| GET | /v1/api/notifications/unread-count/:userId | User token | So thong bao chua doc |
| DELETE | /v1/api/notifications/:id | User token | Xoa thong bao |

### 14.3 Legacy mount (tuong duong 14.1)

| Method | Endpoint | Auth | Mo ta |
|---|---|---|---|
| POST | /api/users/fcm-token | User token | Legacy path |
| DELETE | /api/users/fcm-token | User token | Legacy path |
| POST | /api/users/notifications/send | Admin token | Legacy path |

---

## 15) Shop APIs (/v1/api/shop)

### 15.1 Public

| Method | Endpoint | Auth | Mo ta |
|---|---|---|---|
| POST | /v1/api/shop/signin | Khong | Dang nhap shop |
| POST | /v1/api/shop/signup | Khong | Dang ky shop |

### 15.2 Protected

| Method | Endpoint | Auth | Mo ta |
|---|---|---|---|
| GET | /v1/api/shop/orders | Shop token | Danh sach don cua shop |
| GET | /v1/api/shop/orders/:id | Shop token | Chi tiet don cua shop |
| PATCH | /v1/api/shop/orders/:id/status | Shop token | Cap nhat trang thai don |
| GET | /v1/api/shop/dashboard | Shop token | Dashboard shop |
| GET | /v1/api/shop/status | Shop token | Trang thai tai khoan shop |

---

## 16) Admin APIs (/v1/api/admin)

### 16.1 Auth

| Method | Endpoint | Auth | Mo ta |
|---|---|---|---|
| POST | /v1/api/admin/auth/login | Khong | Dang nhap admin |
| GET | /v1/api/admin/profile | Admin token | Lay profile admin |

### 16.2 Shop management

| Method | Endpoint | Auth | Mo ta |
|---|---|---|---|
| GET | /v1/api/admin/shops | Admin token | Danh sach shop |
| GET | /v1/api/admin/shops/:shopId | Admin token | Chi tiet shop |
| PATCH | /v1/api/admin/shops/:shopId/status | Admin token | Cap nhat trang thai shop |
| PATCH | /v1/api/admin/shops/:shopId/verify | Admin token | Xac minh shop |

### 16.3 User management

| Method | Endpoint | Auth | Mo ta |
|---|---|---|---|
| GET | /v1/api/admin/users | Admin token | Danh sach user |
| GET | /v1/api/admin/users/:userId | Admin token | Chi tiet user |
| PATCH | /v1/api/admin/users/:userId/status | Admin token | Cap nhat trang thai user |

### 16.4 Product moderation

| Method | Endpoint | Auth | Mo ta |
|---|---|---|---|
| GET | /v1/api/admin/products | Admin token | Danh sach product |
| PATCH | /v1/api/admin/products/:id/status | Admin token | Duyet/tu choi product |
| DELETE | /v1/api/admin/products/:id | Admin token | Xoa product |

### 16.5 Order management

| Method | Endpoint | Auth | Mo ta |
|---|---|---|---|
| GET | /v1/api/admin/orders | Admin token | Danh sach order |
| GET | /v1/api/admin/orders/:id | Admin token | Chi tiet order |
| PATCH | /v1/api/admin/orders/:id/status | Admin token | Cap nhat trang thai order |

### 16.6 Analytics + Notification

| Method | Endpoint | Auth | Mo ta |
|---|---|---|---|
| GET | /v1/api/admin/analytics/overview | Admin token | Tong quan he thong |
| POST | /v1/api/admin/notifications/send-bulk | Admin token | Gui thong bao hang loat |

---

## 17) Ghi chu quan trong

- **Product shop API (tạo/sửa/xóa/publish)** hiện dùng `shopAuthenticationV2` để chỉ shop được phép. Service kiểm tra ownership để shop chỉ sửa/xóa sản phẩm của chính mình.
- Co trung lap endpoint shop signin/signup o 2 noi:
  - /v1/api/shop/* (router shop)
  - /v1/api/shop/* (router access)
  Cung path, cung chuc nang, can thong nhat de de bao tri.
- Trong `src/routes/product/index.js`, các route `GET /v1/api/product/shop/drafts`, `GET /v1/api/product/shop/published`, `GET /v1/api/product/shop/deleted` đang được khai báo sau `GET /v1/api/product/:productId`. Khi test thực tế, cần chú ý thứ tự route của Express vì path tham số có thể bắt trước các path `shop/*`.
- Notification dang co 2 mount path (/v1/api/users va /api/users). Neu khong can backward compatibility, nen bo 1 path.

---

## 18) Hiểu rõ về variantId

### variantId là gì?

`variantId` là ObjectId duy nhất của từng kết hợp **(color + size)** trong một sản phẩm.

**Cách lưu trữ trong DB:**
- Mỗi Product có mảng `variants[]`
- Khi tạo/update product với sizes và colors, backend **tự động generate** tất cả kết hợp (color × size)
- Mỗi variant nhận một `_id` (ObjectId) từ MongoDB

**Ví dụ Response từ GET /v1/api/product/[productId]:**

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "title": "T-Shirt Xanh",
  "price": 150000,
  "discountedPrice": 120000,
  "sizes": ["S", "M", "L", "XL"],
  "colors": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "title": "Xanh",
      "rgb": [0, 100, 200]
    },
    {
      "_id": "507f1f77bcf86cd799439013",
      "title": "Đen",
      "rgb": [0, 0, 0]
    }
  ],
  "variants": [
    {
      "_id": "507f1f77bcf86cd79943a001",  // ← variantId
      "color": "Xanh",
      "size": "S",
      "stock": 50
    },
    {
      "_id": "507f1f77bcf86cd79943a002",  // ← variantId
      "color": "Xanh",
      "size": "M",
      "stock": 30
    },
    {
      "_id": "507f1f77bcf86cd79943a003",  // ← variantId
      "color": "Xanh",
      "size": "L",
      "stock": 25
    },
    {
      "_id": "507f1f77bcf86cd79943a004",  // ← variantId
      "color": "Đen",
      "size": "S",
      "stock": 40
    }
  ]
}
```

### Cách lấy variantId khi add cart / tạo order:

1. **Gọi GET /v1/api/product/[productId]** để lấy danh sách variants
2. **Tìm variant phù hợp** dựa trên color + size mà user chọn
3. **Copy _id của variant đó** làm variantId

**Ví dụ:**
- User chọn T-Shirt Xanh, Size M → lấy variantId = `507f1f77bcf86cd79943a002`
- User chọn T-Shirt Đen, Size S → lấy variantId = `507f1f77bcf86cd79943a004`

### Payload khi add to cart:

```json
POST /v1/api/cart/add
{
  "productId": "507f1f77bcf86cd799439011",
  "variantId": "507f1f77bcf86cd79943a002",
  "quantity": 2
}
```

### Payload khi đặt hàng (buy_now):

```json
POST /v1/api/order/orders
{
  "type": "buy_now",
  "addressId": "507f1f77bcf86cd799439020",
  "productId": "507f1f77bcf86cd799439011",
  "variantId": "507f1f77bcf86cd79943a002",
  "quantity": 1
}
```

### Response khi get cart:

```json
GET /v1/api/cart
Response:
{
  "_id": "507f1f77bcf86cd799439030",
  "user": "507f1f77bcf86cd799439040",
  "items": [
    {
      "product": {
        "_id": "507f1f77bcf86cd799439011",
        "title": "T-Shirt Xanh",
        "images": ["..."],
        "price": 150000,
        "discountedPrice": 120000,
        "colors": [...],
        "sizes": ["S", "M", "L", "XL"],
        "variants": [...]
      },
      "variantId": "507f1f77bcf86cd79943a002",  // ← ID của (Xanh, M)
      "quantity": 2,
      "price": 120000
    }
  ],
  "totalPrice": 240000
}
```

### Tóm tắt:

| Khái niệm | Ví dụ |
|-----------|-------|
| Product ID | `507f1f77bcf86cd799439011` (1 sản phẩm) |
| Variant ID | `507f1f77bcf86cd79943a002` (1 kết hợp color+size của product) |
| Color | "Xanh" (tên màu trong colors[] của product) |
| Size | "M" (kích thước trong sizes[] của product) |
| Cách tìm variantId | GET product → tìm trong variants[] → khớp color + size |

---

## 19) Request spec chi tiet (Header + Body + Query + Params)

Quy uoc Header:
- User token: x-client-id + authorization
- Shop token: x-client-id + authorization
- Admin token: Authorization: Bearer <token> (hoac x-access-token)

### 19.1 Access/Auth

1) POST /v1/api/shop/signup
- Headers: none
- Body bat buoc: { name, email, password }

2) POST /v1/api/shop/signin
- Headers: none
- Body bat buoc: { email, password }

3) POST /v1/api/user/signup
- Headers: none
- Body bat buoc: { name, email, password }

4) POST /v1/api/user/signin
- Headers: none
- Body bat buoc: { email, password }

5) POST /v1/api/logout
- Headers bat buoc: x-client-id, authorization
- Body: none

6) POST /v1/api/handlerRefreshToken
- Headers bat buoc: x-client-id, authorization, x-rtoken-id
- Body: none

### 19.2 User profile

1) GET /v1/api/user/profile
- Headers bat buoc: x-client-id, authorization
- Body: none

2) PATCH /v1/api/user/profile
- Headers bat buoc: x-client-id, authorization
- Body tuy chon: { name?, phone?, address?, avatar? }

3) PATCH /v1/api/user/password
- Headers bat buoc: x-client-id, authorization
- Body bat buoc: { oldPassword, newPassword }

4) PATCH /v1/api/user/fcm-token
- Headers bat buoc: x-client-id, authorization
- Body bat buoc: { fcmToken }

5) DELETE /v1/api/user/fcm-token
- Headers bat buoc: x-client-id, authorization
- Body bat buoc: { fcmToken }

### 19.3 Address

1) POST /v1/api/address
- Headers bat buoc: x-client-id, authorization
- Body bat buoc: { receiverName, receiverPhone, address }

2) GET /v1/api/address
- Headers bat buoc: x-client-id, authorization
- Body: none

3) GET /v1/api/address/default
- Headers bat buoc: x-client-id, authorization
- Body: none

4) PUT /v1/api/address/set-default/:id
- Headers bat buoc: x-client-id, authorization
- Params: id = addressId
- Body: none

5) PUT /v1/api/address/:id
- Headers bat buoc: x-client-id, authorization
- Params: id = addressId
- Body tuy chon: { receiverName?, receiverPhone?, address? }

6) DELETE /v1/api/address/:id
- Headers bat buoc: x-client-id, authorization
- Params: id = addressId
- Body: none

### 19.4 Category

1) GET /v1/api/category/
- Headers: none
- Body: none

2) GET /v1/api/category/slug/:slug
- Headers: none
- Params: slug
- Body: none

3) GET /v1/api/category/:categoryId
- Headers: none
- Params: categoryId
- Body: none

4) POST /v1/api/category/
- Headers bat buoc: Authorization (admin)
- Body bat buoc: { name }
- Body tuy chon: { description }

5) PATCH /v1/api/category/:categoryId
- Headers bat buoc: Authorization (admin)
- Params: categoryId
- Body tuy chon: { name?, description?, isActive? }

6) DELETE /v1/api/category/:categoryId
- Headers bat buoc: Authorization (admin)
- Params: categoryId
- Body: none

7) POST /v1/api/category/seed/default
- Headers bat buoc: Authorization (admin)
- Body: none

### 19.5 Product

1) GET /v1/api/product/search
- Headers: optional x-client-id + authorization
- Query: q?, categoryId?
- Body: none

2) GET /v1/api/product/top-selling
- Headers: none
- Query: limit?
- Body: none

3) GET /v1/api/product/suggested/:userId
- Headers: none
- Params: userId
- Body: none

4) GET /v1/api/product/
- Headers: none
- Query: categoryId?, minPrice?, maxPrice?, gender?, sort?, page?, limit?
- Body: none

5) GET /v1/api/product/:productId
- Headers: none
- Params: productId
- Body: none

6) POST /v1/api/product/:productId/reviews
- Headers bat buoc: x-client-id, authorization (auth middleware: authenticationV2)
- Params: productId
- Body bat buoc: { content, rating }
- rating hop le: 0..5

7) POST /v1/api/product/
- Headers bat buoc: x-client-id, authorization (shop token)
- Body bat buoc toi thieu: { title (hoac product_name), price (hoac product_price), variants }
- Body thuong dung:
  {
    title,
    description,
    price,
    discountedPrice,
    categoryId,
    gender,
    images,
    sizes,
    colors,
    variants
  }
- Ghi chu: title, price va variants la cac field bat buoc de tao product
- Dinh dang variants thuong dung:
  [
    {
      color: "Đen",
      size: "M",
      stock: 10
    },
    {
      color: "Trắng",
      size: "L",
      stock: 5
    }
  ]
- Neu khong gui stock cho tung variant, backend mac dinh stock = 0

8) PATCH /v1/api/product/:productId
- Headers bat buoc: x-client-id, authorization (shop token)
- Params: productId
- Body: cac field can update cua product

9) DELETE /v1/api/product/:productId
- Headers bat buoc: x-client-id, authorization (shop token)
- Params: productId
- Body: none

10) GET /v1/api/product/shop/drafts
- Headers bat buoc: x-client-id, authorization (shop token)
- Body: none

11) GET /v1/api/product/shop/published
- Headers bat buoc: x-client-id, authorization (shop token)
- Body: none

12) PATCH /v1/api/product/:productId/publish
- Headers bat buoc: x-client-id, authorization (shop token)
- Params: productId
- Body: none

13) PATCH /v1/api/product/:productId/unpublish
- Headers bat buoc: x-client-id, authorization (shop token)
- Params: productId
- Body: none

14) PATCH /v1/api/product/:id/soft-delete
- Headers bat buoc: x-client-id, authorization (shop token)
- Params: id = productId
- Body: none

15) PATCH /v1/api/product/:id/restore
- Headers bat buoc: x-client-id, authorization (shop token)
- Params: id = productId
- Body: none

16) DELETE /v1/api/product/:id/permanent
- Headers bat buoc: x-client-id, authorization (shop token)
- Params: id = productId
- Body: none

17) GET /v1/api/product/shop/deleted
- Headers bat buoc: x-client-id, authorization (shop token)
- Query: page?, limit?
- Body: none

### 19.6 Cart

1) POST /v1/api/cart/add
- Headers bat buoc: x-client-id, authorization
- Body bat buoc: { productId, variantId, quantity }
- quantity phai la number >= 1

2) POST /v1/api/cart/update
- Headers bat buoc: x-client-id, authorization
- Body bat buoc: { productId, variantId, quantity }
- quantity <= 0 se bi remove item

3) DELETE /v1/api/cart
- Headers bat buoc: x-client-id, authorization
- Body bat buoc: { productId, variantId }

4) GET /v1/api/cart
- Headers bat buoc: x-client-id, authorization
- Body: none

### 19.7 Checkout

1) POST /v1/api/checkout/review
- Headers: theo route hien tai khong bat buoc
- Body bat buoc theo service:
  {
    cartId,
    userId,
    shop_order_ids: [
      {
        shopId,
        shop_discounts: [ { codeId } ],
        item_products: [ { productId, quantity, price } ]
      }
    ]
  }

### 19.8 Discount

1) POST /v1/api/discount/amount
- Headers: none
- Body bat buoc: { codeId, shopId, userId, products }
- products la mang item: [{ productId, quantity, price, ... }]

2) GET /v1/api/discount/list_product_code
- Headers: none
- Query thuong dung: code, shopId, userId?, page?, limit?

3) POST /v1/api/discount
- Headers bat buoc: x-client-id, authorization (shop token)
- Body bat buoc chinh:
  {
    code,
    name,
    description,
    type,
    value,
    start_date,
    end_date,
    is_active,
    applies_to,
    max_uses,
    max_uses_per_user
  }
- Body tuy chon: { min_order_value?, max_value?, uses_count?, users_used?, product_ids? }
- Ghi chu: applies_to thuong la all hoac specific

4) GET /v1/api/discount
- Headers bat buoc: x-client-id, authorization (shop token)
- Query thuong dung: page, limit

5) PATCH /v1/api/discount/:id
- Headers bat buoc: x-client-id, authorization (shop token)
- Params: id = discountId
- Body tuy chon:
  {
    description?,
    value?,
    maxUses?,
    expiryDate?,
    applicableProducts?,
    applicableCategories?,
    minOrderValue?
  }

6) DELETE /v1/api/discount/:id
- Headers bat buoc: x-client-id, authorization (shop token)
- Params: id = discountId
- Body tuy chon: { allowIfUsed?: boolean }

### 19.9 Inventory (shop)

1) POST /v1/api/inventory
- Headers bat buoc: x-client-id, authorization (shop token)
- Body thuong dung:
  {
    productId,
    totalQuantity?,
    location?,
    reserved?,
    variants?: [ { size, color, quantity } ]
  }

2) GET /v1/api/inventory
- Headers bat buoc: x-client-id, authorization (shop token)
- Query: page?, limit?, status?
- status hop le: in_stock | low_stock | out_of_stock

3) GET /v1/api/inventory/summary
- Headers bat buoc: x-client-id, authorization (shop token)
- Body: none

4) GET /v1/api/inventory/:id
- Headers bat buoc: x-client-id, authorization (shop token)
- Params: id = inventoryId
- Body: none

5) PATCH /v1/api/inventory/:id
- Headers bat buoc: x-client-id, authorization (shop token)
- Params: id = inventoryId
- Body tuy chon:
  {
    totalQuantity?,
    location?,
    reserved?,
    variants?: [ { size, color, quantity } ]
  }

6) DELETE /v1/api/inventory/:id
- Headers bat buoc: x-client-id, authorization (shop token)
- Params: id = inventoryId
- Body: none

### 19.10 Order (user)

1) POST /v1/api/order/orders
- Headers bat buoc: x-client-id, authorization
- Body mode cart:
  { type: "cart", addressId }
- Body mode buy_now:
  { type: "buy_now", addressId, productId, variantId, quantity }

2) GET /v1/api/order/orders
- Headers bat buoc: x-client-id, authorization
- Body: none

3) GET /v1/api/order/orders/:id
- Headers bat buoc: x-client-id, authorization
- Params: id = orderId
- Body: none

### 19.11 Search history

1) POST /v1/api/search/history
- Headers: none
- Body bat buoc: { userId, keyword }

2) GET /v1/api/search/history/:userId
- Headers: none
- Params: userId
- Query: limit? (mac dinh 20)
- Body: none

3) DELETE /v1/api/search/history/:userId
- Headers: none
- Params: userId
- Body: none

### 19.12 Notification

1) POST /v1/api/users/fcm-token
- Headers bat buoc: x-client-id, authorization
- Body bat buoc: { fcmToken }
- Body tuy chon: { oldFcmToken?, userId? }

2) DELETE /v1/api/users/fcm-token
- Headers bat buoc: x-client-id, authorization
- Body bat buoc: { fcmToken }
- Body tuy chon: { userId? }

3) POST /v1/api/users/notifications/send
- Headers bat buoc: Authorization (admin)
- Body bat buoc: { userId, title, body }
- Body tuy chon: { type?, data? }
- type hop le: order | promo | promotion | system | test | custom

4) GET /v1/api/notifications/:userId
- Headers bat buoc: x-client-id, authorization
- Params: userId
- Query: page?, limit?
- Body: none

5) PATCH /v1/api/notifications/read/:id
- Headers bat buoc: x-client-id, authorization
- Params: id = notificationId
- Body: none

6) PATCH /v1/api/notifications/read-all/:userId
- Headers bat buoc: x-client-id, authorization
- Params: userId
- Body: none

7) GET /v1/api/notifications/unread-count/:userId
- Headers bat buoc: x-client-id, authorization
- Params: userId
- Body: none

8) DELETE /v1/api/notifications/:id
- Headers bat buoc: x-client-id, authorization
- Params: id = notificationId
- Body: none

### 19.13 Shop

1) POST /v1/api/shop/signup
- Headers: none
- Body bat buoc: { name, email, password }

2) POST /v1/api/shop/signin
- Headers: none
- Body bat buoc: { email, password }

3) GET /v1/api/shop/orders
- Headers bat buoc: x-client-id, authorization
- Query: page?, limit?, status?
- status hop le: pending | confirmed | processing | shipped | delivered | cancelled
- Body: none

4) GET /v1/api/shop/orders/:id
- Headers bat buoc: x-client-id, authorization
- Params: id = orderId
- Body: none

5) PATCH /v1/api/shop/orders/:id/status
- Headers bat buoc: x-client-id, authorization
- Params: id = orderId
- Body bat buoc: { status }
- transition hop le:
  - pending -> confirmed | cancelled
  - confirmed -> processing | cancelled
  - processing -> shipped
  - shipped -> delivered

6) GET /v1/api/shop/dashboard
- Headers bat buoc: x-client-id, authorization
- Body: none

7) GET /v1/api/shop/status
- Headers bat buoc: x-client-id, authorization
- Body: none

### 19.14 Admin

1) POST /v1/api/admin/auth/login
- Headers: none
- Body bat buoc: { account, password }

2) GET /v1/api/admin/profile
- Headers bat buoc: Authorization: Bearer <token> (hoac x-access-token)
- Body: none

3) GET /v1/api/admin/shops
- Headers bat buoc: Authorization admin
- Query: page?, limit?, status?, keyword?
- status chap nhan: active | blocked | inactive

4) GET /v1/api/admin/shops/:shopId
- Headers bat buoc: Authorization admin
- Params: shopId

5) PATCH /v1/api/admin/shops/:shopId/status
- Headers bat buoc: Authorization admin
- Params: shopId
- Body bat buoc: { status }
- Body tuy chon: { reason }
- status hop le: active | blocked | inactive (inactive duoc normalize ve blocked)

6) PATCH /v1/api/admin/shops/:shopId/verify
- Headers bat buoc: Authorization admin
- Params: shopId
- Body: none

7) GET /v1/api/admin/users
- Headers bat buoc: Authorization admin
- Query: page?, limit?, status?, keyword?
- status chap nhan: active | inactive | ban | unban

8) GET /v1/api/admin/users/:userId
- Headers bat buoc: Authorization admin
- Params: userId

9) PATCH /v1/api/admin/users/:userId/status
- Headers bat buoc: Authorization admin
- Params: userId
- Body bat buoc: { status }
- status hop le: active | inactive | ban | unban

10) GET /v1/api/admin/products
- Headers bat buoc: Authorization admin
- Query: page?, limit?, status?
- status hop le: pending | approved | rejected

11) PATCH /v1/api/admin/products/:id/status
- Headers bat buoc: Authorization admin
- Params: id = productId
- Body bat buoc: { status }
- Body tuy chon: { moderationNote }

12) DELETE /v1/api/admin/products/:id
- Headers bat buoc: Authorization admin
- Params: id = productId
- Body: none

13) GET /v1/api/admin/orders
- Headers bat buoc: Authorization admin
- Query: page?, limit?, status?
- status hop le: pending | confirmed | processing | shipped | delivered | cancelled

14) GET /v1/api/admin/orders/:id
- Headers bat buoc: Authorization admin
- Params: id = orderId
- Body: none

15) PATCH /v1/api/admin/orders/:id/status
- Headers bat buoc: Authorization admin
- Params: id = orderId
- Body bat buoc: { status }
- Body tuy chon: { note }

16) GET /v1/api/admin/analytics/overview
- Headers bat buoc: Authorization admin
- Body: none

17) POST /v1/api/admin/notifications/send-bulk
- Headers bat buoc: Authorization admin
- Body bat buoc:
  {
    userIds: ["..."],
    title,
    body
  }
- Body tuy chon: { type?, data? }
- type hop le: promotion | system | custom | order | promo | test
