# TỔNG HỢP API ADMIN - QUICK REFERENCE

**Base URL:** `/v1/api/admin`

**Authentication:** Tất cả endpoint (trừ login) cần `Authorization: Bearer <token>`

---

## 1. Authentication (Xác Thực)

| Method | Endpoint | Mô Tả | Auth |
|--------|----------|-------|------|
| POST | `/auth/login` | Đăng nhập admin | ❌ |
| GET | `/profile` | Lấy profile admin | ✅ |

**POST /auth/login:**
- Body: `{ account, password }`
- Return: `{ admin, tokens }`
- Lỗi: 400, 401, 403

**GET /profile:**
- Return: Admin info với permissions, lastLogin
- Lỗi: 401, 403, 404

---

## 2. Shop Management (Quản Lý Shop)

| Method | Endpoint | Mô Tả | Auth |
|--------|----------|-------|------|
| GET | `/shops` | Lấy danh sách shop | ✅ |
| GET | `/shops/:shopId` | Lấy chi tiết shop | ✅ |
| PATCH | `/shops/:shopId/status` | Cập nhật status | ✅ |
| PATCH | `/shops/:shopId/verify` | Xác minh shop | ✅ |

**GET /shops:**
- Query: `page`, `limit`, `status`, `keyword`
- Status values: `active|blocked|inactive`
- Return: shops[], pagination

**PATCH /shops/:shopId/status:**
- Body: `{ status: "active|blocked|inactive", reason?: "..." }`
- Set: `blockedAt`, `blockedReason` khi status=blocked

**PATCH /shops/:shopId/verify:**
- Body: `{}`
- Set: `verify=true`, `status=active`, `verifiedAt`, `verifiedBy`

---

## 3. User Management (Quản Lý User)

| Method | Endpoint | Mô Tả | Auth |
|--------|----------|-------|------|
| GET | `/users` | Lấy danh sách user | ✅ |
| GET | `/users/:userId` | Lấy chi tiết user | ✅ |
| PATCH | `/users/:userId/status` | Cập nhật status | ✅ |

**GET /users:**
- Query: `page`, `limit`, `status`, `keyword`
- Status values: `active|unban` (active), `inactive|ban` (inactive)
- Return: users[], pagination
- Field include: `isAdmin` (derived from roles)

**PATCH /users/:userId/status:**
- Body: `{ status: "active|inactive|ban|unban" }`
- Lỗi: Không thể ban admin hoặc chính mình (403)
- Status mapping:
  - `active`/`unban` → `active`
  - `inactive`/`ban` → `inactive`

---

## 4. Product Management (Kiểm Duyệt Sản Phẩm)

| Method | Endpoint | Mô Tả | Auth |
|--------|----------|-------|------|
| GET | `/products` | Lấy danh sách product | ✅ |
| PATCH | `/products/:id/status` | Cập nhật status duyệt | ✅ |
| DELETE | `/products/:id` | Xóa product | ✅ |

**GET /products:**
- Query: `page`, `limit`, `status`
- Status values: `pending|approved|rejected`
- Return: products[], pagination
- Include: categoryId (name, slug), product_shop (shop info)

**PATCH /products/:id/status:**
- Body: `{ status: "pending|approved|rejected", moderationNote?: "..." }`
- Set: `moderatedBy`, `moderatedAt`, `moderationNote`
- Status mapping:
  - `approved` → isPublished=true, isDraft=false
  - `rejected` → isPublished=false, isDraft=false
  - `pending` → isPublished=false, isDraft=true

**DELETE /products/:id:**
- Body: `{}`
- Return: `{ deleted: true, productId }`

---

## 5. Order Management (Quản Lý Đơn Hàng)

| Method | Endpoint | Mô Tả | Auth |
|--------|----------|-------|------|
| GET | `/orders` | Lấy danh sách order | ✅ |
| GET | `/orders/:id` | Lấy chi tiết order | ✅ |
| PATCH | `/orders/:id/status` | Cập nhật status | ✅ |

**GET /orders:**
- Query: `page`, `limit`, `status`
- Status values: `pending|confirmed|processing|shipped|delivered|cancelled`
- Return: orders[], pagination
- Include: userId, shopId, items (with productId populated)

**PATCH /orders/:id/status:**
- Body: `{ status: "pending|confirmed|processing|shipped|delivered|cancelled", note?: "..." }`
- Set: `notes` (nếu có note)
- Return: order info đầy đủ (populated)

---

