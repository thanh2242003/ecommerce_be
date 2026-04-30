# ADMIN MODULE - IMPLEMENTATION GUIDE

## 📋 Table of Contents
1. [Current Implementation](#current-implementation)
2. [Architecture Overview](#architecture-overview)
3. [Current Admin Features](#current-admin-features)
4. [Recommended Implementation Plan](#recommended-implementation-plan)
5. [File Structure](#file-structure)
6. [Testing](#testing)

---

## Current Implementation

### ✅ What's Currently Implemented

#### 1. **Category Management** ✅
- Create categories (admin only)
- Read categories (public & admin)
- Update categories (admin only)
- Delete categories (admin only)
- Seed default categories
- Auto slug generation
- Duplicate name validation

**Files:**
- `src/auth/adminAuth.js` - Admin authentication
- `src/controllers/category.controller.js` - Category endpoints
- `src/routes/category/index.js` - Category routes
- `src/services/category.service.js` - Category business logic
- `src/models/category.model.js` - Category schema

#### 2. **Notification Management** ✅
- Send notifications (admin only)
- Register FCM tokens (for push notifications)
- Delete FCM tokens
- Get notifications by user (user endpoints)
- Mark as read (user endpoints)
- Get unread count (user endpoints)

**Files:**
- `src/controllers/notification.controller.js` - Notification endpoints
- `src/routes/notification/index.js` - Notification routes
- `src/services/notification.service.js` - Notification logic
- `src/models/notification.model.js` - Notification schema

### ❌ What's NOT Implemented

- Shop management (list, verify, block, analytics)
- User management (list, ban/unban, view history)
- Product moderation
- Order management (admin view)
- Financial reports
- System analytics/dashboard
- Role-based access control (RBAC)
- Audit logging
- Advanced search/filtering

---

## Architecture Overview

### Admin Authentication Flow

```
Request with x-client-id header
        ↓
Check if userId in ADMIN_USER_IDS
        ↓
If yes: Proceed (req.adminId set)
If no: Throw ForbiddenError
```

### Current Admin Routes

```
POST   /v1/api/category                      - Create
PATCH  /v1/api/category/:id                  - Update
DELETE /v1/api/category/:id                  - Delete
POST   /v1/api/category/seed/default         - Seed
POST   /v1/api/notifications/send            - Send notification
```

---

## Current Admin Features

### 1. Category Management

**Endpoints:**
```
POST   /v1/api/category
PATCH  /v1/api/category/:categoryId
DELETE /v1/api/category/:categoryId
POST   /v1/api/category/seed/default
```

**Features:**
- Create with auto slug
- Update all fields
- Delete categories
- Bulk seed default categories
- Duplicate prevention

**Implementation:**
- Very basic, no complex validation
- No pagination for list
- No filtering options
- No audit trail

### 2. Send Notifications

**Endpoint:**
```
POST   /v1/api/notifications/send
```

**Features:**
- Send to specific user
- Include custom data
- FCM token support (Firebase)
- Multiple notification types

**Limitations:**
- No bulk sending
- No scheduling
- No template support
- No targeting by user segments

---

## Recommended Implementation Plan

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

