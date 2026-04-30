# API DOCUMENTATION - CATEGORY & PRODUCT UPDATES

## 🆕 NEW CATEGORIES APIs

### 1. Get All Categories (Public)
```
GET /v1/api/category
```
**Description:** Lấy danh sách tất cả categories
**Response:**
```json
{
  "code": 200,
  "message": "Get all categories successfully!",
  "metadata": [
    {
      "_id": "category_id",
      "name": "Quần áo",
      "slug": "quan-ao",
      "description": "Các loại quần áo, áo sơ mi, áo khoác, etc.",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    // ... more categories
  ]
}
```

---

### 2. Get Category By ID (Public)
```
GET /v1/api/category/:categoryId
```
**Description:** Lấy chi tiết category theo ID
**Parameters:**
- `categoryId` (path): ID của category

**Response:**
```json
{
  "code": 200,
  "message": "Get category successfully!",
  "metadata": {
    "_id": "category_id",
    "name": "Quần áo",
    "slug": "quan-ao",
    "description": "Các loại quần áo, áo sơ mi, áo khoác, etc.",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 3. Get Category By Slug (Public)
```
GET /v1/api/category/slug/:slug
```
**Description:** Lấy chi tiết category theo slug
**Parameters:**
- `slug` (path): Slug của category (e.g., "quan-ao", "giay-dep")

**Response:** Same as Get Category By ID

---

### 4. Create Category (Admin Only)
```
POST /v1/api/category
```
**Description:** Tạo category mới (chỉ admin mới được tạo)
**Headers:**
```
x-client-id: <admin_id>
```

**Request Body:**
```json
{
  "name": "Quần áo",
  "description": "Các loại quần áo, áo sơ mi, áo khoác, etc."
}
```

**Response:**
```json
{
  "code": 200,
  "message": "Create category successfully!",
  "metadata": {
    "_id": "category_id",
    "name": "Quần áo",
    "slug": "quan-ao",
    "description": "Các loại quần áo, áo sơ mi, áo khoác, etc.",
    "adminId": "admin_user_id",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Response (Non-Admin):**
```json
{
  "code": 403,
  "message": "Admin permission required",
  "status": "error"
}
```

---

### 5. Update Category (Admin Only)
```
PATCH /v1/api/category/:categoryId
```
**Description:** Cập nhật thông tin category (chỉ admin)
**Headers:**
```
x-client-id: <admin_id>
```

**Request Body:**
```json
{
  "name": "Quần áo nam",
  "description": "Các loại quần áo nam",
  "isActive": true
}
```

**Response:** Same as Create Category

---

### 6. Delete Category (Admin Only)
```
DELETE /v1/api/category/:categoryId
```
**Description:** Xóa category (soft delete - đặt isActive = false, chỉ admin)
**Headers:**
```
x-client-id: <admin_id>
```

**Response:**
```json
{
  "code": 200,
  "message": "Delete category successfully!",
  "metadata": {
    "message": "Category deleted successfully"
  }
}
```

---

### 7. Seed Default Categories (Admin Only)
```
POST /v1/api/category/seed/default
```
**Description:** Seed mặc định 6 categories: Quần áo, Giày dép, Đồ chơi, Thực phẩm, Đồ dùng, Khác (chỉ admin)
**Headers:**
```
x-client-id: <admin_id>
```

**Response:**
```json
{
  "code": 200,
  "message": "Categories seeded successfully!",
  "metadata": {
    "message": "Default categories seeded successfully"
  }
}
```

---

## 🔄 UPDATED PRODUCT APIs

### 1. Get All Products (Updated)
```
GET /v1/api/product
```
**Description:** Lấy danh sách sản phẩm với các filter
**Query Parameters:**
- `categoryId` (optional): Lọc theo category ID
- `minPrice` (optional): Giá tối thiểu
- `maxPrice` (optional): Giá tối đa
- `gender` (optional): Giới tính (0: Nữ, 1: Nam, 2: Unisex)
- `sort` (optional): Sắp xếp theo field (default: createdAt)
- `page` (optional): Trang (default: 1)
- `limit` (optional): Số item mỗi trang (default: 10)

**Example:**
```
GET /v1/api/product?categoryId=<id>&minPrice=100000&maxPrice=500000&gender=0&page=1&limit=10
```

**Response:**
```json
{
  "code": 200,
  "message": "Get all products successfully!",
  "metadata": [
    {
      "_id": "product_id",
      "title": "Áo sơ mi nam",
      "slug": "ao-so-mi-nam",
      "categoryId": "category_id",
      "price": 150000,
      "discountedPrice": 120000,
      "gender": 1,
      "images": ["url1", "url2"],
      "sizes": ["S", "M", "L"],
      "colors": [
        {
          "title": "Trắng",
          "rgb": [255, 255, 255]
        }
      ],
      "salesNumber": 10,
      "description": "Áo sơ mi chất lượng cao",
      "ratings": 4.5,
      "reviews": [],
      "product_type": "Clothing",
      "product_shop": "shop_id",
      "isDraft": false,
      "isPublished": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    // ... more products
  ]
}
```

---

### 2. Search Products (Updated)
```
GET /v1/api/product/search
```
**Description:** Tìm kiếm sản phẩm theo keyword với filter category
**Query Parameters:**
- `q` (required): Keyword tìm kiếm
- `categoryId` (optional): Lọc theo category ID

**Example:**
```
GET /v1/api/product/search?q=áo&categoryId=<category_id>
```

**Response:** Same as Get All Products

---

### 3. Create Product (Updated)
```
POST /v1/api/product
```
**Description:** Tạo sản phẩm mới (yêu cầu categoryId)
**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "title": "Áo sơ mi nam",
  "product_type": "Clothing",
  "description": "Áo sơ mi chất lượng cao",
  "price": 150000,
  "discountedPrice": 120000,
  "categoryId": "<category_id>",
  "gender": 1,
  "images": ["url1", "url2"],
  "sizes": ["S", "M", "L"],
  "colors": [
    {
      "title": "Trắng",
      "rgb": [255, 255, 255]
    }
  ]
}
```

**Response:**
```json
{
  "code": 200,
  "message": "Create new Product successfully!",
  "metadata": {
    "_id": "product_id",
    "title": "Áo sơ mi nam",
    "slug": "ao-so-mi-nam",
    "categoryId": "category_id",
    // ... other fields
  }
}
```

---

### 4. Update Product (No Change in API)
```
PATCH /v1/api/product/:productId
```
**Description:** Cập nhật sản phẩm (giờ đây hỗ trợ update categoryId)
**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "title": "Áo sơ mi nam - updated",
  "categoryId": "<new_category_id>",
  "price": 160000
}
```

---

## 📋 DEFAULT CATEGORIES

Khi khởi tạo hệ thống, 6 categories mặc định sẽ được tạo:

| Name | Slug | Description |
|------|------|-------------|
| Quần áo | quan-ao | Các loại quần áo, áo sơ mi, áo khoác, etc. |
| Giày dép | giay-dep | Giày sneaker, sandal, dép, boot, etc. |
| Đồ chơi | do-choi | Các loại đồ chơi cho trẻ em |
| Thực phẩm | thuc-pham | Thực phẩm, đồ uống, bánh kẹo, etc. |
| Đồ dùng | do-dung | Đồ dùng hàng ngày, gia dụng |
| Khác | khac | Các sản phẩm khác |

---

## 🔧 TECHNICAL CHANGES

### Database Model Changes
1. **Product Model**: Thay đổi `categoryId` từ String thành `ObjectId` với reference đến Category model
2. **New Category Model**: Thêm model Category với fields: `name`, `slug`, `description`, `isActive`

### File Changes
- ✅ Created: `src/models/category.model.js`
- ✅ Created: `src/services/category.service.js`
- ✅ Created: `src/controllers/category.controller.js`
- ✅ Created: `src/routes/category/index.js`
- ✅ Updated: `src/models/product.model.js` (categoryId type)
- ✅ Updated: `src/controllers/product.controller.js` (searchProducts, getAllProducts)
- ✅ Updated: `src/services/product.service.js` (searchProducts)
- ✅ Updated: `src/routes/index.js` (đăng ký category routes)

---

## 📝 USAGE EXAMPLES

### 1. Lấy tất cả categories
```bash
curl http://localhost:3000/v1/api/category
```

### 2. Lấy sản phẩm theo category
```bash
curl "http://localhost:3000/v1/api/product?categoryId=<category_id>"
```

### 3. Tìm kiếm sản phẩm theo từ khóa và category
```bash
curl "http://localhost:3000/v1/api/product/search?q=áo&categoryId=<category_id>"
```

### 4. Tạo category mới (Admin Only)
```bash
curl -X POST http://localhost:3000/v1/api/category \
  -H "x-client-id: 680f91f6f01b7d2a2fa9c001" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Điện tử",
    "description": "Các sản phẩm điện tử"
  }'
```

### 5. Seed categories mặc định (Admin Only)
```bash
curl -X POST http://localhost:3000/v1/api/category/seed/default \
  -H "x-client-id: 680f91f6f01b7d2a2fa9c001"
```