## 6. Analytics (Thống Kê Hệ Thống)

| Method | Endpoint | Mô Tả | Auth |
|--------|----------|-------|------|
| GET | `/analytics/overview` | Lấy tổng hợp thống kê | ✅ |

**GET /analytics/overview:**
- Return:
  - `totalUsers`, `totalShops`, `totalOrders`
  - `totalRevenue` (sum finalPrice or totalPrice)
  - `ordersByStatus` (map: count, revenue by status)
  - `topSellingProducts` (top 5: productName, totalSold, totalRevenue)

---

## 7. Notifications (Gửi Thông Báo)

| Method | Endpoint | Mô Tả | Auth |
|--------|----------|-------|------|
| POST | `/notifications/send-bulk` | Gửi thông báo hàng loạt | ✅ |

**POST /notifications/send-bulk:**
- Body: `{ userIds[], title, body, type?, data? }`
- Type values: `promotion|system|custom|order|promo|test` (default: system)
- Return:
  - `requestedCount`, `successCount`, `failureCount`
  - `notifications[]` (created notifications)
  - `failedRecipients[]` (userId, message)

---

## HTTP Status Codes

| Code | Ý Nghĩa |
|------|---------|
| 200 | OK - Request thành công |
| 400 | Bad Request - Dữ liệu không hợp lệ |
| 401 | Unauthorized - Token không hợp lệ |
| 403 | Forbidden - Không có quyền truy cập |
| 404 | Not Found - Không tìm thấy tài nguyên |
| 409 | Conflict - Xung đột dữ liệu |
| 500 | Internal Server Error - Lỗi server |

---

## Common Patterns

### Pagination Response:
```json
{
  "total": 100,
  "page": 1,
  "limit": 10,
  "totalPages": 10,
  "hasNextPage": true,
  "hasPrevPage": false
}
```

### Error Response:
```json
{
  "code": 400,
  "message": "Error description",
  "status": "error"
}
```

### Success Response:
```json
{
  "code": 200,
  "message": "Success message",
  "metadata": { ... }
}
```

---

## 6. Analytics (Thống Kê)

| Method | Endpoint | Mô Tả | Auth |
|--------|----------|-------|------|
| GET | `/analytics/overview` | Lấy thống kê tổng quan | ✅ |

**Return:**
- `overview`: `{ totalUsers, totalShops, totalOrders, totalRevenue }`
- `ordersByStatus`: thống kê theo trạng thái
- `topSellingProducts`: 5 sản phẩm bán chạy nhất

---

## 7. Notifications (Thông Báo)

| Method | Endpoint | Mô Tả | Auth |
|--------|----------|-------|------|
| POST | `/notifications/send-bulk` | Gửi thông báo hàng loạt | ✅ |

**POST /notifications/send-bulk:**
- Body: `{ userIds: [], title: "", body: "", type: "", data?: {} }`
- `type`: `promotion|system|custom|order|promo|test`
- Return: `{ requestedCount, successCount, failureCount, notifications, failedRecipients }`

---

## Response Format

**Success Response:**
```json
{
  "code": 200,
  "message": "...",
  "metadata": { ... }
}
```

**Error Response:**
```json
{
  "code": 400|401|403|404|500,
  "message": "Error message"
}
```

---

## Common Query Params

**Pagination:**
- `page`: số trang (default: 1)
- `limit`: số item/trang (default: 10, max: 100)

**Response Pagination Object:**
```json
{
  "total": 100,
  "page": 1,
  "limit": 10,
  "totalPages": 10,
  "hasNextPage": true,
  "hasPrevPage": false
}
```

---

## Status Values

**Shop Status:**
- `active`: Hoạt động
- `blocked` / `inactive`: Bị chặn

**User Status:**
- `active`: Hoạt động (unban)
- `inactive`: Bị ban

**Product Status:**
- `pending`: Chờ duyệt
- `approved`: Phê duyệt
- `rejected`: Từ chối

**Order Status:**
- `pending`: Chờ xác nhận
- `confirmed`: Đã xác nhận
- `processing`: Đang xử lý
- `shipped`: Đã gửi
- `delivered`: Đã giao
- `cancelled`: Đã hủy

---

## Error Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## Example Curl Commands

### Login
```bash
curl -X POST http://localhost:3000/v1/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"account":"admin","password":"password"}'
```

### Get Profile
```bash
curl -X GET http://localhost:3000/v1/api/admin/profile \
  -H "Authorization: Bearer TOKEN"
```

