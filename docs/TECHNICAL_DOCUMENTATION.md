# 📚 Tài Liệu Kỹ Thuật: Hệ Thống E-Commerce BE-Learning

## 📑 Mục Lục
1. [Sơ Đồ UseCase Tổng Quát](#1-sơ-đồ-usecase-tổng-quát)
2. [Sơ Đồ Phân Rã UseCase](#2-sơ-đồ-phân-rã-usecase)
3. [Sơ Đồ Tuần Tự (Sequence Diagram)](#3-sơ-đồ-tuần-tự)
4. [Sơ Đồ Kết Nối Database (ERD)](#4-sơ-đồ-kết-nối-database)
5. [Cấu Trúc Chi Tiết Các Bảng](#5-cấu-trúc-chi-tiết-các-bảng)

---

## 1. Sơ Đồ UseCase Tổng Quát

Hệ thống E-Commerce BE-Learning có 4 nhóm người dùng chính với các chức năng riêng:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                               │
│                    HỆỆM THỐNG E-COMMERCE BE-LEARNING                        │
│                                                                               │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                          PUBLIC (No Auth)                              │ │
│  │  • Xem danh sách sản phẩm                                              │ │
│  │  • Tìm kiếm sản phẩm                                                   │ │
│  │  • Xem chi tiết sản phẩm & review                                      │ │
│  │  • Đăng ký/Đăng nhập (User & Shop)                                    │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                        USER (Người Mua)                                │ │
│  │  • Quản lý tài khoản & địa chỉ                                         │ │
│  │  • Thêm sản phẩm vào giỏ hàng                                          │ │
│  │  • Thanh toán (Checkout)                                               │ │
│  │  • Quản lý đơn hàng (xem, hủy)                                         │ │
│  │  • Đánh giá sản phẩm (Review)                                          │ │
│  │  • Nhận thông báo                                                      │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                       SHOP (Cửa Hàng)                                  │ │
│  │  • Quản lý danh mục & sản phẩm                                         │ │
│  │  • Quản lý kho hàng (Inventory)                                        │ │
│  │  • Tạo khuyến mãi & mã giảm giá                                        │ │
│  │  • Quản lý đơn hàng (xác nhận, giao, hủy)                              │ │
│  │  • Xem dashboard & analytics                                          │ │
│  │  • Trả lời review khách hàng                                           │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                       ADMIN (Quản Trị Viên)                            │ │
│  │  • Quản lý danh mục sản phẩm                                           │ │
│  │  • Phê duyệt/Từ chối sản phẩm                                          │ │
│  │  • Quản lý cửa hàng (kích hoạt, khóa)                                  │ │
│  │  • Quản lý người dùng & cửa hàng                                       │ │
│  │  • Xem báo cáo analytics                                               │ │
│  │  • Gửi thông báo hàng loạt                                             │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Sơ Đồ Phân Rã UseCase

### 2.1 UseCase: Quản Lý Sản Phẩm

```
                              ┌─────────────────────┐
                              │    SHOP (Cửa Hàng)  │
                              └──────────┬──────────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
                    ▼                    ▼                    ▼
            ┌──────────────┐     ┌──────────────┐    ┌──────────────┐
            │ Tạo Sản Phẩm │     │ Cập Nhật SP  │    │ Xóa Sản Phẩm │
            │ (DRAFT)      │     │              │    │              │
            └──────────────┘     └──────────────┘    └──────────────┘
                    │                    │                    │
                    ▼                    ▼                    ▼
         ┌─────────────────────────────────────────────────────────┐
         │        Xác Thực & Kiểm Tra Dữ Liệu                       │
         │ • Kiểm tra category, images, variants, price            │
         │ • Tạo slug tự động                                      │
         │ • Lưu trữ hình ảnh trên Cloudinary                      │
         └─────────────────────────────────────────────────────────┘
                    │
                    ▼
         ┌─────────────────────────────────────────────────────────┐
         │      Lưu Trữ Trong Database                             │
         │ • Product (title, price, variants, status=pending)      │
         │ • Inventory (tạo record mới)                            │
         └─────────────────────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
    ┌─────────────┐        ┌──────────────┐
    │ Lưu DRAFT   │        │ PUBLISH      │
    │ (Chờ phê    │        │ (Hiển thị)   │
    │ duyệt)      │        │ (Chờ Admin)  │
    └─────────────┘        └──────────────┘
```

### 2.2 UseCase: Xử Lý Đơn Hàng

```
                      ┌──────────────────────────┐
                      │  USER (Người Mua)        │
                      └────────────┬─────────────┘
                                   │
                    ┌──────────────┐│┌──────────────┐
                    ▼              │└──────────────┐▼
            ┌────────────────┐     │         ┌────────────────┐
            │ Tạo Đơn Hàng   │     │         │ Hủy Đơn Hàng   │
            │ (From Cart)    │     │         │                │
            └────────────────┘     │         └────────────────┘
                    │              │                 │
                    ▼              │                 ▼
         ┌──────────────────────┐  │     ┌──────────────────────┐
         │ Kiểm tra Stock       │  │     │ Kiểm tra Status      │
         │ Áp dụng Discount     │  │     │ (pending -> cancel)  │
         │ Tính finalPrice      │  │     └──────────────────────┘
         └──────────────────────┘  │                 │
                    │              │                 ▼
                    ▼              │     ┌──────────────────────┐
         ┌──────────────────────┐  │     │ Cập Nhật:            │
         │ Tạo Order Record     │  │     │ • Order.cancelReason │
         │ • status=pending     │  │     │ • Order.cancelledAt  │
         │ • Snapshot giá       │  │     │ • Order.cancelledBy  │
         │ • Trừ stock         │  │     │ • Tăng stock lại     │
         └──────────────────────┘  │     └──────────────────────┘
                    │              │
                    ▼              ▼
         ┌──────────────────────────────────┐
         │    SHOP (Cửa Hàng)               │
         │  • Xem đơn (pending)             │
         │  • Xác nhận (confirmed)          │
         │  • Xử lý (processing)            │
         │  • Vận chuyển (shipped)          │
         │  • Giao hàng (delivered)         │
         │  • Hủy (cancelled)               │
         └──────────────────────────────────┘
```

### 2.3 UseCase: Khuyến Mãi & Giảm Giá

```
                   ┌──────────────────────┐
                   │  SHOP (Cửa Hàng)     │
                   └──────────┬───────────┘
                              │
                 ┌────────────┴────────────┐
                 ▼                         ▼
        ┌──────────────────┐      ┌──────────────────┐
        │ Tạo Mã Giảm Giá  │      │ Quản Lý Kho Hàng │
        │ (Discount Code)  │      │ (Inventory)      │
        └──────────────────┘      └──────────────────┘
                 │                         │
                 ▼                         ▼
        ┌──────────────────┐      ┌──────────────────┐
        │ • Code (unique)  │      │ • Tổng số (total)│
        │ • Type (% / fixed)       │ • Location       │
        │ • Value          │      │ • Reserved qty   │
        │ • Thời hạn       │      │ • Status (in/low │
        │ • Min Order      │      │   /out)          │
        │ • Max Uses       │      └──────────────────┘
        │ • Áp dụng cho    │
        │   (all/specific) │
        └──────────────────┘
```

---

## 3. Sơ Đồ Tuần Tự (Sequence Diagram)

### 3.1 Luồng: Người Dùng Tạo Đơn Hàng

```
User                  Client          Server          Database
│                       │               │                 │
│ 1. Click Checkout     │               │                 │
├──────────────────────>│               │                 │
│                       │ 2. POST       │                 │
│                       │ /checkout     │                 │
│                       ├──────────────>│                 │
│                       │               │ 3. Kiểm tra     │
│                       │               │ stock & discount│
│                       │               ├────────────────>│
│                       │               │<────────────────┤
│                       │               │ 4. Trả về dữ    │
│                       │               │ liệu (giá, gift)│
│                       │               │                 │
│                       │               │ 5. Tạo Order    │
│                       │               │ + CartItems     │
│                       │               ├────────────────>│
│                       │               │<────────────────┤
│                       │               │ 6. Trừ stock    │
│                       │               │ (Inventory)     │
│                       │               ├────────────────>│
│                       │               │<────────────────┤
│                       │               │                 │
│                       │ 200 OK        │                 │
│                       │ Order ID      │                 │
│                       │<──────────────┤                 │
│<──────────────────────┤               │                 │
│ 7. Hiển thị chi tiết  │               │                 │
│ đơn hàng              │               │                 │
```

### 3.2 Luồng: Shop Phê Duyệt Đơn Hàng

```
Shop              Client          Server          Database
│                   │               │                 │
│ 1. View Orders    │               │                 │
├──────────────────>│               │                 │
│                   │ 2. GET        │                 │
│                   │ /shop/orders  │                 │
│                   ├──────────────>│                 │
│                   │               │ 3. Kiểm tra     │
│                   │               │ shopId & status │
│                   │               ├────────────────>│
│                   │               │<────────────────┤
│                   │               │ Trả orders list │
│                   │ 200 OK        │                 │
│                   │<──────────────┤                 │
│<──────────────────┤               │                 │
│ 4. Chọn confirm   │               │                 │
├──────────────────>│               │                 │
│                   │ 5. PATCH      │                 │
│                   │ /shop/        │                 │
│                   │ orders/       │                 │
│                   │ {id}/status   │                 │
│                   ├──────────────>│                 │
│                   │               │ 6. Update       │
│                   │               │ status=         │
│                   │               │ confirmed       │
│                   │               ├────────────────>│
│                   │               │<────────────────┤
│                   │ 200 OK        │                 │
│                   │<──────────────┤                 │
│<──────────────────┤               │                 │
│ Order Confirmed!  │               │                 │
```

### 3.3 Luồng: User Đánh Giá Sản Phẩm

```
User              Client          Server          Database
│                   │               │                 │
│ 1. Chọn Review    │               │                 │
├──────────────────>│               │                 │
│                   │ 2. POST       │                 │
│                   │ /product/     │                 │
│                   │ {id}/reviews  │                 │
│                   ├──────────────>│                 │
│                   │               │ 3. Kiểm tra:    │
│                   │               │ • UserId valid  │
│                   │               │ • Rating 0-5    │
│                   │               │ • Order phải    │
│                   │               │   delivered     │
│                   │               ├────────────────>│
│                   │               │<────────────────┤
│                   │               │                 │
│                   │               │ 4. Thêm vào     │
│                   │               │ product.        │
│                   │               │ reviews array   │
│                   │               ├────────────────>│
│                   │               │<────────────────┤
│                   │               │                 │
│                   │ 201 Created   │                 │
│                   │<──────────────┤                 │
│<──────────────────┤               │                 │
│ Review Added!     │               │                 │
│                   │               │                 │
│ Shop Notification │               │                 │
│ (Review added)    │               │                 │
```

### 3.4 Luồng: Admin Phê Duyệt Sản Phẩm

```
Admin             Client          Server          Database
│                   │               │                 │
│ 1. View Products  │               │                 │
├──────────────────>│               │                 │
│                   │ 2. GET        │                 │
│                   │ /admin/       │                 │
│                   │ products      │                 │
│                   ├──────────────>│                 │
│                   │               │ 3. Trả pending  │
│                   │               │ products list   │
│                   │               ├────────────────>│
│                   │               │<────────────────┤
│                   │ 200 OK        │                 │
│                   │<──────────────┤                 │
│<──────────────────┤               │                 │
│ 4. Chọn Approve   │               │                 │
├──────────────────>│               │                 │
│                   │ 5. PATCH      │                 │
│                   │ /admin/       │                 │
│                   │ products/     │                 │
│                   │ {id}/status   │                 │
│                   │ body:         │                 │
│                   │ {status:      │                 │
│                   │  'approved'}  │                 │
│                   ├──────────────>│                 │
│                   │               │ 6. Cập nhật:    │
│                   │               │ • status=       │
│                   │               │   approved      │
│                   │               │ • moderatedBy   │
│                   │               │ • moderatedAt   │
│                   │               │ • isPublished=  │
│                   │               │   true          │
│                   │               ├────────────────>│
│                   │               │<────────────────┤
│                   │               │                 │
│                   │ 200 OK        │                 │
│                   │<──────────────┤                 │
│<──────────────────┤               │                 │
│ Product Approved! │               │                 │
│                   │               │                 │
│                   │               │ Notification    │
│                   │               │ to Shop Owner   │
```

---

## 4. Sơ Đồ Kết Nối Database (ERD)

### 4.1 Entity Relationship Diagram - Toàn Bộ Hệ Thống

```
                                    ┌─────────────┐
                                    │   CATEGORY  │
                                    │─────────────│
                                    │ • _id (PK)  │
                                    │ • name      │
                                    │ • slug      │
                                    │ • adminId──┐│
                                    │ • isActive ││
                                    │ • created  ││
                                    └─────────────┘
                                          ▲
                                          │ 1:N
                                          │
          ┌──────────────────┐────────────┤
          │                  │            │
          │                  ▼            │
    ┌─────────────┐    ┌──────────────┐  │
    │   USER      │    │    PRODUCT   │──┘
    │─────────────│    │──────────────│
    │ • _id (PK)  │    │ • _id (PK)   │
    │ • email (U) │    │ • title      │
    │ • password  │    │ • slug       │
    │ • name      │    │ • price      │
    │ • phone     │    │ • categoryId │
    │ • avatar    │    │ • shopId─────┐│
    │ • status    │    │ • images[ ]  ││
    │ • roles     │    │ • sizes[ ]   ││
    │ • fcmTokens │    │ • colors[ ]  ││
    │ • created   │    │ • variants[] ││
    └─────────────┘    │ • reviews[]  ││
          ▲             │ • status     ││
          │ 1:N         │ • isDraft    ││
          │             │ • isPublished││
          │             │ • isDeleted  ││
          │             │ • created    ││
          │             └──────────────┘
          │                    ▲
          │ 1:N                │ N:1
          │                    │
    ┌─────┴────────────┐       │
    │                  │       │
    ▼                  ▼       ▼
┌──────────────┐  ┌──────────────────┐  ┌─────────────┐
│    CART      │  │   INVENTORY      │  │    SHOP     │
│──────────────│  │──────────────────│  │─────────────│
│ • _id (PK)   │  │ • _id (PK)       │  │ • _id (PK)  │
│ • userId─────┼──┤ • productId──────┼──┤ • name      │
│ • items[]    │  │ • shopId─────────┼──┤ • email (U) │
│ • totalPrice │  │ • totalQuantity  │  │ • password  │
│ • created    │  │ • location       │  │ • status    │
└──────────────┘  │ • reserved       │  │ • verify    │
                  │ • variants[]     │  │ • roles     │
                  │ • status         │  │ • created   │
                  │ • created        │  └─────────────┘
                  └──────────────────┘        ▲
                           ▲                  │ N:1
                           │ 1:N              │
                           │            ┌─────┘
                           │            │
                           │ ┌──────────┴────────────────┐
                           │ │                           │
                   ┌────────┴────────┐          ┌─────────────────┐
                   │                 │          │    DISCOUNT     │
                   │                 ▼          │─────────────────│
                ┌──────────────┐  ┌────────┐   │ • _id (PK)      │
                │    ORDER     │  │ADDRESS │   │ • code (U)      │
                │──────────────│  │────────│   │ • shopId────────┤
                │ • _id (PK)   │  │ • _id  │   │ • type          │
                │ • userId─────┼──┤ • user │   │ • value         │
                │ • shopId─────┼──┤ Id     │   │ • startDate     │
                │ • items[]    │  │ • name │   │ • expiryDate    │
                │ • receiver*  │  │ • phone│   │ • maxUses       │
                │ • address────┼──┤ • addr │   │ • usedCount     │
                │ • totalPrice │  │ • def- │   │ • minOrderValue │
                │ • finalPrice │  │ ault   │   │ • usersUsed[]   │
                │ • status     │  └────────┘   │ • isActive      │
                │ • cancel*    │                │ • created       │
                │ • created    │                └─────────────────┘
                └──────────────┘
                        ▲
                        │ N:1
                        │
                ┌───────┴─────────────┐
                │                     │
        ┌───────────────────┐  ┌──────────────────┐
        │  NOTIFICATION     │  │  SEARCH_HISTORY  │
        │───────────────────│  │──────────────────│
        │ • _id (PK)        │  │ • _id (PK)       │
        │ • userId──────────┼──┤ • userId────────┤
        │ • title           │  │ • keyword       │
        │ • body            │  │ • createdAt     │
        │ • type            │  └──────────────────┘
        │ • data            │
        │ • isRead          │
        │ • createdAt       │
        └───────────────────┘

Legend:
────────
(U)     = Unique constraint
(PK)    = Primary Key
N:1     = Many-to-One relationship
1:N     = One-to-Many relationship
[]      = Array/Embedded document
───┬─── = Relationship line
   └─── = Points to referenced collection
```

### 4.2 Chi Tiết Các Relationship

| Từ Bảng | Đến Bảng | Loại | Mô Tả |
|---------|----------|------|-------|
| PRODUCT | CATEGORY | N:1 | Sản phẩm thuộc một category |
| PRODUCT | SHOP | N:1 | Sản phẩm thuộc một shop |
| PRODUCT | USER | N:1 (review) | Review được viết bởi user |
| CART | USER | N:1 | Giỏ hàng của user |
| CART | PRODUCT | N:M | Giỏ hàng chứa nhiều sản phẩm |
| ORDER | USER | N:1 | Đơn hàng của user |
| ORDER | SHOP | N:1 | Đơn hàng gửi đến shop |
| ORDER | PRODUCT | N:M | Đơn hàng chứa nhiều sản phẩm |
| INVENTORY | PRODUCT | 1:1 | Kho hàng của sản phẩm |
| INVENTORY | SHOP | N:1 | Kho hàng của shop |
| DISCOUNT | SHOP | N:1 | Mã giảm giá của shop |
| DISCOUNT | USER | N:M | Người dùng đã sử dụng discount |
| DISCOUNT | PRODUCT | N:M | Discount áp dụng cho sản phẩm |
| ADDRESS | USER | N:1 | Địa chỉ của user |
| NOTIFICATION | USER | N:1 | Thông báo cho user |
| SEARCH_HISTORY | USER | N:1 | Lịch sử tìm kiếm của user |

---

## 5. Cấu Trúc Chi Tiết Các Bảng

### 5.1 Bảng USER (Người Mua)

```
┌─────────────────────────────────────────────────────────────┐
│                         USERS                               │
├─────────────────────────────────────────────────────────────┤
│ Field           │ Type      │ Constraint  │ Mô Tả           │
├─────────────────────────────────────────────────────────────┤
│ _id             │ ObjectId  │ PK          │ ID tự động      │
│ name            │ String    │ trim, max150│ Tên người dùng  │
│ email           │ String    │ unique,req  │ Email đăng nhập │
│ password        │ String    │ required    │ Mật khẩu (bcrypt)
│ phone           │ String    │ trim        │ Số điện thoại   │
│ address         │ String    │ trim        │ Địa chỉ mặc định│
│ avatar          │ String    │ -           │ URL ảnh đại diện│
│ status          │ String    │ enum        │ active/inactive │
│ verify          │ Boolean   │ default:F   │ Email xác thực  │
│ roles           │ Array     │ default:[]  │ ['USER']        │
│ fcmTokens       │ String[]  │ default:[]  │ Firebase tokens │
│ createdAt       │ Date      │ auto        │ Thời tạo        │
│ updatedAt       │ Date      │ auto        │ Thời cập nhật   │
└─────────────────────────────────────────────────────────────┘

Indexes:
--------
- email (unique)
```

### 5.2 Bảng SHOP (Cửa Hàng)

```
┌──────────────────────────────────────────────────────────────┐
│                         SHOPS                                │
├──────────────────────────────────────────────────────────────┤
│ Field           │ Type      │ Constraint  │ Mô Tả             │
├──────────────────────────────────────────────────────────────┤
│ _id             │ ObjectId  │ PK          │ ID tự động        │
│ name            │ String    │ trim, max150│ Tên cửa hàng      │
│ email           │ String    │ unique      │ Email đăng ký     │
│ password        │ String    │ required    │ Mật khẩu (bcrypt) │
│ status          │ String    │ enum        │ active/inactive/  │
│                 │           │             │ blocked           │
│ verify          │ Boolean   │ default:F   │ Email xác thực    │
│ verifiedAt      │ Date      │ -           │ Ngày xác thực     │
│ verifiedBy      │ ObjectId  │ ref:User    │ Admin xác thực    │
│ blockedAt       │ Date      │ -           │ Ngày bị khóa      │
│ blockedReason   │ String    │ trim        │ Lý do khóa        │
│ roles           │ Array     │ default:[]  │ ['SHOP']          │
│ createdAt       │ Date      │ auto        │ Thời tạo          │
│ updatedAt       │ Date      │ auto        │ Thời cập nhật     │
└──────────────────────────────────────────────────────────────┘

Indexes:
--------
- email (unique)
- status

Status:
-------
- active     : Shop được kích hoạt, có thể hoạt động
- inactive   : Chờ xác thực từ Admin
- blocked    : Bị khóa, không thể hoạt động
```

### 5.3 Bảng PRODUCT (Sản Phẩm)

```
┌────────────────────────────────────────────────────────────────┐
│                       PRODUCTS                                 │
├────────────────────────────────────────────────────────────────┤
│ Field           │ Type      │ Constraint  │ Mô Tả               │
├────────────────────────────────────────────────────────────────┤
│ _id             │ ObjectId  │ PK          │ ID tự động          │
│ title           │ String    │ required    │ Tên sản phẩm        │
│ slug            │ String    │ unique      │ URL friendly name   │
│ categoryId      │ ObjectId  │ ref:Categ,  │ Danh mục sản phẩm   │
│                 │           │ required    │                     │
│ price           │ Number    │ required    │ Giá gốc             │
│ discountedPrice │ Number    │ default:0   │ Giá sau giảm        │
│ gender          │ Number    │ required    │ 0:unisex, 1:male,   │
│                 │           │             │ 2:female            │
│ images          │ String[]  │ default:[]  │ URLs từ Cloudinary  │
│ sizes           │ String[]  │ default:[]  │ ['S','M','L','XL']  │
│ colors          │ Array     │ -           │ Color objects       │
│ ├─ title        │ String    │ required    │ Tên màu             │
│ └─ rgb          │ [R,G,B]   │ required    │ RGB values          │
│ variants        │ Array     │ default:[]  │ Color+Size variants │
│ ├─ color        │ String    │ required    │ Màu sắc             │
│ ├─ size         │ String    │ required    │ Kích cỡ             │
│ └─ stock        │ Number    │ default:0   │ Số lượng tồn kho    │
│ reviews         │ Array     │ default:[]  │ Review objects      │
│ ├─ userId       │ ObjectId  │ ref:User    │ Người review        │
│ ├─ content      │ String    │ required    │ Nội dung đánh giá   │
│ ├─ rating       │ Number    │ 0-5         │ Điểm đánh giá       │
│ ├─ orderId      │ ObjectId  │ ref:Order   │ Đơn hàng liên quan  │
│ └─ shopResponse │ Object    │ -           │ Trả lời của shop    │
│ salesNumber     │ Number    │ default:0   │ Số lượng bán ra      │
│ description     │ String    │ -           │ Mô tả chi tiết      │
│ status          │ String    │ enum,       │ pending/approved/   │
│                 │           │ idx,pending │ rejected            │
│ moderatedBy     │ ObjectId  │ ref:User    │ Admin phê duyệt     │
│ moderatedAt     │ Date      │ -           │ Ngày phê duyệt      │
│ moderationNote  │ String    │ -           │ Ghi chú phê duyệt   │
│ product_shop    │ ObjectId  │ ref:Shop    │ Shop sở hữu         │
│ isDraft         │ Boolean   │ default:T   │ Chưa xuất bản       │
│ isPublished     │ Boolean   │ default:F   │ Đã xuất bản         │
│ isDeleted       │ Boolean   │ default:F,  │ Đã xóa              │
│                 │           │ idx         │                     │
│ deletedAt       │ Date      │ -           │ Ngày xóa            │
│ createdAt       │ Date      │ auto        │ Thời tạo            │
│ updatedAt       │ Date      │ auto        │ Thời cập nhật       │
└────────────────────────────────────────────────────────────────┘

Indexes:
--------
- status
- isDeleted
- categoryId
- product_shop

Status:
-------
- pending    : Chờ Admin phê duyệt
- approved   : Được phê duyệt, hiển thị công khai
- rejected   : Bị từ chối

Ví Dụ Variants:
───────────────
variants: [
  { color: 'Red', size: 'S', stock: 10 },
  { color: 'Red', size: 'M', stock: 5 },
  { color: 'Blue', size: 'L', stock: 8 }
]
```

### 5.4 Bảng CATEGORY (Danh Mục)

```
┌──────────────────────────────────────────────────────────────┐
│                       CATEGORIES                             │
├──────────────────────────────────────────────────────────────┤
│ Field           │ Type      │ Constraint  │ Mô Tả             │
├──────────────────────────────────────────────────────────────┤
│ _id             │ ObjectId  │ PK          │ ID tự động        │
│ name            │ String    │ unique,req, │ Tên danh mục      │
│                 │           │ trim,max100 │                   │
│ slug            │ String    │ unique, lc  │ URL friendly      │
│ description     │ String    │ trim        │ Mô tả danh mục    │
│ adminId         │ ObjectId  │ ref:User,   │ Admin tạo         │
│                 │           │ required    │                   │
│ isActive        │ Boolean   │ default:T   │ Danh mục hoạt động│
│ createdAt       │ Date      │ auto        │ Thời tạo          │
│ updatedAt       │ Date      │ auto        │ Thời cập nhật     │
└──────────────────────────────────────────────────────────────┘

Indexes:
--------
- name (unique)
- slug (unique)
```

### 5.5 Bảng ORDER (Đơn Hàng)

```
┌─────────────────────────────────────────────────────────────────┐
│                        ORDERS                                   │
├─────────────────────────────────────────────────────────────────┤
│ Field           │ Type      │ Constraint  │ Mô Tả                 │
├─────────────────────────────────────────────────────────────────┤
│ _id             │ ObjectId  │ PK          │ ID tự động            │
│ userId          │ ObjectId  │ ref:User,   │ Người mua             │
│                 │           │ req, idx    │                       │
│ shopId          │ ObjectId  │ ref:Shop,   │ Shop bán              │
│                 │           │ req, idx    │                       │
│ receiverName    │ String    │ required    │ Tên người nhận        │
│ receiverPhone   │ String    │ required    │ Số điện thoại nhận    │
│ address         │ String    │ required    │ Địa chỉ giao hàng    │
│ items           │ Array     │ required    │ Danh sách sản phẩm    │
│ ├─ productId    │ ObjectId  │ ref:Product │ Sản phẩm             │
│ ├─ variantId    │ ObjectId  │ required    │ Variant được chọn     │
│ ├─ productName  │ String    │ required    │ Tên SP (snapshot)     │
│ ├─ price        │ Number    │ required    │ Giá tại thời order    │
│ ├─ quantity     │ Number    │ min:1, req  │ Số lượng              │
│ ├─ image        │ String    │ required    │ Ảnh SP (snapshot)     │
│ ├─ color        │ String    │ -           │ Màu chọn              │
│ └─ size         │ String    │ -           │ Cỡ chọn               │
│ totalPrice      │ Number    │ required    │ Tổng trước giảm       │
│ discountAmount  │ Number    │ default:0   │ Số tiền giảm          │
│ finalPrice      │ Number    │ required    │ Tổng cuối (có giảm)   │
│ status          │ String    │ enum, idx   │ pending/confirmed/    │
│                 │           │ ,pending    │ processing/shipped/   │
│                 │           │             │ delivered/cancelled   │
│ cancelReason    │ String    │ -           │ Lý do hủy             │
│ cancelledAt     │ Date      │ -           │ Ngày hủy              │
│ cancelledBy     │ String    │ enum        │ user/shop/admin       │
│ paymentMethod   │ String    │ enum        │ cod/card/             │
│                 │           │             │ bank_transfer         │
│ discountCode    │ String    │ -           │ Mã giảm giá áp dụng   │
│ notes           │ String    │ -           │ Ghi chú thêm          │
│ createdAt       │ Date      │ auto        │ Thời tạo              │
│ updatedAt       │ Date      │ auto        │ Thời cập nhật         │
└─────────────────────────────────────────────────────────────────┘

Indexes:
--------
- userId, shopId
- status

Status Transitions:
───────────────────
pending → confirmed → processing → shipped → delivered → ✓
    ↓
  cancelled

Cancel Info:
───────────
- cancelReason: Lý do hủy đơn
- cancelledAt: Thời điểm hủy
- cancelledBy: Ai hủy (user/shop/admin)
```

### 5.6 Bảng CART (Giỏ Hàng)

```
┌──────────────────────────────────────────────────────────────┐
│                        CARTS                                 │
├──────────────────────────────────────────────────────────────┤
│ Field           │ Type      │ Constraint  │ Mô Tả             │
├──────────────────────────────────────────────────────────────┤
│ _id             │ ObjectId  │ PK          │ ID tự động        │
│ user            │ ObjectId  │ ref:User,   │ Người dùng        │
│                 │           │ required    │                   │
│ items           │ Array     │ -           │ Sản phẩm trong GH │
│ ├─ product      │ ObjectId  │ ref:Product │ Sản phẩm          │
│ ├─ variantId    │ ObjectId  │ required    │ Variant của SP    │
│ ├─ quantity     │ Number    │ min:1, req  │ Số lượng          │
│ └─ price        │ Number    │ required    │ Giá hiện tại      │
│ totalPrice      │ Number    │ default:0   │ Tổng tiền trong GH│
│ createdAt       │ Date      │ auto        │ Thời tạo          │
│ updatedAt       │ Date      │ auto        │ Thời cập nhật     │
└──────────────────────────────────────────────────────────────┘

Indexes:
--------
- user (1:1 relationship)
```

### 5.7 Bảng INVENTORY (Kho Hàng)

```
┌──────────────────────────────────────────────────────────────┐
│                     INVENTORIES                              │
├──────────────────────────────────────────────────────────────┤
│ Field           │ Type      │ Constraint  │ Mô Tả             │
├──────────────────────────────────────────────────────────────┤
│ _id             │ ObjectId  │ PK          │ ID tự động        │
│ productId       │ ObjectId  │ ref:Product,│ Sản phẩm          │
│                 │           │ req, idx    │                   │
│ shopId          │ ObjectId  │ ref:Shop,   │ Shop sở hữu       │
│                 │           │ req, idx    │                   │
│ totalQuantity   │ Number    │ min:0, req  │ Tổng số tồn kho   │
│ location        │ String    │ -           │ Vị trí kho        │
│ variants        │ Array     │ default:[]  │ Tồn kho variant   │
│ ├─ variantId    │ ObjectId  │ required    │ Variant ID        │
│ ├─ color        │ String    │ required    │ Màu sắc           │
│ ├─ size         │ String    │ required    │ Kích cỡ           │
│ └─ stock        │ Number    │ min:0, req  │ Tồn kho cụ thể    │
│ reserved        │ Number    │ default:0   │ Đã đặt hàng       │
│ status          │ String    │ enum        │ in_stock/         │
│                 │           │             │ low_stock/        │
│                 │           │             │ out_of_stock      │
│ createdAt       │ Date      │ auto        │ Thời tạo          │
│ updatedAt       │ Date      │ auto        │ Thời cập nhật     │
└──────────────────────────────────────────────────────────────┘

Indexes:
--------
- (productId, shopId) [unique]
- status

Status Logic:
──────────────
- in_stock     : totalQuantity > 10
- low_stock    : 0 < totalQuantity ≤ 10
- out_of_stock : totalQuantity = 0

Available = totalQuantity - reserved
```

### 5.8 Bảng DISCOUNT (Khuyến Mãi)

```
┌──────────────────────────────────────────────────────────────┐
│                      DISCOUNTS                               │
├──────────────────────────────────────────────────────────────┤
│ Field           │ Type      │ Constraint  │ Mô Tả             │
├──────────────────────────────────────────────────────────────┤
│ _id             │ ObjectId  │ PK          │ ID tự động        │
│ code            │ String    │ unique, req │ Mã giảm giá       │
│                 │           │ , trim, UP  │                   │
│ description     │ String    │ required    │ Mô tả khuyến mãi  │
│ type            │ String    │ enum        │ percentage/       │
│                 │           │             │ fixed_amount      │
│ value           │ Number    │ min:0, req  │ Mức giảm          │
│ startDate       │ Date      │ required    │ Ngày bắt đầu      │
│ expiryDate      │ Date      │ required    │ Ngày kết thúc     │
│ maxUses         │ Number    │ min:1, req  │ Số lần dùng tối đa│
│ usedCount       │ Number    │ default:0   │ Đã sử dụng        │
│ maxUsesPerUser  │ Number    │ min:1       │ Tối đa/người dùng │
│ minOrderValue   │ Number    │ default:0   │ Đơn tối thiểu     │
│ shopId          │ ObjectId  │ ref:Shop,   │ Shop tạo mã       │
│                 │           │ req, idx    │                   │
│ appliesTo       │ String    │ enum        │ all/specific      │
│ applicableProds │ ObjectId[]│ ref:Product │ SP áp dụng (nếu   │
│                 │           │             │ specific)         │
│ applicableCateg │ ObjectId[]│ ref:Categ   │ Category áp dụng  │
│ usersUsed       │ ObjectId[]│ ref:User    │ Người dùng mã     │
│ isActive        │ Boolean   │ default:T,  │ Mã có hiệu lực    │
│                 │           │ idx         │                   │
│ createdAt       │ Date      │ auto        │ Thời tạo          │
│ updatedAt       │ Date      │ auto        │ Thời cập nhật     │
└──────────────────────────────────────────────────────────────┘

Indexes:
--------
- (code, shopId)
- (shopId, isActive)

Type Explanation:
─────────────────
- percentage   : Giảm x% từ giá gốc
- fixed_amount : Giảm x đơn vị tiền

Ví Dụ:
──────
Mã "SAVE20" (percentage):
  type: 'percentage', value: 20
  Giảm 20% từ tổng giá

Mã "SAVE50K" (fixed_amount):
  type: 'fixed_amount', value: 50000
  Giảm 50,000 VND từ tổng giá
```

### 5.9 Bảng ADDRESS (Địa Chỉ)

```
┌──────────────────────────────────────────────────────────────┐
│                      ADDRESSES                               │
├──────────────────────────────────────────────────────────────┤
│ Field           │ Type      │ Constraint  │ Mô Tả             │
├──────────────────────────────────────────────────────────────┤
│ _id             │ ObjectId  │ PK          │ ID tự động        │
│ userId          │ ObjectId  │ ref:User,   │ Người dùng        │
│                 │           │ required    │                   │
│ receiverName    │ String    │ required    │ Tên người nhận    │
│                 │           │ , trim      │                   │
│ receiverPhone   │ String    │ required    │ Số điện thoại     │
│                 │           │ , trim      │                   │
│ address         │ String    │ required    │ Chi tiết địa chỉ  │
│                 │           │ , trim      │                   │
│ isDefault       │ Boolean   │ default:F   │ Địa chỉ mặc định  │
│ createdAt       │ Date      │ auto        │ Thời tạo          │
│ updatedAt       │ Date      │ auto        │ Thời cập nhật     │
└──────────────────────────────────────────────────────────────┘

Indexes:
--------
- userId
```

### 5.10 Bảng NOTIFICATION (Thông Báo)

```
┌──────────────────────────────────────────────────────────────┐
│                    NOTIFICATIONS                             │
├──────────────────────────────────────────────────────────────┤
│ Field           │ Type      │ Constraint  │ Mô Tả             │
├──────────────────────────────────────────────────────────────┤
│ _id             │ ObjectId  │ PK          │ ID tự động        │
│ userId          │ ObjectId  │ ref:User,   │ Người nhận TB     │
│                 │           │ req, idx    │                   │
│ title           │ String    │ required    │ Tiêu đề TB        │
│                 │           │ , trim      │                   │
│ body            │ String    │ required    │ Nội dung TB       │
│                 │           │ , trim      │                   │
│ type            │ String    │ enum, idx   │ order/promo/      │
│                 │           │             │ promotion/system/ │
│                 │           │             │ test/custom       │
│ data            │ Mixed     │ default:{}  │ Dữ liệu bổ sung   │
│ isRead          │ Boolean   │ default:F,  │ Đã đọc            │
│                 │           │ idx         │                   │
│ createdAt       │ Date      │ auto        │ Thời tạo          │
│ updatedAt       │ Date      │ auto        │ Thời cập nhật     │
└──────────────────────────────────────────────────────────────┘

Indexes:
--------
- userId, createdAt (DESC)
- userId, isRead, createdAt (DESC)

Type:
─────
- order     : Thông báo về đơn hàng
- promo     : Thông báo khuyến mãi
- promotion : Thông báo quảng bá
- system    : Thông báo hệ thống
- test      : Thử nghiệm
- custom    : Tùy chỉnh
```

### 5.11 Bảng SEARCH_HISTORY (Lịch Sử Tìm Kiếm)

```
┌──────────────────────────────────────────────────────────────┐
│                  SEARCH_HISTORIES                            │
├──────────────────────────────────────────────────────────────┤
│ Field           │ Type      │ Constraint  │ Mô Tả             │
├──────────────────────────────────────────────────────────────┤
│ _id             │ ObjectId  │ PK          │ ID tự động        │
│ userId          │ ObjectId  │ ref:User,   │ Người tìm kiếm    │
│                 │           │ required    │                   │
│ keyword         │ String    │ required    │ Từ khóa tìm kiếm  │
│                 │           │ , trim      │                   │
│ createdAt       │ Date      │ auto, NO    │ Thời tạo          │
│                 │           │ updatedAt   │                   │
└──────────────────────────────────────────────────────────────┘

Indexes:
--------
- (userId, createdAt)  [FIFO pruning]
- (userId, createdAt DESC) [recent search]

Tiered Pruning Logic:
──────────────────────
- Keep MAX 10 recent searches per user
- When adding new search:
  1. Check if keyword == last search
  2. If same, skip (avoid duplicate consecutive)
  3. If different, add new entry
  4. If count > 10, delete oldest entry
```

### 5.12 Bảng ADMIN (Quản Trị Viên)

```
┌──────────────────────────────────────────────────────────────┐
│                       ADMINS                                 │
├──────────────────────────────────────────────────────────────┤
│ Field           │ Type      │ Constraint  │ Mô Tả             │
├──────────────────────────────────────────────────────────────┤
│ _id             │ ObjectId  │ PK          │ ID tự động        │
│ name            │ String    │ required,   │ Tên quản trị viên  │
│                 │           │ trim, max150│                   │
│ account         │ String    │ unique,req, │ Tên đăng nhập     │
│                 │           │ trim        │                   │
│ password        │ String    │ required    │ Mật khẩu (bcrypt) │
│ status          │ String    │ enum        │ active/inactive/  │
│                 │           │             │ blocked           │
│ verify          │ Boolean   │ default:T   │ Xác thực email    │
│ roles           │ Array     │ default:[]  │ ['ADMIN']         │
│ permissions     │ Array     │ default:[]  │ Danh sách quyền   │
│ lastLogin       │ Date      │ -           │ Lần đăng nhập cuối│
│ createdAt       │ Date      │ auto        │ Thời tạo          │
│ updatedAt       │ Date      │ auto        │ Thời cập nhật     │
└──────────────────────────────────────────────────────────────┘

Indexes:
--------
- account (unique)

Permissions Examples:
─────────────────────
[
  'manage_products',
  'manage_shops',
  'manage_users',
  'manage_orders',
  'manage_categories',
  'view_analytics'
]
```

---

## 📋 Tóm Tắt

### Tổng Cộng: 12 Bảng Chính

| # | Bảng | Mục Đích | Relationships |
|---|------|---------|----------------|
| 1 | USER | Người mua hàng | Cart, Order, Address, Review, Notification |
| 2 | SHOP | Cửa hàng | Product, Inventory, Discount, Order |
| 3 | PRODUCT | Sản phẩm bán | Category, Shop, Cart, Order, Inventory, Review |
| 4 | CATEGORY | Danh mục | Product |
| 5 | ORDER | Đơn hàng | User, Shop, Product (via items) |
| 6 | CART | Giỏ hàng | User, Product |
| 7 | INVENTORY | Kho hàng | Product, Shop |
| 8 | DISCOUNT | Mã giảm giá | Shop, User, Product, Category |
| 9 | ADDRESS | Địa chỉ | User |
| 10 | NOTIFICATION | Thông báo | User |
| 11 | SEARCH_HISTORY | Lịch sử tìm | User |
| 12 | ADMIN | Quản trị viên | User (via references) |

### Quy Ước Đặt Tên
- Bảng: CamelCase (User, Product, Cart)
- Field: camelCase (userId, receiverName)
- Status fields: snake_case values (pending, in_stock)
- Timestamps: createdAt, updatedAt (tự động)

### Mô Hình Lưu Trữ
- **MongoDB** (NoSQL Document Database)
- **Mongoose** ODM (Object Document Mapper)
- **Soft Delete**: isDeleted + deletedAt
- **Timestamps**: Tự động timestamps
- **Indexing**: Tối ưu query performance

---

## 🔗 Liên Kết Tài Liệu

Các tài liệu liên quan:
- [ADMIN_API_DOCUMENTATION.md](ADMIN_API_DOCUMENTATION.md)
- [SHOP_API_DOCUMENTATION.md](SHOP_API_DOCUMENTATION.md)
- [PRODUCT_UPLOAD_GUIDE.md](PRODUCT_UPLOAD_GUIDE.md)
- [REVIEWS_API.md](REVIEWS_API.md)

---

**Cập Nhật Lần Cuối:** 18 Tháng 5, 2026
**Phiên Bản:** 1.0.0
