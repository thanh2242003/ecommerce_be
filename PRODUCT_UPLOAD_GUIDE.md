# Hướng dẫn Upload Ảnh Sản Phẩm với Cloudinary

## 📋 Setup Đã Hoàn Thành

✅ Tạo file cấu hình Multer + Cloudinary: `src/configs/multer.config.js`
✅ Cập nhật Product Controller để xử lý file uploads
✅ Cập nhật Product Routes với middleware `upload.array('images', 5)`
✅ Package dependencies đã cài đặt: `cloudinary`, `multer`, `multer-storage-cloudinary`

---

## 🚀 Cách Sử Dụng

### 1. **Tạo Sản Phẩm Mới (Create Product)**

**Endpoint:** `POST /api/v1/products`

**Headers:**
```
Content-Type: multipart/form-data
Authorization: Bearer {shopToken}
```

**Form Data:**
- `images` (file): Tối đa 5 ảnh, các format được hỗ trợ: JPG, PNG, GIF, WebP (tối đa 5MB/ảnh)
- `title` (text): Tên sản phẩm
- `description` (text): Mô tả
- `price` (number): Giá gốc
- `discountedPrice` (number): Giá sau giảm (tùy chọn)
- `categoryId` (text): ID danh mục
- `gender` (number): Giới tính (0, 1, 2)
- `sizes` (JSON array): Kích cỡ, ví dụ: `["S", "M", "L", "XL"]`
- `colors` (JSON array): Màu sắc, ví dụ: 
  ```json
  [
    {"title": "Red", "rgb": [255, 0, 0]},
    {"title": "Blue", "rgb": [0, 0, 255]}
  ]
  ```
- `variants` (JSON array): Biến thể sản phẩm, ví dụ:
  ```json
  [
    {"color": "Red", "size": "M", "stock": 10},
    {"color": "Blue", "size": "L", "stock": 15}
  ]
  ```

**Ví dụ Request với cURL:**
```bash
curl -X POST http://localhost:3000/api/v1/products \
  -H "Authorization: Bearer YOUR_SHOP_TOKEN" \
  -F "images=@/path/to/image1.jpg" \
  -F "images=@/path/to/image2.png" \
  -F "title=Áo Thun Nam" \
  -F "description=Áo thun 100% cotton" \
  -F "price=150000" \
  -F "categoryId=507f1f77bcf86cd799439011" \
  -F "gender=0" \
  -F 'sizes=["S","M","L","XL"]' \
  -F 'colors=[{"title":"Red","rgb":[255,0,0]},{"title":"Blue","rgb":[0,0,255]}]' \
  -F 'variants=[{"color":"Red","size":"M","stock":10}]'
```

**Response:**
```json
{
  "code": 200,
  "message": "Create new Product successfully!",
  "metadata": {
    "_id": "507f1f77bcf86cd799439012",
    "title": "Áo Thun Nam",
    "images": [
      "https://res.cloudinary.com/dexskxxv7/image/upload/learning-ecommerce/products/abc123.jpg",
      "https://res.cloudinary.com/dexskxxv7/image/upload/learning-ecommerce/products/def456.png"
    ],
    "price": 150000,
    "categoryId": "507f1f77bcf86cd799439011",
    "... other fields"
  }
}
```

---

### 2. **Cập Nhật Sản Phẩm (Update Product)**

**Endpoint:** `PATCH /api/v1/products/:productId`

**Headers:**
```
Content-Type: multipart/form-data
Authorization: Bearer {shopToken}
```

**Lưu ý:**
- Nếu upload ảnh mới → ảnh cũ sẽ bị thay thế
- Nếu KHÔNG upload ảnh → ảnh cũ vẫn được giữ lại
- Các trường khác (title, price, etc.) được cập nhật bình thường

**Ví dụ:**
```bash
curl -X PATCH http://localhost:3000/api/v1/products/507f1f77bcf86cd799439012 \
  -H "Authorization: Bearer YOUR_SHOP_TOKEN" \
  -F "images=@/path/to/new-image.jpg" \
  -F "title=Áo Thun Nam - Phiên Bản Mới"
```

---

## 📦 Cloudinary Storage

**Folder Structure:**
```
learning-ecommerce/
└── products/
    ├── image1_uuid.jpg
    ├── image2_uuid.png
    └── ...
```

**File được lưu tự động vào folder:** `learning-ecommerce/products/`

---

## ⚙️ Cấu Hình

Kiểm tra file `.env` của bạn:
```env
CLOUDINARY_CLOUD_NAME=dexskxxv7
CLOUDINARY_API_KEY=664334924751999
CLOUDINARY_API_SECRET=krRBD_VukUzrIQKYKOBqog3rccg
```

---

## ✅ Kiểm Tra

Các ảnh được lưu thành công khi:
1. ✅ Response trả về mảng URLs: `"images": ["https://res.cloudinary.com/..."]`
2. ✅ Database lưu URLs của ảnh (không phải base64 hay paths)
3. ✅ Có thể truy cập ảnh qua URL đó

---

## 🐛 Troubleshooting

### Lỗi: "Only image files are allowed"
→ Kiểm tra loại file upload, chỉ hỗ trợ JPG, PNG, GIF, WebP

### Lỗi: "File too large"
→ Kích thước ảnh vượt quá 5MB, hãy nén ảnh

### Lỗi: "Missing Cloudinary config"
→ Kiểm tra lại file `.env` có đầy đủ 3 giá trị không

### Ảnh không được lưu vào database
→ Kiểm tra `req.files` có truyền vào payload không

---

## 📝 Ghi Chú

- Backend hiện tại nhận tối đa **5 ảnh** cùng 1 lúc
- Tất cả ảnh được lưu trên **Cloudinary** (không lưu local)
- URLs ảnh được lưu vào database dạng strings trong mảng `images`
- Frontend có thể hiển thị ảnh trực tiếp từ URL Cloudinary