### Get Shops
```bash
curl -X GET "http://localhost:3000/v1/api/admin/shops?page=1&limit=10&status=active" \
  -H "Authorization: Bearer TOKEN"
```

### Update Shop Status
```bash
curl -X PATCH http://localhost:3000/v1/api/admin/shops/SHOP_ID/status \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"blocked","reason":"Vi phạm điều khoản"}'
```

### Send Bulk Notifications
```bash
curl -X POST http://localhost:3000/v1/api/admin/notifications/send-bulk \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userIds":["USER_ID"],
    "title":"Khuyến mãi",
    "body":"Giảm 50%",
    "type":"promotion"
  }'
```

### `POST /v1/api/admin/notifications/send-bulk`
- Gửi thông báo đến nhiều user cùng lúc.
- Body:

```json
{
   "userIds": ["id1", "id2"],
   "title": "string",
   "body": "string",
   "type": "promotion | system | custom",
   "data": {}
}
```

- Hệ thống sẽ:
   - lưu bản ghi notification vào MongoDB
   - cố gắng gửi push FCM nếu môi trường hỗ trợ

---

## 8. Chuẩn Response

Tất cả API admin dùng format chuẩn:

```json
{
   "code": 200,
   "message": "...",
   "metadata": {}
}
```

Khi lỗi:

```json
{
   "code": 400,
   "message": "...",
   "metadata": null
}
```

---

## 9. Cơ chế phân quyền

- Admin login dùng JWT riêng.
- Middleware `verifyAdmin` sẽ:
   - đọc token từ `authorization`
   - kiểm tra token hợp lệ
   - đối chiếu user trong DB
   - xác nhận role `admin`
- Các API admin còn dùng `requireAdmin` / `requireAdminByClientId` ở những route cũ.

---

## 10. Ghi chú nhanh

- `src/auth/adminAuth.js` chứa middleware và helper token cho admin.
- `src/routes/admin/index.js` là router chính của module admin.
- `src/services/admin.*.service.js` là nơi xử lý nghiệp vụ.
- `src/controllers/admin.*.controller.js` là lớp bọc response.

## 11. Danh sách endpoint hiện có

- `POST /v1/api/admin/auth/login`
- `GET /v1/api/admin/profile`
- `GET /v1/api/admin/shops`
- `GET /v1/api/admin/shops/:shopId`
- `PATCH /v1/api/admin/shops/:shopId/status`
- `PATCH /v1/api/admin/shops/:shopId/verify`
- `GET /v1/api/admin/users`
- `GET /v1/api/admin/users/:userId`
- `PATCH /v1/api/admin/users/:userId/status`
- `GET /v1/api/admin/products`
- `PATCH /v1/api/admin/products/:id/status`
- `DELETE /v1/api/admin/products/:id`
- `GET /v1/api/admin/orders`
- `GET /v1/api/admin/orders/:id`
- `PATCH /v1/api/admin/orders/:id/status`
- `GET /v1/api/admin/analytics/overview`
- `POST /v1/api/admin/notifications/send-bulk`


### Category Management (4 endpoints)

| Method | Endpoint | Auth | Status | Notes |
|--------|----------|------|--------|-------|
| GET | `/v1/api/category` | No | ✅ Live | Get all categories (public) |
| GET | `/v1/api/category/:categoryId` | No | ✅ Live | Get category by ID (public) |
| GET | `/v1/api/category/slug/:slug` | No | ✅ Live | Get category by slug (public) |
| POST | `/v1/api/category` | Yes | ✅ Live | Create category (admin only) |
| PATCH | `/v1/api/category/:categoryId` | Yes | ✅ Live | Update category (admin only) |
| DELETE | `/v1/api/category/:categoryId` | Yes | ✅ Live | Delete category (admin only) |
| POST | `/v1/api/category/seed/default` | Yes | ✅ Live | Seed default categories (admin) |

**Admin Protection:** `requireAdminByClientId` middleware + `x-client-id` header

---

### Notification Management (1 endpoint + 2 user endpoints)

| Method | Endpoint | Auth | Status | Notes |
|--------|----------|------|--------|-------|
| POST | `/v1/api/notifications/send` | Yes | ✅ Live | Send notification (admin only) |
| POST | `/v1/api/fcm-token` | Yes | ✅ Live | Register FCM token (user) |
| DELETE | `/v1/api/fcm-token` | Yes | ✅ Live | Delete FCM token (user) |
| GET | `/v1/api/notifications/:userId` | Yes | ✅ Live | Get notifications (user) |
| PATCH | `/v1/api/notifications/:id/read` | Yes | ✅ Live | Mark as read (user) |
| PATCH | `/v1/api/notifications/:userId/read-all` | Yes | ✅ Live | Mark all as read (user) |

