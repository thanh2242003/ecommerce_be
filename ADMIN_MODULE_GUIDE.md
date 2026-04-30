# ADMIN MODULE - IMPLEMENTATION GUIDE

## 📋 Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Implemented Features](#implemented-features)
4. [File Structure](#file-structure)
5. [Code Explanation](#code-explanation)
6. [API Endpoints Summary](#api-endpoints-summary)
7. [Usage Examples](#usage-examples)
8. [Testing](#testing)
9. [Future Enhancements](#future-enhancements)

---

## Overview

Admin Module quản lý toàn bộ các tác vụ quản trị hệ thống bao gồm:
- ✅ Xác thực admin (login)
- ✅ Quản lý shops (verify, block, status)
- ✅ Quản lý users (ban/unban, view info)
- ✅ Kiểm duyệt products (approve, reject, delete)
- ✅ Quản lý orders (view, update status)
- ✅ Thống kê hệ thống (analytics overview)
- ✅ Gửi thông báo hàng loạt

---

## Architecture

### Authentication Flow

```
Request → verifyAdmin Middleware
         ↓
    Check JWT Token
         ↓
    Extract adminId & Admin Info
         ↓
    Set req.adminId, req.admin
         ↓
    Call Handler
```

### Middleware: verifyAdmin

**File:** `src/auth/adminAuth.js`

Kiểm tra:
1. JWT token hợp lệ
2. Token chưa hết hạn
3. Admin role được xác thực

---

## Implemented Features

### 1. ✅ Admin Authentication

**Mô Tả:** Đăng nhập admin và lấy JWT token

**Endpoints:**
- `POST /auth/login` - Đăng nhập
- `GET /profile` - Lấy profile admin

**Logic:**
```
Login: validate credentials → verify admin role → generate tokens
Profile: get admin info from JWT
```

**Response Include:**
- Admin basic info: `_id`, `name`, `account`, `status`, `roles`
- Tokens: `accessToken`, `refreshToken`

**Validation:**
- Account không trống
- Password không trống
- Account phải có role `admin`
- Account phải `active`

---

### 2. ✅ Shop Management

**Mô Tả:** Quản lý shops, verify, block/active

**Endpoints:**
```
GET    /shops                    - Danh sách
GET    /shops/:shopId            - Chi tiết
PATCH  /shops/:shopId/status     - Cập nhật status
PATCH  /shops/:shopId/verify     - Xác minh shop
```

**Features:**
- Lấy danh sách shops có phân trang
- Lọc theo status (`active`, `blocked`, `inactive`)
- Tìm kiếm theo `name` hoặc `email`
- Block shop với lý do
- Verify shop → `active` + `verify=true`

**Database Fields Updated:**
- `status`: Trạng thái shop
- `verify`: Đã xác minh?
- `blockedAt`: Thời gian bị block
- `blockedReason`: Lý do bị block
- `verifiedAt`: Thời gian xác minh
- `verifiedBy`: Admin ID xác minh

**Status Normalization:**
- `blocked` / `inactive` → `blocked`
- `active` → `active`

---

### 3. ✅ User Management

**Mô Tả:** Quản lý users, ban/unban

**Endpoints:**
```
GET    /users                   - Danh sách
GET    /users/:userId           - Chi tiết
PATCH  /users/:userId/status    - Cập nhật status
```

**Features:**
- Lấy danh sách users có phân trang
- Lọc theo status (`active`, `inactive`)
- Tìm kiếm theo `name` hoặc `email`
- Ban user (`inactive`)
- Unban user (`active`)

**Constraints:**
- Không thể ban admin khác
- Không thể ban chính mình
- Chỉ có thể ban normal users

**Response Include:**
- `isAdmin`: Flag cho biết user có phải admin không

---

### 4. ✅ Product Moderation

**Mô Tả:** Kiểm duyệt sản phẩm, approve/reject/delete

**Endpoints:**
```
GET    /products               - Danh sách sản phẩm
PATCH  /products/:id/status    - Cập nhật status duyệt
DELETE /products/:id           - Xóa sản phẩm
```

**Features:**
- Lấy tất cả sản phẩm (kể cả chưa public)
- Lọc theo status: `pending`, `approved`, `rejected`
- Approve product → `isPublished=true`, `isDraft=false`
- Reject product → `isPublished=false`, `isDraft=false`
- Delete product → xóa vĩnh viễn khỏi DB

**Moderation Metadata:**
- `status`: `pending`, `approved`, `rejected`
- `moderatedBy`: Admin ID duyệt
- `moderatedAt`: Thời gian duyệt
- `moderationNote`: Ghi chú duyệt
- `isPublished` / `isDraft`: Trạng thái công khai

---

### 5. ✅ Order Management

**Mô Tả:** Xem và quản lý đơn hàng

**Endpoints:**
```
GET    /orders              - Danh sách đơn hàng
GET    /orders/:id          - Chi tiết đơn hàng
PATCH  /orders/:id/status   - Cập nhật status
```

**Features:**
- Lấy danh sách orders có phân trang
- Lọc theo status: `pending`, `confirmed`, `processing`, `shipped`, `delivered`, `cancelled`
- View order details + user/shop/product info
- Update order status (handle disputes)

**Populate Info:**
- `userId`: User info (name, email, phone, avatar)
- `shopId`: Shop info (name, email, status, verify)
- `items[].productId`: Product info (title, images, price, type, status)

---

### 6. ✅ Analytics & Dashboard

**Mô Tả:** Thống kê và tổng quan hệ thống

**Endpoints:**
```
GET /analytics/overview    - Tổng quan thống kê
```

**Metrics Returned:**
```
overview:
  - totalUsers: Tổng user
  - totalShops: Tổng shops
  - totalOrders: Tổng orders
  - totalRevenue: Tổng doanh thu

ordersByStatus:
  - pending: { count, revenue }
  - confirmed: { count, revenue }
  - processing: { count, revenue }
  - shipped: { count, revenue }
  - delivered: { count, revenue }
  - cancelled: { count, revenue }

topSellingProducts: (Top 5)
  - productId
  - productName
  - productImage
  - totalSold
  - totalRevenue
```

**Aggregation Pipeline:**
- Sử dụng MongoDB aggregation cho hiệu suất cao
- Tính toán revenue từ `finalPrice` hoặc `totalPrice`
- Lookup product info để lấy image/name

---

### 7. ✅ Bulk Notifications

**Mô Tả:** Gửi thông báo tới nhiều users

**Endpoints:**
```
POST /notifications/send-bulk    - Gửi thông báo hàng loạt
```

**Features:**
- Gửi thông báo tới danh sách users
- Support push notifications (FCM)
- Return success/failure count
- Handle partial failures gracefully

**Notification Types:**
- `promotion`: Khuyến mãi
- `system`: Thông báo hệ thống
- `custom`: Tùy chỉnh
- `order`: Liên quan đơn hàng
- `promo`: Quảng cáo
- `test`: Test

**Input Validation:**
- `userIds`: Array không rỗng
- `title`: Không được trống
- `body`: Không được trống
- `type`: Từ danh sách hợp lệ

**Response:**
```
{
  requestedCount: Số user request,
  successCount: Số thành công,
  failureCount: Số thất bại,
  notifications: Array notification tạo,
  failedRecipients: Array lỗi chi tiết
}
```

---

## File Structure

```
src/
├── auth/
│   └── adminAuth.js                    # Admin authentication middleware
│
├── controllers/
│   ├── admin.auth.controller.js        # Login, profile endpoints
│   ├── admin.shop.controller.js        # Shop management endpoints
│   ├── admin.user.controller.js        # User management endpoints
│   ├── admin.product.controller.js     # Product moderation endpoints
│   ├── admin.order.controller.js       # Order management endpoints
│   ├── admin.analytics.controller.js   # Analytics endpoints
│   └── admin.notification.controller.js # Notification endpoints
│
├── services/
│   ├── admin.auth.service.js           # Auth business logic
│   ├── admin.shop.service.js           # Shop business logic
│   ├── admin.user.service.js           # User business logic
│   ├── admin.product.service.js        # Product business logic
│   ├── admin.order.service.js          # Order business logic
│   ├── admin.analytics.service.js      # Analytics logic
│   └── admin.notification.service.js   # Notification logic
│
├── routes/
│   └── admin/
│       └── index.js                     # Admin routes file
│
└── utils/
    ├── admin.validation.js              # Admin validation functions
    └── pagination.js                    # Pagination utilities
```

---

## Code Explanation

### 1. Admin Authentication (adminAuth.js)

**verifyAdmin Middleware:**
```javascript
const verifyAdmin = asyncHandler(async (req, res, next) => {
    // Extract token từ header
    // Verify JWT
    // Check admin role
    // Set req.adminId
})
```

**createAdminTokenPair:**
```javascript
// Generate JWT token + refresh token
// Include admin info: userId, account, roles
```

---

### 2. Service Pattern

**Example: AdminShopService.getShops**
```javascript
static async getShops(query = {}) {
    // Parse pagination
    // Build filters (status, keyword)
    // Query database
    // Format response
    // Return { shops, pagination }
}
```

**Normalization Functions:**
```javascript
normalizeShopStatus(status)    // blocked/inactive → blocked
normalizeUserStatus(status)    // ban/inactive → inactive
normalizeProductStatus(status) // pending/approved/rejected
normalizeOrderStatus(status)   // valid order statuses
```

---

### 3. Error Handling

**Custom Errors:**
- `BadRequestError`: Input validation failed
- `NotFoundError`: Resource not found
- `ForbiddenError`: Permission denied
- `AuthFailureError`: Authentication failed

**Example:**
```javascript
if (!Types.ObjectId.isValid(shopId)) {
    throw new BadRequestError('Invalid shop ID');
}
```

---

### 4. Pagination Implementation

**Pagination Params:**
```javascript
const { page, limit, skip } = parsePagination(query);
// Default: page=1, limit=10
// Max limit: 100
```

**Pagination Metadata:**
```javascript
{
  total: 100,
  page: 1,
  limit: 10,
  totalPages: 10,
  hasNextPage: true,
  hasPrevPage: false
}
```

---

### 5. Input Validation

**Admin Login Validation:**
```javascript
validateAdminLoginInput({ account, password })
// Check empty fields
// Check admin role
```

**Bulk Notification Validation:**
```javascript
validateBulkNotificationInput({ userIds, title, body, type })
// Check non-empty array
// Check required fields
// Validate type
```

---

## API Endpoints Summary

### Authentication (2 endpoints)
```
POST   /auth/login      - Login
GET    /profile         - Get profile
```

### Shop (4 endpoints)
```
GET    /shops           - List shops
GET    /shops/:id       - Get shop
PATCH  /shops/:id/status    - Update status
PATCH  /shops/:id/verify    - Verify shop
```

### User (3 endpoints)
```
GET    /users           - List users
GET    /users/:id       - Get user
PATCH  /users/:id/status    - Update status
```

### Product (3 endpoints)
```
GET    /products        - List products
PATCH  /products/:id/status  - Update status
DELETE /products/:id    - Delete product
```

### Order (3 endpoints)
```
GET    /orders          - List orders
GET    /orders/:id      - Get order
PATCH  /orders/:id/status   - Update status
```

### Analytics (1 endpoint)
```
GET    /analytics/overview  - Get overview
```

### Notifications (1 endpoint)
```
POST   /notifications/send-bulk  - Send bulk
```

**Total: 18 Admin Endpoints**

---

## Usage Examples

### 1. Admin Login
```bash
curl -X POST http://localhost:3000/v1/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"account":"admin","password":"password"}'
```

### 2. Get Shops List
```bash
curl -X GET "http://localhost:3000/v1/api/admin/shops?page=1&limit=10" \
  -H "Authorization: Bearer TOKEN"
```

### 3. Block Shop
```bash
curl -X PATCH http://localhost:3000/v1/api/admin/shops/SHOP_ID/status \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"blocked","reason":"Vi phạm điều khoản"}'
```

### 4. Approve Product
```bash
curl -X PATCH http://localhost:3000/v1/api/admin/products/PRODUCT_ID/status \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"approved","moderationNote":"OK"}'
```

### 5. Ban User
```bash
curl -X PATCH http://localhost:3000/v1/api/admin/users/USER_ID/status \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"inactive"}'
```

### 6. Send Bulk Notification
```bash
curl -X POST http://localhost:3000/v1/api/admin/notifications/send-bulk \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userIds":["USER_ID_1","USER_ID_2"],
    "title":"Khuyến mãi mới",
    "body":"Giảm 50% tất cả sản phẩm",
    "type":"promotion"
  }'
```

### 7. Get Analytics Overview
```bash
curl -X GET http://localhost:3000/v1/api/admin/analytics/overview \
  -H "Authorization: Bearer TOKEN"
```

---

## Testing

### Manual Testing with Postman

1. **Create Admin Account** (nếu chưa có)
2. **Login**: Get token
3. **Test Endpoints**: Sử dụng token cho requests
4. **Verify Responses**: Check format và data

### Testing Checklist

- [ ] Admin login works
- [ ] Profile retrieval works
- [ ] Shop list/detail/update works
- [ ] User list/detail/update works
- [ ] Product list/update/delete works
- [ ] Order list/detail/update works
- [ ] Analytics returns correct data
- [ ] Bulk notifications send successfully
- [ ] Pagination works correctly
- [ ] Filters work as expected
- [ ] Error handling is correct

---

## Future Enhancements

### 1. Advanced Reporting
- [ ] Custom date range reports
- [ ] Export to CSV/PDF
- [ ] Revenue breakdown by category
- [ ] Shop performance metrics

### 2. Role-Based Access Control (RBAC)
- [ ] Multiple admin roles
- [ ] Fine-grained permissions
- [ ] Action audit logging

### 3. Dashboard Features
- [ ] Real-time statistics
- [ ] Charts and graphs
- [ ] Notifications dashboard
- [ ] System health monitoring

### 4. Moderation Tools
- [ ] Batch approve/reject products
- [ ] Auto-moderation rules
- [ ] Content flagging system
- [ ] Appeal process

### 5. Content Management
- [ ] Promotional banners management
- [ ] Email templates
- [ ] SMS notifications
- [ ] Push notification templates

### 6. Security
- [ ] Admin login audit log
- [ ] IP whitelisting
- [ ] Two-factor authentication
- [ ] Rate limiting per admin

### 7. Performance
- [ ] Cache frequently accessed data
- [ ] Optimize aggregation queries
- [ ] Index critical fields
- [ ] Implement pagination efficiently

---

## Notes for Developers

1. **Always validate input** before processing
2. **Use proper error codes** for clarity
3. **Include pagination** in list endpoints
4. **Log admin actions** for audit trail
5. **Check permissions** before any modification
6. **Handle edge cases** (empty results, invalid IDs)
7. **Format responses** consistently
8. **Test error scenarios** thoroughly

---

## References

- `src/auth/adminAuth.js` - Authentication logic
- `src/utils/admin.validation.js` - Validation utilities
- `src/routes/admin/index.js` - Route definitions
- `src/services/admin.*.service.js` - Business logic
- MongoDB Documentation - Aggregation Pipeline
- JWT Best Practices - Token security

---

## Notes for Developers

1. **Always validate input** before processing
2. **Use proper error codes** for clarity
3. **Include pagination** in list endpoints
4. **Log admin actions** for audit trail
5. **Check permissions** before any modification
6. **Handle edge cases** (empty results, invalid IDs)
7. **Format responses** consistently
8. **Test error scenarios** thoroughly

---

## Known Limitations

1. **Rate Limiting**: No rate limiting currently implemented
2. **Audit Logging**: Admin actions not fully logged
3. **Bulk Operations**: No bulk approve/reject for products
4. **Scheduling**: No scheduled notifications/announcements
5. **Export**: No export functionality for reports

---

## Testing Endpoints

### 1. Using cURL

```bash
# Login
curl -X POST http://localhost:3000/v1/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"account":"admin","password":"password123"}'

# Get profile
curl -X GET http://localhost:3000/v1/api/admin/profile \
  -H "Authorization: Bearer YOUR_TOKEN"

# List shops
curl -X GET "http://localhost:3000/v1/api/admin/shops?page=1&limit=10&status=active" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Block a shop
curl -X PATCH http://localhost:3000/v1/api/admin/shops/SHOP_ID/status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"blocked","reason":"Vi phạm điều khoản"}'
```

### 2. Using Postman

1. Import admin routes from Postman collection
2. Set environment variables: `BASE_URL`, `TOKEN`
3. Test each endpoint individually
4. Verify response format and data

### 3. Testing Checklist

- [ ] Login returns tokens
- [ ] Profile endpoint requires authentication
- [ ] Shop list pagination works
- [ ] Shop filters work (status, keyword)
- [ ] Shop verify sets correct fields
- [ ] User ban/unban works
- [ ] Cannot ban admin
- [ ] Cannot ban yourself
- [ ] Product moderation sets flags
- [ ] Order status updates work
- [ ] Analytics returns aggregated data
- [ ] Bulk notifications handles partial failures
- [ ] Error responses have correct codes
- [ ] Unauthorized requests return 401

---

## Troubleshooting

### Issue: "Admin not found" error on login

**Solution:** Check if admin account exists in database with `active` status

### Issue: "Admin permission required" on profile

**Solution:** Ensure JWT token includes admin role, check `verifyAdmin` middleware

### Issue: Pagination not working

**Solution:** Verify `page` and `limit` params are numbers, check `parsePagination` utility

### Issue: Search/filter not returning results

**Solution:** Check regex patterns, ensure keyword is trimmed, verify filter logic

### Issue: Bulk notifications partial failures

**Solution:** Check `failedRecipients` array in response, retry failed recipients

---

## Performance Optimization Tips

1. **Use indexes** on frequently filtered fields:
   - `shops.status`, `shops.email`
   - `users.status`, `users.email`
   - `products.status`
   - `orders.status`

2. **Optimize MongoDB queries**:
   - Use `lean()` for read-only queries
   - Limit fields in projection
   - Use aggregation pipeline for complex operations

3. **Add caching** for:
   - Analytics overview (invalidate hourly)
   - Top-selling products (invalidate daily)

4. **Implement batch operations** for:
   - Bulk product status changes
   - Bulk user status changes

---

## Security Best Practices

1. **Always validate** JWT tokens
2. **Check admin role** in middleware
3. **Sanitize input** before database queries
4. **Use parameterized queries** (Mongoose does this)
5. **Implement rate limiting** for sensitive endpoints
6. **Log all admin actions** for audit trail
7. **Use HTTPS** in production
8. **Implement CORS** properly
9. **Validate file uploads** if applicable
10. **Set secure JWT expiry** times

### Phase 1: Foundation (Weeks 1-2)

**Goal:** Establish solid admin infrastructure

#### 1.1 Create Admin Dashboard Service
```
src/services/admin.dashboard.service.js
```

**Methods:**
- `getOverviewStats()` - Platform stats
- `getSalesData()` - Revenue data
- `getOrderStats()` - Order statistics
- `getUserStats()` - User statistics

#### 1.2 Create Admin Controllers
```
src/controllers/admin.dashboard.controller.js
src/controllers/admin.shop.controller.js
src/controllers/admin.user.controller.js
```

#### 1.3 Create Admin Routes
```
src/routes/admin/
├── index.js
├── dashboard.js
├── shop.js
├── user.js
└── product.js
```

#### 1.4 Enhance Admin Auth
```javascript
// Extend adminAuth.js with role-based checks
const ADMIN_ROLES = {
    SUPER_ADMIN: 'SUPER_ADMIN',
    MODERATOR: 'MODERATOR',
    ANALYST: 'ANALYST'
};
```

### Phase 2: Shop Management (Week 2-3)

**Goal:** Full shop management for admins

#### 2.1 Create Admin Shop Service
```
src/services/admin.shop.service.js
```

**Methods:**
- `getAllShops(query)` - List shops with filters
- `getShopById(shopId)` - Get shop detail
- `getShopAnalytics(shopId)` - Shop performance
- `verifyShop(shopId)` - Mark as verified
- `suspendShop(shopId, reason)` - Suspend shop
- `resumeShop(shopId)` - Resume shop
- `deleteShop(shopId, hardDelete?)` - Delete shop

#### 2.2 Create Admin Shop Controller
```
src/controllers/admin.shop.controller.js
```

**Endpoints:**
```
GET    /v1/api/admin/shops                  - List all
GET    /v1/api/admin/shops/:shopId          - Get detail
GET    /v1/api/admin/shops/:shopId/analytics - Analytics
PATCH  /v1/api/admin/shops/:shopId/verify   - Verify
PATCH  /v1/api/admin/shops/:shopId/suspend  - Suspend
DELETE /v1/api/admin/shops/:shopId          - Delete
```

#### 2.3 Update Shop Model
```javascript
// Add admin tracking fields
{
    ...
    isVerified: Boolean,        // Admin verified
    status: enum['active', 'suspended', 'banned'],
    verifiedAt: Date,
    verifiedBy: ObjectId (ref: Admin),
    suspensionReason: String,
    suspendedAt: Date,
    analytics: {
        totalOrders: Number,
        totalRevenue: Number,
        averageRating: Number
    }
}
```

### Phase 3: User Management (Week 3-4)

**Goal:** Full user management

#### 3.1 Create Admin User Service
```
src/services/admin.user.service.js
```

**Methods:**
- `getAllUsers(query)` - List users
- `getUserById(userId)` - Get detail
- `getUserOrders(userId)` - User orders
- `getUserActivity(userId)` - User activity log
- `banUser(userId, reason)` - Ban user
- `unbanUser(userId)` - Unban user
- `deleteUser(userId, hardDelete?)` - Delete user

#### 3.2 Endpoints
```
GET    /v1/api/admin/users                  - List
GET    /v1/api/admin/users/:userId          - Detail
GET    /v1/api/admin/users/:userId/orders   - Orders
GET    /v1/api/admin/users/:userId/activity - Activity
PATCH  /v1/api/admin/users/:userId/ban      - Ban
PATCH  /v1/api/admin/users/:userId/unban    - Unban
DELETE /v1/api/admin/users/:userId          - Delete
```

### Phase 4: Advanced Features (Week 4-5)

#### 4.1 Admin Dashboard
```
GET /v1/api/admin/dashboard
```

Returns:
```json
{
  "overview": {
    "totalUsers": 1000,
    "totalShops": 50,
    "totalProducts": 5000,
    "totalOrders": 10000,
    "totalRevenue": 1000000000
  },
  "recentOrders": [...],
  "topShops": [...],
  "topProducts": [...],
  "chartData": {...}
}
```

#### 4.2 Analytics Endpoints
```
GET /v1/api/admin/analytics/sales
GET /v1/api/admin/analytics/users
GET /v1/api/admin/analytics/products
GET /v1/api/admin/analytics/shops
```

#### 4.3 Reports Endpoints
```
GET /v1/api/admin/reports/revenue
GET /v1/api/admin/reports/refunds
GET /v1/api/admin/reports/export
```

#### 4.4 Audit Logging
```
src/models/auditLog.model.js
src/services/admin.audit.service.js

Log all admin actions:
- Who did it
- What they did
- When
- Result
```

---

## File Structure

### Current Structure
```
src/
├── auth/
│   └── adminAuth.js                    (Admin middleware)
├── controllers/
│   ├── category.controller.js          (Admin + public)
│   └── notification.controller.js      (Admin + user)
├── services/
│   └── category.service.js
│   └── notification.service.js
└── routes/
    └── category/
        └── index.js
```

### Recommended Structure (Full Implementation)
```
src/
├── auth/
│   ├── adminAuth.js                    (Updated with RBAC)
│   └── adminAuthMiddleware.js          (New)
│
├── controllers/
│   ├── admin/
│   │   ├── dashboard.controller.js     (NEW)
│   │   ├── shop.controller.js          (NEW)
│   │   ├── user.controller.js          (NEW)
│   │   ├── product.controller.js       (NEW)
│   │   ├── order.controller.js         (NEW)
│   │   ├── analytics.controller.js     (NEW)
│   │   └── audit.controller.js         (NEW)
│   └── category.controller.js          (Existing)
│
├── services/
│   ├── admin/
│   │   ├── dashboard.service.js        (NEW)
│   │   ├── shop.service.js             (NEW)
│   │   ├── user.service.js             (NEW)
│   │   ├── product.service.js          (NEW)
│   │   ├── analytics.service.js        (NEW)
│   │   ├── audit.service.js            (NEW)
│   │   └── report.service.js           (NEW)
│   └── category.service.js             (Existing)
│
├── models/
│   ├── auditLog.model.js               (NEW)
│   └── category.model.js               (Updated)
│
├── routes/
│   ├── admin/
│   │   ├── index.js                    (NEW)
│   │   ├── dashboard.js                (NEW)
│   │   ├── shop.js                     (NEW)
│   │   ├── user.js                     (NEW)
│   │   ├── analytics.js                (NEW)
│   │   └── reports.js                  (NEW)
│   └── category/
│       └── index.js                    (Existing)
│
└── utils/
    ├── adminValidation.js              (NEW)
    └── reportGenerator.js              (NEW)
```

---

## Testing

### 1. Test Category Admin Endpoints

```bash
# Create category
curl -X POST http://localhost:3000/v1/api/category \
  -H "x-client-id: 680f91f6f01b7d2a2fa9c001" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Category"}'

# Get all categories
curl http://localhost:3000/v1/api/category

# Update category
curl -X PATCH http://localhost:3000/v1/api/category/{categoryId} \
  -H "x-client-id: 680f91f6f01b7d2a2fa9c001" \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated"}'

# Delete category
curl -X DELETE http://localhost:3000/v1/api/category/{categoryId} \
  -H "x-client-id: 680f91f6f01b7d2a2fa9c001"
```

### 2. Test Admin Auth

```bash
# Without admin ID (should fail)
curl -X POST http://localhost:3000/v1/api/category \
  -H "x-client-id: regular_user_id" \
  -d '{"name": "..."}'
# Result: 403 Forbidden - Admin permission required

# With correct admin ID (should succeed)
curl -X POST http://localhost:3000/v1/api/category \
  -H "x-client-id: 680f91f6f01b7d2a2fa9c001" \
  -d '{"name": "..."}'
# Result: 201 Created
```

### 3. Test Send Notification

```bash
curl -X POST http://localhost:3000/v1/api/notifications/send \
  -H "x-client-id: 680f91f6f01b7d2a2fa9c001" \
  -H "authorization: {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_id",
    "title": "Test",
    "body": "Test notification",
    "type": "system"
  }'
```

---

## 🎯 Quick Wins (Easy to Implement Now)

### 1. Add Pagination to Category List
```javascript
// Get all categories with pagination
GET /v1/api/category?page=1&limit=20
```

### 2. Add Search/Filter
```javascript
// Search categories
GET /v1/api/category?search=quần&isActive=true
```

### 3. Add Sorting
```javascript
// Sort categories
GET /v1/api/category?sort=-createdAt
```

### 4. Audit Trail for Categories
- Log who created/modified each category
- Track change history

### 5. Bulk Notifications
- Send notification to multiple users at once
- Send to specific user segments

---

## 🔐 Security Best Practices

1. **Always verify admin status**
   ```javascript
   router.use(requireAdminByClientId);
   ```

2. **Log all admin actions**
   ```javascript
   await AuditLog.create({
       adminId, action, resource, timestamp
   });
   ```

3. **Validate all inputs**
   ```javascript
   validateAdminInput(data);
   ```

4. **Rate limit admin endpoints**
   ```javascript
   router.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
   ```

5. **Encrypt sensitive data**
   - Admin notes/reasons (for bans, etc.)
   - Financial data

---

## 📊 Monitoring & Metrics

Track:
- Admin login frequency
- API usage by admin
- Most common admin actions
- Failed admin actions
- Time spent in admin panel

---

## Notes

- Current implementation is minimal
- Focus on category and notification management only
- Need comprehensive shop/user management
- RBAC would improve security
- Audit logging is essential for compliance
- Consider admin activity dashboard
- Implement rate limiting for admin endpoints

