# Cập nhật Avatar người dùng (Backend)

Tóm tắt
- Backend đã được cập nhật để nhận ảnh avatar từ frontend, upload lên Cloudinary và lưu `avatar` là URL ảnh trong profile user.

Endpoint
- URL: `PATCH /v1/api/user/profile`
- Yêu cầu: Authentication (token) — route được bảo vệ
- Nội dung: `multipart/form-data` (hoặc có thể gửi form fields thông thường nếu không upload file)

Fields
- `avatar` (file) — tên trường file phải là `avatar`. (tùy chọn)
  - Loại file cho phép: `image/jpeg`, `image/png`, `image/gif`, `image/webp`
  - Kích thước tối đa: 5MB
- `name` (string) — (tùy chọn)
- `phone` (string) — (tùy chọn)
- `address` (string) — (tùy chọn)

Hành vi
- Nếu frontend gửi file `avatar`, server sẽ dùng middleware `multer` (memoryStorage) để nhận file, sau đó upload buffer lên Cloudinary (folder `learning-ecommerce/avatars`) bằng helper `uploadFilesToCloudinary`.
- Sau khi upload thành công, URL trả về từ Cloudinary (secure_url) sẽ được lưu vào trường `avatar` của user trong database.
- Nếu không gửi file nhưng gửi `avatar` là một chuỗi URL trong body, server sẽ lưu giá trị đó (giữ nguyên hành vi trước đó).

Response
- Trả về object SuccessResponse với `metadata` là profile người dùng đã cập nhật. `avatar` trong response là URL ảnh (nếu có).

Ví dụ (curl)

```bash
curl -X PATCH 'http://localhost:3000/v1/api/user/profile' \
  -H 'Authorization: Bearer <TOKEN>' \
  -F 'avatar=@/path/to/avatar.jpg' \
  -F 'name=Nguyen Van A' \
  -F 'phone=0123456789'
```

Lưu ý / Lỗi thường gặp
- Nếu file có mimetype không hợp lệ, multer sẽ trả lỗi: `Only image files are allowed`.
- Nếu file quá lớn (>5MB), multer sẽ trả lỗi về giới hạn kích thước.
- Nếu upload lên Cloudinary thất bại, server trả lỗi upload tương ứng.

Files liên quan
- `src/routes/user/user.route.js` — thêm middleware `upload.single('avatar')` để nhận file
- `src/controllers/user.controller.js` — upload file lên Cloudinary và truyền `avatar` URL vào `UserService.updateProfile`
- `src/configs/multer.config.js` — cấu hình loại file và giới hạn kích thước
- `src/helpers/cloudinary.helper.js` — helper upload buffer lên Cloudinary

Kiểm thử nhanh
1. Chạy server:

```bash
npm start
```

2. Gọi ví dụ curl ở trên với token hợp lệ.

3. Kiểm tra profile trả về, trường `avatar` phải chứa URL ảnh (https).

Muốn tôi bổ sung ví dụ response JSON, hoặc cập nhật `docs/API_ENDPOINTS_REFERENCE.md` để thêm phần này không?