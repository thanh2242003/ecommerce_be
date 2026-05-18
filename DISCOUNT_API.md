# Discount API — Tài liệu (Cập nhật)

Tài liệu này mô tả hành vi hiện tại của hệ thống mã giảm giá trong codebase.

## Tổng quan
- Hai scope chính:
	- `shop`: mã do shop tạo, chỉ áp dụng cho shop đó (bắt buộc `shopId`).
	- `platform`: mã do admin tạo, áp dụng toàn sàn (không cần `shopId`).

## Schema chính (fields quan trọng)
- `code` (String, uppercase, unique per scope/shop)
- `description` (String)
- `type` (String): `percentage` | `fixed_amount`
- `value` (Number)
- `startDate`, `expiryDate` (Date)
- `maxUses` (Number)
- `usedCount` (Number)
- `maxUsesPerUser` (Number)
- `minOrderValue` (Number)
- `scope` (String): `shop` | `platform` (default `shop`)
- `shopId` (ObjectId) — required when `scope === 'shop'`
- `appliesTo` (String): `all` | `specific`
- `applicableProducts`, `applicableCategories` (Array of ObjectId)
- `isActive` (Boolean)

> Note: tên field hiện tại trong model là `code`, `startDate`, `expiryDate`, `maxUses`, `usedCount`, `maxUsesPerUser`, `minOrderValue`, `scope`, `shopId`, `appliesTo`, `applicableProducts`, `isActive`.

## Endpoints

- Public / Order usage
	- POST `/v1/api/discount/amount`
		- Mục đích: Tính tiền giảm cho một đơn hàng khi áp mã.
		- Body: `{ "codeId": "SPRING50", "shopId": "...", "userId": "...", "products": [{"productId":"...","quantity":2,"price":100}] }`
		- Hành vi: tìm `Discount` theo `code` (uppercase) với điều kiện `isActive: true` và (`scope: 'platform'` OR `shopId` trùng). Kiểm tra ngày hiệu lực, `maxUses`, `minOrderValue`. Tính `discount` theo `type`.

- Shop (shop-authenticated)
	- POST `/v1/api/discount`
		- Mục đích: Shop tạo mã cho chính shop.
		- Auth: `shopAuthenticationV2` (routes/discount dùng middleware). `shopId` được gán từ token.
		- Body example:
			```json
			{
				"code": "SHOP10",
				"description": "Giảm 10%",
				"type": "percentage",
				"value": 10,
				"startDate": "2026-05-18",
				"expiryDate": "2026-06-30",
				"maxUses": 100,
				"maxUsesPerUser": 1,
				"minOrderValue": 0,
				"appliesTo": "all"
			}
			```

	- GET `/v1/api/discount`
		- Mục đích: Lấy danh sách mã của shop (chỉ trả mã `isActive: true` và trong khoảng ngày).
		- Auth: `shopAuthenticationV2`.

	- PATCH `/v1/api/discount/:id` — cập nhật mã shop (implement trong `shop.discount.controller`).
	- DELETE `/v1/api/discount/:id` — xóa mã shop (implement trong `shop.discount.controller`).

- Admin (admin-authenticated)
	- POST `/v1/api/admin/discounts`
		- Mục đích: Tạo mã toàn sàn (`scope: 'platform'`).
		- Auth: `verifyAdmin`.

	- PATCH `/v1/api/admin/discounts/:id` — cập nhật mã toàn sàn (chỉ ảnh hưởng các document `scope: 'platform'`).
	- DELETE `/v1/api/admin/discounts/:id` — xóa mã toàn sàn.

## Quy tắc & validation
- Mã chỉ được tạo khi `startDate` <= `expiryDate`.
- Khi tạo: kiểm tra trùng `code` trong cùng phạm vi (shop cùng `shopId` hoặc platform). Nếu trùng và đang active thì từ chối.
- Người dùng chỉ được *xem* và *áp* mã nếu `isActive === true` và `startDate <= now <= expiryDate`.
- Khi áp mã, hệ thống kiểm tra `minOrderValue`, `maxUses` và `maxUsesPerUser` (nếu có).

## Kết quả trả về
- Tạo/cập nhật/xóa trả về `SuccessResponse` với trường `metadata` chứa document `Discount` hoặc kết quả thích hợp.
- POST `/v1/api/discount/amount` trả về `{ "totalOrder": <number>, "discount": <number>, "totalPrice": <number> }`.

## Kiểm thử nhanh (ví dụ)
- Tạo mã platform (Admin):
	- Header: `Authorization: Bearer <adminToken>`
	- POST `/v1/api/admin/discounts` với body giống ví dụ ở trên (mã sẽ được lưu `scope: 'platform'`).

- Tạo mã shop (Shop):
	- Header: `x-client-id: <shopId>`, `Authorization: <shop access token>`
	- POST `/v1/api/discount` (shopId sẽ gắn tự động, `scope: 'shop'`).

- Áp mã cho đơn hàng:
	- POST `/v1/api/discount/amount` body mẫu như phần Public.

## Gợi ý mở rộng
- Thêm admin list/filter endpoint cho mã platform.
- Ghi audit log khi mã được sử dụng (userId, orderId, timestamp).
- Viết tests cho các kịch bản: hết lượt, quá ngày, minOrderValue không đủ, trùng mã shop vs platform.

---
Tài liệu đã được cập nhật cho khớp hiện trạng code.

