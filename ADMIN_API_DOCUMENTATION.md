# Tài liệu API Admin (khớp với mã nguồn hiện tại)

Tệp này mô tả các endpoint admin đã được triển khai trong repository hiện tại.

Base path: `/v1/api/admin`

Chú ý chung:
- Tất cả endpoint (ngoại trừ `POST /auth/login`) yêu cầu header `Authorization: Bearer <adminAccessToken>`.
- Token admin được tạo và xác thực bởi `src/auth/adminAuth.js` (JWT, role `admin`).
- Mọi response sử dụng định dạng chuẩn `SuccessResponse`:

```json
{
  "code": 200,
  "message": "...",
  "metadata": { ... }
}
```

## Xác thực

1) Đăng nhập admin

```
POST /v1/api/admin/auth/login
```

Headers: none

Body (JSON):
```json
{
  "email": "admin@example.com",
  "password": "secret"
}
```

Response metadata:
- `admin`: thông tin admin ( `_id`, `name`, `email`, `phone`, `avatar`, `status`, `roles`, ... )
- `tokens`: `{ accessToken, refreshToken }`

2) Lấy profile admin

```
GET /v1/api/admin/profile
```

Headers:
```
Authorization: Bearer <adminAccessToken>
```

Response metadata: thông tin admin ( `_id`, `name`, `email`, `phone`, `avatar`, `status`, `roles`, ... )

## Shop Management

1) Lấy danh sách shops

```
GET /v1/api/admin/shops
```

Query params:
- `page` (số trang), `limit` (số item mỗi trang)
- `status` — filter theo trạng thái (`active` hoặc `blocked`/`inactive`)
- `keyword` — tìm theo `name` hoặc `email`

Response metadata:
- `shops`: mảng shop (đã chuẩn hóa `status` thành `active` hoặc `blocked`)
- `pagination`: `{ total, page, limit, totalPages }`

2) Lấy chi tiết shop

```
GET /v1/api/admin/shops/:shopId
```

Headers: `Authorization: Bearer <adminAccessToken>`

Response metadata: chi tiết shop (field cơ bản như trong `Shop` model)

3) Cập nhật trạng thái shop

```
PATCH /v1/api/admin/shops/:shopId/status
```

Body (JSON):
```json
{
  "status": "blocked|active|inactive",
  "reason": "(tuỳ chọn) lý do khi block"
}
```

Response metadata: shop đã cập nhật (status, blockedAt, blockedReason khi có)

4) Verify shop

```
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