**Admin Protection:** `requireAdmin` middleware + authorization token

---

## 📋 Total Currently Implemented

- **Admin-Only Endpoints:** 5
  - Category: 4 (create, update, delete, seed)
  - Notification: 1 (send)

- **Public/User Endpoints:** 7
  - Category: 3 (get all, get by ID, get by slug)
  - Notification: 4 (register FCM, delete FCM, get notifications, mark as read)

- **Total Admin Features:** 2 modules
  - Category Management ✅
  - Notification Management ✅

---

## ⏳ Suggested (Not Yet Implemented)

### Shop Management (6-8 endpoints)

```
GET    /v1/api/admin/shops                      - List all shops
GET    /v1/api/admin/shops/:shopId              - Get shop detail
GET    /v1/api/admin/shops/:shopId/analytics    - Shop analytics
PATCH  /v1/api/admin/shops/:shopId/verify       - Verify shop
PATCH  /v1/api/admin/shops/:shopId/suspend      - Suspend shop
PATCH  /v1/api/admin/shops/:shopId/resume       - Resume shop
DELETE /v1/api/admin/shops/:shopId              - Delete shop
```

**Priority:** HIGH (Platform control)

---

### User Management (7 endpoints)

```
GET    /v1/api/admin/users                      - List all users
GET    /v1/api/admin/users/:userId              - Get user detail
GET    /v1/api/admin/users/:userId/orders       - User orders
GET    /v1/api/admin/users/:userId/activity     - User activity
PATCH  /v1/api/admin/users/:userId/ban          - Ban user
PATCH  /v1/api/admin/users/:userId/unban        - Unban user
DELETE /v1/api/admin/users/:userId              - Delete user
```

**Priority:** HIGH (Compliance & Support)

---

### Analytics & Dashboard (5-7 endpoints)

```
GET    /v1/api/admin/dashboard                  - Dashboard overview
GET    /v1/api/admin/analytics/sales            - Sales analytics
GET    /v1/api/admin/analytics/orders           - Order analytics
GET    /v1/api/admin/analytics/users            - User analytics
GET    /v1/api/admin/analytics/products         - Product analytics
GET    /v1/api/admin/analytics/shops            - Shop analytics
GET    /v1/api/admin/reports/revenue            - Revenue report
```

**Priority:** MEDIUM (Business Intelligence)

---

### Product Moderation (4 endpoints)

```
GET    /v1/api/admin/products                   - All products
GET    /v1/api/admin/products/:productId        - Product detail
PATCH  /v1/api/admin/products/:productId/flag   - Flag inappropriate
DELETE /v1/api/admin/products/:productId        - Remove product
```

**Priority:** MEDIUM (Content Control)

---

### Order Management (3-4 endpoints)

```
GET    /v1/api/admin/orders                     - All orders
GET    /v1/api/admin/orders/:orderId            - Order detail
PATCH  /v1/api/admin/orders/:orderId/refund     - Process refund
PATCH  /v1/api/admin/orders/:orderId/resolve    - Resolve dispute
```

**Priority:** MEDIUM (Support)

---

### Audit & System Logs (2-3 endpoints)

```
GET    /v1/api/admin/audit-logs                 - View audit logs
GET    /v1/api/admin/system-logs                - System logs
GET    /v1/api/admin/user-activity              - Track user activity
```

**Priority:** LOW (Compliance)

---

## 🔐 Authentication Methods

### Method 1: Admin by Client ID (Current)
```javascript
// Middleware: requireAdminByClientId
// Header: x-client-id: {adminUserId}
// Check: Is userId in ADMIN_USER_IDS?

const HARDCODED_ADMIN_USER_IDS = ['680f91f6f01b7d2a2fa9c001', ...];
```

**Usage:**
```bash
curl -H "x-client-id: 680f91f6f01b7d2a2fa9c001" \
     POST /v1/api/category
```

### Method 2: Admin by Token (Current)
```javascript
// Middleware: requireAdmin
// Header: authorization: {accessToken}
// Check: Is req.user.userId in ADMIN_USER_IDS?
```

**Usage:**
```bash
curl -H "authorization: {accessToken}" \
     POST /v1/api/notifications/send
```

