# 📊 TỔNG HỢP API MỚI VÀ API THAY ĐỔI

---

## 🆕 CÁC API MỚI (7 API)

### Category Management APIs

| API | Method | Endpoint | Yêu cầu Auth | Chỉ Admin | Mô tả |
|-----|--------|----------|:----:|:----:|---------|
| 1. Get All Categories | GET | `/v1/api/category` | ❌ | ❌ | Lấy danh sách tất cả categories |
| 2. Get Category By ID | GET | `/v1/api/category/:categoryId` | ❌ | ❌ | Lấy chi tiết category theo ID |
| 3. Get Category By Slug | GET | `/v1/api/category/slug/:slug` | ❌ | ❌ | Lấy chi tiết category theo slug |
| 4. Create Category | POST | `/v1/api/category` | ✅ | ✅ | Tạo category mới (chỉ admin) |
| 5. Update Category | PATCH | `/v1/api/category/:categoryId` | ✅ | ✅ | Cập nhật category (chỉ admin) |
| 6. Delete Category | DELETE | `/v1/api/category/:categoryId` | ✅ | ✅ | Xóa category (chỉ admin) |
| 7. Seed Default Categories | POST | `/v1/api/category/seed/default` | ✅ | ✅ | Seed 6 categories mặc định (chỉ admin) |

---

## 🔄 CÁC API THAY ĐỔI (2 API)

### 1. Get All Products (Updated)
```
GET /v1/api/product
```
**Thay đổi:**
- ✨ **Thêm tham số filter**: `categoryId`
- ✨ **Mô tả**: Lọc sản phẩm theo category ID
- Các tham số cũ vẫn giữ: `minPrice`, `maxPrice`, `gender`, `sort`, `page`, `limit`

**Request Example:**
```
GET /v1/api/product?categoryId=<category_id>&minPrice=100000&maxPrice=500000
```

---

### 2. Search Products (Updated)
```
GET /v1/api/product/search
```
**Thay đổi:**
- ✨ **Thêm tham số filter**: `categoryId`
- ✨ **Mô tả**: Tìm kiếm sản phẩm theo từ khóa và category
- Tham số cũ vẫn giữ: `q` (keyword)

**Request Example:**
```
GET /v1/api/product/search?q=áo&categoryId=<category_id>
```

---

## 📦 CÁC CATEGORIES MẶC ĐỊNH

6 categories được tạo mặc định khi seed:

| STT | Name | Slug | Description |
|-----|------|------|-------------|
| 1 | Quần áo | quan-ao | Các loại quần áo, áo sơ mi, áo khoác, etc. |
| 2 | Giày dép | giay-dep | Giày sneaker, sandal, dép, boot, etc. |
| 3 | Đồ chơi | do-choi | Các loại đồ chơi cho trẻ em |
| 4 | Thực phẩm | thuc-pham | Thực phẩm, đồ uống, bánh kẹo, etc. |
| 5 | Đồ dùng | do-dung | Đồ dùng hàng ngày, gia dụng |
| 6 | Khác | khac | Các sản phẩm khác |

---

## 📁 CÁC FILE ĐÃ TẠO

```
✅ src/models/category.model.js
✅ src/services/category.service.js
✅ src/controllers/category.controller.js
✅ src/routes/category/index.js
```

---

## 📝 CÁC FILE ĐÃ CẬP NHẬT

```
✅ src/models/product.model.js
   - Thay đổi categoryId từ String → ObjectId (ref: Category)

✅ src/controllers/product.controller.js
   - searchProducts: Thêm categoryId filter
   - getAllProducts: Thêm categoryId filter

✅ src/services/product.service.js
   - searchProducts: Thêm categoryId filter

✅ src/routes/index.js
   - Đăng ký category routes: router.use('/v1/api/category', require('./category/index'))

✅ src/routes/product/index.js
   - Cập nhật comment: GET ALL (with filter by category, price, gender, etc.)
```

---

## 🚀 QUICK START

### 1. Seed Default Categories (Admin Only - using x-client-id)
```bash
POST http://localhost:3000/v1/api/category/seed/default
Headers:
  x-client-id: 680f91f6f01b7d2a2fa9c001
```

### 2. Get All Categories (Public)
```bash
GET http://localhost:3000/v1/api/category
```

### 3. Create Product with Category
```bash
POST http://localhost:3000/v1/api/product
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "Áo sơ mi nam",
  "product_type": "Clothing",
  "categoryId": "<category_id_from_step_2>",
  "price": 150000,
  "description": "Áo sơ mi chất lượng cao",
  "gender": 1,
  "images": ["url1"],
  "sizes": ["S", "M", "L"],
  "colors": [{"title": "Trắng", "rgb": [255, 255, 255]}]
}
```

### 4. Search Products by Category
```bash
GET http://localhost:3000/v1/api/product/search?q=áo&categoryId=<category_id>
```

### 5. Filter Products by Category
```bash
GET http://localhost:3000/v1/api/product?categoryId=<category_id>&minPrice=100000&maxPrice=500000
```

---

## ✅ CHECKLIST

- ✅ Tạo Category model với slug, description, isActive
- ✅ Cập nhật Product model: categoryId (String → ObjectId)
- ✅ Tạo Category service (CRUD operations)
- ✅ Tạo Category controller
- ✅ Tạo Category routes
- ✅ Đăng ký Category routes trong main router
- ✅ Cập nhật Product search để hỗ trợ category filter
- ✅ Cập nhật Product getAllProducts để hỗ trợ category filter
- ✅ Seed 6 categories mặc định: Quần áo, Giày dép, Đồ chơi, Thực phẩm, Đồ dùng, Khác
- ✅ Mỗi sản phẩm phải có categoryId (required)
- ✅ API documentation

---

## 📌 LƯU Ý

1. **Admin Permission**: Create, Update, Delete category chỉ admin mới được phép. Admin được xác định bằng `x-client-id` header so sánh với danh sách HARDCODED_ADMIN_USER_IDS trong `src/auth/adminAuth.js`. Mặc định là: `680f91f6f01b7d2a2fa9c001`
2. **x-client-id Header**: Tất cả category admin operations chỉ cần truyền `x-client-id` header, không cần JWT token
3. **categoryId là bắt buộc**: Khi tạo hoặc cập nhật product, categoryId phải là một ObjectId hợp lệ
4. **Soft Delete**: Xóa category không xóa vĩnh viễn, chỉ đặt `isActive = false`
5. **Slug tự động**: Slug của category được tự động tạo từ name
6. **Tìm kiếm toàn bộ**: Tìm kiếm products có thể kết hợp keyword và category ID
7. **Backward Compatibility**: Các tham số cũ trong product API vẫn hoạt động bình thường
8. **Admin ID Storage**: Mỗi category được tạo sẽ lưu lại `adminId` của admin đã tạo nó
