# SHOP API - QUICK REFERENCE GUIDE

## 📋 Overview

Shop API provides authentication, status management, order handling, and analytics for e-commerce shop owners.

---

## 🔐 Authentication & Authorization

### Shop Status States
| Status | Can Access API? | Description |
|--------|-----------------|-------------|
| `active` | ✅ Yes | Shop verified and operational |
| `inactive` | ❌ No | Pending admin verification |
| `blocked` | ❌ No | Blocked by admin with reason |

### Required Headers (Protected Routes)
```
x-client-id: {userId from login}
authorization: {accessToken from login}
```

---

## 📊 API Endpoints

### Public Routes (No Auth Required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/shop/signin` | Shop login |
| POST | `/shop/signup` | Shop registration |

### Protected Routes (Auth Required)

**Shop Status:**
| GET | `/shop/status` | Get account status & verification info |

**Orders:**
| GET | `/shop/orders` | Get all orders (paginated, filtered) |
| GET | `/shop/orders/:id` | Get order detail |
| PATCH | `/shop/orders/:id/status` | Update order status |

**Dashboard:**
| GET | `/shop/dashboard` | Get dashboard metrics and analytics |

---

## ✨ Key Features

✅ **Shop Status System** - Three-state status (active/inactive/blocked) controls API access  
✅ **Authentication** - Shop signin/signup with JWT tokens and status validation  
✅ **Order Management** - View, filter, and update orders with pagination  
✅ **Status Validation** - Enforce valid order status transitions  
✅ **Dashboard Analytics** - Revenue, order stats, top products, inventory alerts  
✅ **Status Endpoint** - Check shop verification and blocked status  
✅ **Granular Errors** - Different messages for inactive vs blocked status  
✅ **Ownership Verification** - Shop can only access own data  
✅ **Response Standardization** - Consistent format across all endpoints  
✅ **Clean Architecture** - Routes → Controllers → Services → Models

---

## 📁 Implementation Files

### Routes
- `src/routes/shop/index.js` - All shop endpoints (signin, signup, orders, dashboard, status)

### Controllers
- `src/controllers/access.controller.js` - Shop login/registration
- `src/controllers/shop.order.controller.js` - Order endpoints
- `src/controllers/shop.dashboard.controller.js` - Dashboard & status endpoints

### Services
- `src/services/access.service.js` - Auth logic with shop status validation
- `src/services/shop.order.service.js` - Order management logic
- `src/services/shop.dashboard.service.js` - Dashboard analytics

### Authentication & Validation
- `src/auth/shopAuth.js` - Shop authentication middleware (validates shop status)
- `src/utils/shop.validation.js` - Status validation helpers (validateShopStatus, formatShopStatusInfo)

### Models
- `src/models/shop.model.js` - Shop schema with status enum (active/inactive/blocked)

---

## 📝 Response Format

### Success Response (200/201)
```json
{
  "code": 200,
  "message": "Operation description",
  "metadata": { /* response data */ }
}
```

### Error Response (400/401/403/404)
```json
{
  "code": 400,
  "message": "Error description",
  "metadata": null
}
```

---

## 🚀 Quick Start

### 1. Sign Up
```bash
POST /v1/api/shop/signup
{
  "name": "My Shop",
  "email": "shop@example.com",
  "password": "SecurePassword123!"
}
```

### 2. Wait for Admin Verification
(Status remains `inactive` until admin verifies)

### 3. Sign In
```bash
POST /v1/api/shop/signin
{
  "email": "shop@example.com",
  "password": "SecurePassword123!"
}
```
Response includes `accessToken` and `refreshToken`

### 4. Access Protected Routes
```bash
GET /v1/api/shop/orders
Headers:
  x-client-id: {userId}
  authorization: {accessToken}
```

### 5. Check Status
```bash
GET /v1/api/shop/status
Headers:
  x-client-id: {userId}
  authorization: {accessToken}
```

---

## ❌ Common Error Scenarios

| Scenario | HTTP Code | Message |
|----------|-----------|---------|
| Missing auth headers | 401 | Invalid request - missing client ID |
| Shop email not found | 400 | Error: Shop not found |
| Wrong password | 401 | Error: Invalid password |
| Shop pending verification | 403 | Shop account is pending verification by admin |
| Shop is blocked | 403 | Shop account has been blocked. Reason: ... |
| Order not found | 404 | Order not found |
| Invalid status transition | 400 | Invalid status transition |

---

## 🔄 Order Status Workflow

Valid transitions:
```
pending → confirmed → processing → shipped → delivered
                                              ↓
————————————— cancelled ←———————————————————————
```

---

## 📚 Documentation

- **SHOP_API_DOCUMENTATION.md** - Complete API reference with all details and examples
- **SHOP_API_SUMMARY.md** - This file (quick reference)

---

**Base URL:** `http://localhost:3000/v1/api`  
**Version:** 2.0.0 (Shop Status System implemented)  
**Last Updated:** April 30, 2026