### Method 3: Role-Based Access (Suggested)
```javascript
// Middleware: requireRole(ROLE_NAMES.SUPER_ADMIN)
// Header: authorization: {accessToken}
// Check: req.user.role === role

const ROLES = {
    SUPER_ADMIN: 'SUPER_ADMIN',      // Full access
    ADMIN: 'ADMIN',                  // Most features
    MODERATOR: 'MODERATOR',          // Content only
    ANALYST: 'ANALYST'               // Read-only analytics
};
```

---

## 📊 API Statistics

### Current State
- **Fully Implemented:** 2 modules (Category, Notification)
- **Partially Implemented:** 0 modules
- **Not Implemented:** 6 major feature areas
- **Admin Endpoints (Live):** 5
- **Total Admin Functionality:** ~5%

### Recommended Priority

#### Phase 1 (Week 1-2) - Foundation
- [ ] Shop Management (6-8 endpoints)
- [ ] Create Admin Dashboard
- [ ] Setup audit logging

#### Phase 2 (Week 2-3) - Core Features
- [ ] User Management (7 endpoints)
- [ ] Analytics Dashboard
- [ ] Basic Reports

#### Phase 3 (Week 4) - Enhancement
- [ ] Product Moderation
- [ ] Order Management
- [ ] Advanced Reporting

#### Phase 4 (Week 5+) - Polish
- [ ] RBAC system
- [ ] Bulk operations
- [ ] API for mobile admin app

---

## 🚀 Files Created/Modified

### New Documentation Files
1. **ADMIN_API_DOCUMENTATION.md** (This file)
   - Complete API reference for all admin endpoints
   - Authentication details
   - Examples and use cases
   - Error codes and responses

2. **ADMIN_MODULE_GUIDE.md**
   - Implementation guide for building admin features
   - Recommended architecture
   - Phase-by-phase implementation plan
   - File structure recommendations

---

## 📁 Current Admin Code Structure

### Controllers
- `src/controllers/category.controller.js` - 6 category methods
- `src/controllers/notification.controller.js` - 8 notification methods

### Services
- `src/services/category.service.js` - Category business logic
- `src/services/notification.service.js` - Notification business logic

### Models
- `src/models/category.model.js` - Category schema
- `src/models/notification.model.js` - Notification schema

### Auth/Middleware
- `src/auth/adminAuth.js` - Admin authentication middleware

### Routes
- `src/routes/category/index.js` - Category routes
- `src/routes/notification/index.js` - Notification routes

---

## 🎯 Quick Integration Checklist

- [x] Category management (basic CRUD)
- [x] Send notifications (admin to user)
- [ ] Shop management (list, verify, suspend)
- [ ] User management (list, ban, view history)
- [ ] Dashboard/Overview
- [ ] Sales analytics
- [ ] Order tracking (admin view)
- [ ] Audit logging
- [ ] User activity tracking
- [ ] Financial reports
- [ ] Role-based access control
- [ ] Bulk operations

---

## 💡 Recommendations

### Immediate Actions (Do Now)
1. **Add search/filter to categories**
   - `GET /v1/api/category?search=quần&isActive=true`

2. **Add pagination to category list**
   - `GET /v1/api/category?page=1&limit=20`

3. **Create admin dashboard endpoint**
   - `GET /v1/api/admin/dashboard`

4. **Implement shop listing**
   - `GET /v1/api/admin/shops`

### Short-term (Next 2 weeks)
1. Complete shop management APIs
2. Complete user management APIs
3. Create analytics dashboard
4. Implement audit logging

### Medium-term (Next month)
1. Product moderation system
2. Order management for admins
3. Advanced reporting
4. Role-based access control

### Long-term (Next 2 months)
1. Admin mobile app
2. Scheduled reports via email
3. Automated anomaly detection
4. Advanced analytics with AI

---

## 🔗 Related Documentation

- [ADMIN_API_DOCUMENTATION.md](ADMIN_API_DOCUMENTATION.md) - API reference
- [ADMIN_MODULE_GUIDE.md](ADMIN_MODULE_GUIDE.md) - Implementation guide
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - Main API docs
- [SHOP_MODULE_IMPLEMENTATION.md](SHOP_MODULE_IMPLEMENTATION.md) - Shop module

---

## 📞 Support

For more information:
- Admin authentication: See `src/auth/adminAuth.js`
- Category implementation: See `src/services/category.service.js`
- Notification implementation: See `src/services/notification.service.js`
- Examples: See curl examples in ADMIN_API_DOCUMENTATION.md

