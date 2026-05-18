# 📚 Bộ Tài Liệu Kỹ Thuật Hệ Thống E-Commerce BE-Learning

## 📌 Giới Thiệu

Đây là bộ tài liệu kỹ thuật toàn diện cho hệ thống E-Commerce BE-Learning, bao gồm sơ đồ, kiến trúc, cấu trúc database và API reference.

---

## 📁 Danh Sách Tài Liệu

### 1. **TECHNICAL_DOCUMENTATION.md** 📖
   **Nội dung chính:**
   - Sơ đồ UseCase tổng quát
   - Sơ đồ phân rã UseCase chi tiết:
     * Quản lý sản phẩm
     * Xử lý đơn hàng
     * Khuyến mãi & giảm giá
   - Sơ đồ tuần tự (Sequence Diagrams):
     * Luồng tạo đơn hàng
     * Luồng xác nhận đơn hàng
     * Luồng thanh toán giảm giá
     * Luồng đánh giá sản phẩm
     * Luồng phê duyệt sản phẩm
   - Sơ đồ kết nối Database (ERD)
   - Cấu trúc chi tiết 12 bảng:
     * USER, SHOP, PRODUCT, CATEGORY
     * ORDER, CART, INVENTORY, DISCOUNT
     * ADDRESS, NOTIFICATION, SEARCH_HISTORY, ADMIN

### 2. **ARCHITECTURE_DIAGRAMS.md** 📊
   **Nội dung chính:**
   - Biểu đồ UseCase (Mermaid)
   - Biểu đồ Chuỗi (Sequence Diagrams)
   - Class Diagram (Kiến Trúc OOP)
   - Biểu đồ Trạng Thái (State Diagrams):
     * Order Status Flow
     * Product Status Flow
     * Shop Status Flow
   - Component Diagram (Kiến Trúc Hệ Thống)
   - Data Flow Diagram (DFD)
   - Biểu Đồ Mối Quan Hệ Chi Tiết
   - Deployment Architecture

### 3. **API_ENDPOINTS_REFERENCE.md** 🔌
   **Nội dung chính:**
   - 11 phần API endpoints:
     1. Authentication & Access (Xác Thực)
     2. Product Management (Quản Lý Sản Phẩm)
     3. Cart Management (Quản Lý Giỏ Hàng)
     4. Order Management (Quản Lý Đơn Hàng)
     5. Discount & Promotions (Khuyến Mãi)
     6. Reviews & Ratings (Đánh Giá)
     7. Address Management (Quản Lý Địa Chỉ)
     8. Admin Management (Quản Trị)
     9. Notifications (Thông Báo)
     10. Shop Dashboard
     11. Category Management
   - Request/Response examples cho mỗi endpoint
   - Common response format
   - Authentication headers
   - Pagination guidelines

---

## 🎯 Hướng Dẫn Sử Dụng

### Cho Developers

1. **Bắt đầu dự án:**
   - Đọc [TECHNICAL_DOCUMENTATION.md](TECHNICAL_DOCUMENTATION.md) - Phần 1-2 để hiểu UseCase
   - Xem [ARCHITECTURE_DIAGRAMS.md](ARCHITECTURE_DIAGRAMS.md) - Các sơ đồ thành phần

2. **Phát triển API:**
   - Tham khảo [API_ENDPOINTS_REFERENCE.md](API_ENDPOINTS_REFERENCE.md)
   - Kiểm tra request/response format
   - Xem authentication requirements

3. **Làm việc với Database:**
   - Đọc [TECHNICAL_DOCUMENTATION.md](TECHNICAL_DOCUMENTATION.md) - Phần 5
   - Hiểu cấu trúc bảng và relationship
   - Tham khảo Mermaid ERD

### Cho Project Managers / Quản Lý

1. **Hiểu tổng quan hệ thống:**
   - Xem UseCase Diagram trong [TECHNICAL_DOCUMENTATION.md](TECHNICAL_DOCUMENTATION.md) - Phần 1
   - Xem Component Diagram trong [ARCHITECTURE_DIAGRAMS.md](ARCHITECTURE_DIAGRAMS.md)

2. **Theo dõi quy trình:**
   - Xem State Diagrams trong [ARCHITECTURE_DIAGRAMS.md](ARCHITECTURE_DIAGRAMS.md)
   - Hiểu flow của Order, Product, Shop

### Cho QA / Testing

