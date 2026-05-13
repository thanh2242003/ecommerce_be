# Review APIs

Tài liệu các API liên quan tới `reviews` (đánh giá sản phẩm).

Base path: `/v1/api/product` (project có thể prefix khác; kiểm tra server.js)

- **POST** `/v1/api/product/:productId/reviews`
  - Mô tả: Thêm đánh giá cho sản phẩm (yêu cầu đăng nhập).
  - Auth: Bearer token (user)
  - Body (JSON):
    - `content` (string) — bắt buộc
    - `rating` (number, 0-5) — bắt buộc
    - `orderId` (string) — id đơn hàng đã mua sản phẩm; bắt buộc. Chỉ có thể đánh giá khi đơn có `status: delivered`.
  - Response: object sản phẩm (cập nhật `reviews` và `ratings`)
  - Example:

```bash
curl -X POST "http://localhost:3000/v1/api/product/606.../reviews" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"content":"Sản phẩm tốt","rating":5}'
```

- **GET** `/v1/api/product/:productId/reviews`
  - Mô tả: Lấy danh sách đánh giá cho sản phẩm (công khai).
  - Query params:
    - `page` (number, default 1)
    - `limit` (number, default 10)
  - Response: `{ reviews, total, page, limit, ratings }`
  - Example:

```bash
curl "http://localhost:3000/v1/api/product/606.../reviews?page=1&limit=20"
```

- **PATCH** `/v1/api/product/:productId/reviews/:reviewId`
  - Mô tả: Cập nhật đánh giá (chỉ chủ review được cập nhật).
  - Auth: Bearer token (user)
  - Body (JSON):
    - `content` (string) — hoặc
    - `rating` (number, 0-5)
  - Response: object sản phẩm (cập nhật `reviews` và `ratings`)
  - Example:

```bash
curl -X PATCH "http://localhost:3000/v1/api/product/606.../reviews/607..." \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"content":"Cập nhật nhận xét","rating":4}'
```

- **DELETE** `/v1/api/product/:productId/reviews/:reviewId`
  - Mô tả: Xóa đánh giá (chỉ chủ review được xóa).
  - Auth: Bearer token (user)
  - Response: object sản phẩm sau khi xóa
  - Example:

```bash
curl -X DELETE "http://localhost:3000/v1/api/product/606.../reviews/607..." \
  -H "Authorization: Bearer <token>"
```

Ghi chú:
- Các review lưu dưới mảng `reviews` của document `Product`.
- Sau khi cập nhật schema, mỗi review có `_id`, `createdAt`, `updatedAt`.
- Quyền: hiện tại chỉ cho phép user tạo/cập nhật/xóa review của chính họ. Nếu cần quyền admin cho moderation, có thể mở rộng sau.

- **POST** `/v1/api/product/:productId/reviews/:reviewId/reply`
  - Mô tả: Shop trả lời các đánh giá (chỉ shop chủ sản phẩm).
  - Auth: Bearer token (shop)
  - Body (JSON):
    - `content` (string) — bắt buộc
  - Response: object sản phẩm (cập nhật `reviews` with `shopResponse`)
  - Example:

```bash
curl -X POST "http://localhost:3000/v1/api/product/606.../reviews/607.../reply" \
  -H "Authorization: Bearer <shop-token>" \
  -H "Content-Type: application/json" \
  -d '{"content":"Cảm ơn, chúng tôi đã liên hệ bạn"}'
```

- **GET** `/v1/api/user/reviews`
  - Mô tả: Lấy danh sách đánh giá mà user đã tạo (yêu cầu auth)
  - Auth: Bearer token (user)
  - Query params:
    - `page` (number, default 1)
    - `limit` (number, default 10)
  - Response: `{ reviews: [{ productId, title, image, review }], total, page, limit }`
  - Example:

```bash
curl -H "Authorization: Bearer <token>" "http://localhost:3000/v1/api/user/reviews?page=1&limit=20"
```

File controllers liên quan: [src/controllers/product.controller.js](src/controllers/product.controller.js#L1)
Service: [src/services/product.service.js](src/services/product.service.js#L1)
Routes: [src/routes/product/index.js](src/routes/product/index.js#L1)
