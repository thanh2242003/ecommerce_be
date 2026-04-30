# TỔNG HỢP API ADMIN

## Phạm vi hiện tại

## 1. Xác thực Admin

### `POST /v1/api/admin/auth/login`
- Đăng nhập bằng `email` và `password`.
- Chỉ tài khoản có `roles` chứa `admin` mới được đăng nhập.
- Trả về `accessToken` và `refreshToken`.

### `GET /v1/api/admin/profile`
- Lấy thông tin admin hiện tại từ JWT.
- Middleware dùng: `verifyAdmin`.

---

## 2. Quản lý Shop

### `GET /v1/api/admin/shops`
- Lấy danh sách shop.
- Có phân trang.
- Lọc theo `status` (`active`, `blocked`).

### `GET /v1/api/admin/shops/:shopId`
- Lấy chi tiết shop theo ID.

### `PATCH /v1/api/admin/shops/:shopId/status`
- Cập nhật trạng thái shop.
- Giá trị hợp lệ: `active`, `blocked`.

### `PATCH /v1/api/admin/shops/:shopId/verify`
- Xác minh shop.
- Khi verify thành công, shop được đưa về `active`.

---

## 3. Quản lý User

### `GET /v1/api/admin/users`
- Lấy danh sách user.
- Có phân trang.
- Hỗ trợ lọc theo `status` và tìm kiếm theo `keyword`.

### `GET /v1/api/admin/users/:userId`
- Lấy chi tiết user.

### `PATCH /v1/api/admin/users/:userId/status`
- Ban / unban user.
- Không cho phép ban một tài khoản admin khác.

---

## 4. Kiểm duyệt Product

### `GET /v1/api/admin/products`
- Lấy danh sách sản phẩm.
- Có phân trang.
- Bao gồm cả sản phẩm chưa public.
- Có thể lọc theo trạng thái: `pending`, `approved`, `rejected`.

### `PATCH /v1/api/admin/products/:id/status`
- Duyệt hoặc từ chối sản phẩm.
- Cập nhật thêm metadata kiểm duyệt (`moderatedBy`, `moderatedAt`, `moderationNote`).

### `DELETE /v1/api/admin/products/:id`
- Xóa sản phẩm vi phạm / không phù hợp.

---

## 5. Quản lý Order

### `GET /v1/api/admin/orders`
- Lấy danh sách đơn hàng.
- Có phân trang.
- Lọc theo trạng thái.

### `GET /v1/api/admin/orders/:id`
- Lấy chi tiết đơn hàng.

### `PATCH /v1/api/admin/orders/:id/status`
- Admin có thể override trạng thái đơn hàng để xử lý tranh chấp.

---

## 6. Thống kê & Phân tích

### `GET /v1/api/admin/analytics/overview`
- Trả về:
   - `totalUsers`
   - `totalShops`
   - `totalOrders`
   - `totalRevenue`
   - `ordersByStatus`
   - `topSellingProducts` (top 5)

---

## 7. Thông báo hàng loạt

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