1. **Kiểm tra API:**
   - Sử dụng [API_ENDPOINTS_REFERENCE.md](API_ENDPOINTS_REFERENCE.md)
   - Test tất cả endpoints với request/response examples
   - Kiểm tra authentication & authorization

2. **Kiểm tra Luồng:**
   - Xem Sequence Diagrams trong [TECHNICAL_DOCUMENTATION.md](TECHNICAL_DOCUMENTATION.md) - Phần 3
   - Kiểm tra từng bước trong luồng
   - Verify data consistency

---

## 🏗️ Kiến Trúc Hệ Thống

```
┌─────────────────────────────────────────────────────┐
│              CLIENT LAYER (Web/Mobile)              │
├─────────────────────────────────────────────────────┤
│              API LAYER (Express Routes)             │
│  • Auth • Product • Order • Cart • Shop • Admin     │
├─────────────────────────────────────────────────────┤
│            SERVICE LAYER (Business Logic)           │
│  • Access • Product • Order • Inventory • etc       │
├─────────────────────────────────────────────────────┤
│            DATA LAYER (MongoDB + Redis)             │
│  • Collections • Indexes • Relationships             │
└─────────────────────────────────────────────────────┘
```

---

## 📊 Thống Kê Hệ Thống

| Thành Phần | Số Lượng | Chi Tiết |
|-----------|---------|---------|
| **Bảng Database** | 12 | User, Shop, Product, Category, Order, Cart, Inventory, Discount, Address, Notification, SearchHistory, Admin |
| **Actors/Roles** | 4 | Public, User, Shop, Admin |
| **Use Cases** | 40+ | Browse, Purchase, Sell, Review, Manage, Moderate, Analyze |
| **API Endpoints** | 50+ | CRUD operations + Custom endpoints |
| **Sequence Diagrams** | 5 | Order creation, confirmation, discount, review, product approval |
| **Status Fields** | 8 | Order (6 states), Product (3 states), Shop (3 states) |

---

## 🔑 Key Features

### 👥 User (Người Mua)
- ✅ Browse & Search products
- ✅ Add to cart & Checkout
- ✅ Track orders
- ✅ Review products
- ✅ Manage addresses
- ✅ Receive notifications

### 🏪 Shop (Cửa Hàng)
- ✅ Create & Manage products
- ✅ Manage inventory
- ✅ Create discount codes
- ✅ Handle orders
- ✅ View analytics
- ✅ Reply to reviews

### 🔑 Admin (Quản Trị Viên)
- ✅ Moderate products
- ✅ Manage shops & users
- ✅ View analytics
- ✅ Send notifications
- ✅ Manage categories

---

## 💾 Database Overview

### MongoDB Collections (12)
1. **Users** - Người mua hàng
2. **Shops** - Cửa hàng bán hàng
3. **Products** - Sản phẩm (với variants)
4. **Categories** - Danh mục sản phẩm
5. **Orders** - Đơn hàng
6. **Carts** - Giỏ hàng
7. **Inventories** - Kho hàng
8. **Discounts** - Mã giảm giá
9. **Addresses** - Địa chỉ giao hàng
10. **Notifications** - Thông báo
11. **SearchHistories** - Lịch sử tìm kiếm
12. **Admins** - Quản trị viên

### Key Relationships
- **1:N** - User → Orders, Cart, Addresses
- **1:N** - Shop → Products, Orders, Inventories, Discounts
- **1:1** - Product ↔ Inventory
- **N:M** - Product ↔ Order (via items array)
- **N:M** - Discount ↔ User (via usersUsed array)

---

## 🔐 Security

### Authentication Methods
1. **JWT Tokens** - Access & Refresh tokens
2. **Role-based Access** - USER, SHOP, ADMIN
3. **Status Validation** - Active/Inactive/Blocked
4. **Ownership Verification** - Users access only their data

### Protected Routes
- Tất cả routes yêu cầu `Authorization: Bearer {token}`
- Shop routes yêu cầu `shopAuthenticationV2`
- Admin routes yêu cầu `verifyAdmin`

---

## 📈 Flow Diagrams

### Order Flow
```
User → Browse → Add to Cart → Checkout → Payment → Order Created
         ↓         ↓            ↓          ↓
       Search   Variants    Discount    Confirm
                           Apply       Receive
                                       ↓
                          Shop → Confirm → Process → Ship → Delivered
```

### Product Flow
```
Shop → Create (Draft) → Publish (Pending) → Admin Review → Approved
                                               ↓
                                            Rejected
                                             (Revise)
```

### Discount Flow
```
Shop → Create Code → Set Terms → Activate → Customers Use → Track Usage
```

---

## 🚀 Getting Started

### 1. Hiểu Hệ Thống (30 mins)
- [ ] Đọc [TECHNICAL_DOCUMENTATION.md](TECHNICAL_DOCUMENTATION.md) - Phần 1-2
- [ ] Xem Use Case Diagram
- [ ] Xem các Sequence Diagrams

### 2. Setup Database (1 hour)
- [ ] Tạo MongoDB connections
- [ ] Tạo collections theo [TECHNICAL_DOCUMENTATION.md](TECHNICAL_DOCUMENTATION.md) - Phần 5
- [ ] Setup indexes

### 3. Phát Triển APIs (2-3 hours)
- [ ] Implement authentication endpoints
- [ ] Implement product endpoints
- [ ] Implement order endpoints
- [ ] Reference [API_ENDPOINTS_REFERENCE.md](API_ENDPOINTS_REFERENCE.md)

### 4. Testing (1-2 hours)
- [ ] Test authentication flows
- [ ] Test order creation flow
- [ ] Test product approval flow
- [ ] Verify all Sequence Diagrams

---

## 📞 API Versions

**Current Version:** v1
```
Base URL: /v1/api/
Auth: Bearer token
Format: JSON
Pagination: ?page=1&limit=20
```

---

## 🔄 Status Enums

### Order Status
- `pending` → `confirmed` → `processing` → `shipped` → `delivered`
- `cancelled` (từ any state)

### Product Status
- `pending` → `approved` → `published`
- `rejected` (yêu cầu revise)

### Shop Status
- `inactive` → `active`
- `blocked` (từ active hoặc inactive)

### Inventory Status
- `in_stock` (> 10)
- `low_stock` (1-10)
- `out_of_stock` (0)

---

## 📋 Checklist Implementation

### Phase 1: Core Features
- [ ] Authentication (User, Shop, Admin)
- [ ] Product Management (CRUD + Variants)
- [ ] Product Approval (Admin Moderation)
- [ ] Cart Management
- [ ] Order Management
- [ ] Inventory Management

### Phase 2: Advanced Features
- [ ] Discount & Promo Codes
- [ ] Product Reviews
- [ ] Notifications
- [ ] Analytics Dashboard
- [ ] Search & Recommendations
- [ ] Address Management

### Phase 3: Optimization
- [ ] Caching (Redis)
- [ ] Database Indexing
- [ ] API Rate Limiting
- [ ] Error Handling
- [ ] Logging & Monitoring
- [ ] Performance Tuning

---

## 📞 Liên Hệ & Support

Để tìm hiểu thêm:
1. Tham khảo các file tài liệu chính
2. Xem Mermaid diagrams trên [Mermaid Live Editor](https://mermaid.live)
3. Kiểm tra existing API documentation files

---

## 📝 Document Index

| Tài Liệu | Mục Đích | Khán Giả |
|---------|---------|---------|
| TECHNICAL_DOCUMENTATION.md | Thiết kế & Cấu trúc | Developers, Architects |
| ARCHITECTURE_DIAGRAMS.md | Kiến trúc hệ thống | Developers, PMs |
| API_ENDPOINTS_REFERENCE.md | API spec & examples | Developers, QA |
| ADMIN_API_DOCUMENTATION.md | Admin endpoints | Developers |
| ADMIN_MODULE_GUIDE.md | Admin module guide | Developers |
| SHOP_API_DOCUMENTATION.md | Shop endpoints | Developers |
| SHOP_API_SUMMARY.md | Shop API summary | Everyone |
| PRODUCT_UPLOAD_GUIDE.md | Product upload guide | Shop users |
| REVIEWS_API.md | Review endpoints | Developers |

---

**Tạo Lần Cuối:** 18 Tháng 5, 2026  
**Phiên Bản:** 1.0.0  
**Status:** ✅ Complete

---

## 🎓 Learning Path

### Beginner (Bắt đầu)
1. Hiểu 4 actors: User, Shop, Admin, Public
2. Xem Use Case Diagram chính
3. Hiểu 12 bảng database
4. Biết 6 main flows

### Intermediate (Trung cấp)
1. Chi tiết từng Sequence Diagram
2. Hiểu State Transitions
3. Biết mối quan hệ N:M
4. Implement basic APIs

### Advanced (Nâng cao)
1. Optimize queries & indexing
2. Implement caching strategy
3. Handle edge cases
4. Monitoring & analytics

---

**Happy Coding! 🚀**
