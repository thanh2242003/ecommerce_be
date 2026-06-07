# Tong hop API luong Order

Tai lieu nay la ban tra cuu nhanh cho frontend/backend khi tich hop luong dat hang. Chi tiet nghiep vu dai hon nam o `docs/ORDER_FLOW.md`.

## 1. Base URL va auth

| Nhom | Base path | Auth |
| --- | --- | --- |
| User order | `/v1/api/order` | User token qua `authenticationV2` |
| Shop order | `/v1/api/shop` | Shop token qua `shopAuthenticationV2` |
| Admin order | `/v1/api/admin` | Admin token qua `verifyAdmin` |
| Payment SePay | `/api/payments` | User token, rieng webhook khong dung user token |

Response thanh cong dung format chung:

```json
{
  "message": "Success message",
  "status": 200,
  "metadata": {}
}
```

Response loi dung format chung:

```json
{
  "code": 400,
  "message": "Error message",
  "metadata": null
}
```

## 2. Field chinh cua Order

| Field | Kieu | Mo ta |
| --- | --- | --- |
| `_id` | ObjectId | ID don hang |
| `userId` | ObjectId/ref | User tao don |
| `shopId` | ObjectId/ref | Shop so huu san pham trong don |
| `receiverName` | String | Snapshot ten nguoi nhan tu Address |
| `receiverPhone` | String | Snapshot SDT nguoi nhan tu Address |
| `address` | String | Snapshot dia chi giao hang |
| `items` | Array | Danh sach san pham snapshot tai thoi diem dat |
| `totalPrice` | Number | Tong tien hang truoc discount |
| `discountAmount` | Number | Tien giam gia, hien mac dinh `0` trong order service |
| `finalPrice` | Number | So tien thanh toan cuoi cung |
| `status` | String | Trang thai xu ly don |
| `paymentMethod` | String | `cod` hoac `bank_transfer` |
| `paymentStatus` | String | Trang thai thanh toan |
| `paymentExpiredAt` | Date/null | Han thanh toan online |
| `paidAt` | Date/null | Thoi diem thanh toan thanh cong |
| `transactionId` | String/null | Ma giao dich SePay |
| `cancelReason` | String/null | Ly do huy |
| `cancelledAt` | Date/null | Thoi diem huy |
| `cancelledBy` | String/null | `user`, `shop`, `admin` |
| `refundRequestedAt` | Date/null | Thoi diem yeu cau hoan tien |
| `refundedAt` | Date/null | Thoi diem admin xac nhan da hoan tien |
| `stockRestoredAt` | Date/null | Danh dau da hoan stock, chong xu ly lap |
| `notes` | String | Ghi chu admin/refund |

`items[]`:

```json
{
  "productId": "product-id",
  "variantId": "variant-id",
  "productName": "Ten san pham",
  "price": 350000,
  "quantity": 1,
  "image": "https://...",
  "color": "Black",
  "size": "M"
}
```

## 3. Trang thai

### 3.1 Order status

| Status | Mo ta |
| --- | --- |
| `pending` | Don moi tao, cho xac nhan. Don online chi cho shop thay sau khi da paid |
| `confirmed` | Shop/admin da xac nhan |
| `shipping` | Dang giao |
| `delivered` | Da giao thanh cong |
| `cancelled` | Da huy |

Transition hop le:

```txt
pending -> confirmed
pending -> cancelled
confirmed -> shipping
confirmed -> cancelled
shipping -> delivered
```

### 3.2 Payment status

| Status | Mo ta |
| --- | --- |
| `unpaid` | Don COD moi tao, chua thu tien |
| `pending` | Don online/SePay dang cho thanh toan |
| `paid` | Da thanh toan |
| `failed` | Thanh toan that bai |
| `expired` | Qua han thanh toan |
| `refund_pending` | Don da paid bi huy, dang cho hoan tien thu cong |
| `refunded` | Admin da xac nhan hoan tien |

`paymentMethod` hop le khi tao order:

| Gia tri request | Gia tri luu vao order | Mo ta |
| --- | --- | --- |
| `cod` | `cod` | Thanh toan khi nhan hang |
| `bank_transfer` | `bank_transfer` | Thanh toan online qua SePay |
| `online` | `bank_transfer` | Alias |
| `sepay` | `bank_transfer` | Alias |

## 4. Luong API user

### 4.1 Tao order

```http
POST /v1/api/order/orders
Authorization: Bearer <user_token>
Content-Type: application/json
```

Tao tu gio hang:

```json
{
  "type": "cart",
  "addressId": "address-id",
  "paymentMethod": "cod"
}
```

Mua ngay:

```json
{
  "type": "buy_now",
  "addressId": "address-id",
  "productId": "product-id",
  "variantId": "variant-id",
  "quantity": 1,
  "finalPrice": 350000,
  "paymentMethod": "bank_transfer"
}
```

Validate/chuc nang chinh:

- `type` bat buoc la `cart` hoac `buy_now`.
- `addressId` phai thuoc user dang dang nhap.
- Gio hang khong duoc rong va tat ca san pham trong cart phai cung mot shop.
- Variant phai ton tai va du stock.
- Backend tinh lai `serverFinalPrice`; neu client gui `finalPrice` va khac gia server thi tra loi.
- Tao order trong transaction, tru stock variant, tru inventory.
- Voi `type = cart`, cart duoc xoa sau khi tao order thanh cong.
- Voi `paymentMethod = bank_transfer`, order co `paymentStatus = pending` va `paymentExpiredAt`.

Response metadata la order vua tao:

```json
{
  "_id": "order-id",
  "status": "pending",
  "paymentMethod": "bank_transfer",
  "paymentStatus": "pending",
  "paymentExpiredAt": "2026-06-07T10:15:00.000Z",
  "finalPrice": 350000,
  "items": []
}
```

### 4.2 Lay danh sach order cua user

```http
GET /v1/api/order/orders
Authorization: Bearer <user_token>
```

Xu ly kem theo:

- Backend tu dong expire cac order online qua han cua user truoc khi tra danh sach.
- Tra tat ca order cua user, sap xep `createdAt` giam dan.
- Endpoint nay hien chua ho tro query pagination/filter trong service.

### 4.3 Lay chi tiet order cua user

```http
GET /v1/api/order/orders/{id}
Authorization: Bearer <user_token>
```

Dieu kien:

- Order phai thuoc user dang dang nhap.
- Backend tu dong expire cac order online qua han cua user truoc khi tra chi tiet.

### 4.4 User huy order

```http
PATCH /v1/api/order/orders/{id}/cancel
Authorization: Bearer <user_token>
Content-Type: application/json
```

Body:

```json
{
  "cancelReason": "Doi y khong mua nua"
}
```

Dieu kien:

- Order phai thuoc user.
- Chi huy duoc khi `status` la `pending` hoac `confirmed`.

Xu ly:

- Set `status = cancelled`.
- Set `cancelledBy = user`, `cancelledAt`, `cancelReason`.
- Neu `paymentStatus = paid`, chuyen sang `refund_pending`.
- Hoan stock Product variant va Inventory mot lan dua vao `stockRestoredAt`.

## 5. Luong API SePay cho order online

### 5.1 Tao payment SePay

```http
POST /api/payments/sepay/create
Authorization: Bearer <user_token>
Content-Type: application/json
```

Body:

```json
{
  "orderId": "order-id"
}
```

Dieu kien:

- Order phai thuoc user.
- `order.status = pending`.
- `order.paymentMethod = bank_transfer`.
- `order.paymentStatus = pending`.
- `order.finalPrice > 0`.
- Neu da co payment `PENDING` hoac `PROCESSING` chua het han, backend tra lai payment cu.

Response metadata:

```json
{
  "_id": "payment-id",
  "orderId": "order-id",
  "userId": "user-id",
  "amount": 350000,
  "paymentMethod": "SEPAY",
  "status": "PENDING",
  "expiredAt": "2026-06-07T10:15:00.000Z",
  "qrData": {
    "paymentCode": "ODABC12301020304",
    "amount": 350000,
    "bankName": "BANK",
    "bankAccount": "123456789",
    "transferContent": "ODABC12301020304",
    "qrText": "https://qr.sepay.vn/img?..."
  }
}
```

### 5.2 Kiem tra payment status

```http
GET /api/payments/{paymentId}/status
Authorization: Bearer <user_token>
```

Xu ly kem theo:

- Backend expire payment/order online qua han cua user truoc khi tra ket qua.
- Chi tra payment cua user dang dang nhap.

### 5.3 Lich su payment

```http
GET /api/payments/history?page=1&limit=10
Authorization: Bearer <user_token>
```

Response metadata:

```json
{
  "items": [],
  "pagination": {
    "total": 0,
    "page": 1,
    "limit": 10,
    "totalPages": 0,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

### 5.4 Webhook SePay

```http
POST /api/payments/sepay/webhook
Content-Type: application/json
X-SePay-Signature: <signature>
X-SePay-Timestamp: <timestamp>
```

Ghi chu:

- Endpoint nay nhan raw body de verify signature.
- Backend lay `paymentCode` tu payload, tim payment theo `qrData.paymentCode`.
- Webhook thanh cong khi `transferType = in` va `transferAmount` dung bang `payment.amount`.

Ket qua xu ly:

| Truong hop | Payment | Order |
| --- | --- | --- |
| Thanh cong | `SUCCESS`, set `transactionId`, `paidAt` | `paymentStatus = paid`, `paidAt`, `transactionId`, `paymentExpiredAt = null`, `status` giu `pending` |
| Sai amount | `FAILED` | `status = cancelled`, `paymentStatus = failed`, hoan stock |
| Sai transfer type | `FAILED` | `status = cancelled`, `paymentStatus = failed`, hoan stock |
| Qua han | `EXPIRED` | `status = cancelled`, `paymentStatus = expired`, hoan stock |
| Webhook lap | ignored/duplicate | Khong doi |
| Order da cancelled/failed/expired/refund | ignored | Khong doi |

## 6. Luong API shop

### 6.1 Lay danh sach order cua shop

```http
GET /v1/api/shop/orders?page=1&limit=20&status=pending&paymentStatus=paid
Authorization: Bearer <shop_token>
```

Query:

| Query | Mo ta |
| --- | --- |
| `page` | Trang hien tai |
| `limit` | So item moi trang |
| `status` | Loc theo `pending`, `confirmed`, `shipping`, `delivered`, `cancelled` |
| `paymentStatus` | Loc theo payment status |

Luu y quan trong:

- Shop thay don COD ngay.
- Shop chi thay don online khi `paymentMethod = bank_transfer` va `paymentStatus = paid`.
- Don online dang `pending` payment khong xuat hien trong danh sach shop.

Response metadata:

```json
{
  "orders": [],
  "pagination": {
    "total": 0,
    "page": 1,
    "limit": 20,
    "totalPages": 0,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

### 6.2 Lay chi tiet order cua shop

```http
GET /v1/api/shop/orders/{id}
Authorization: Bearer <shop_token>
```

Dieu kien:

- Order phai thuoc shop.
- Ap dung cung visibility voi danh sach: COD hoac online da paid.

### 6.3 Shop cap nhat status order

```http
PATCH /v1/api/shop/orders/{id}/status
Authorization: Bearer <shop_token>
Content-Type: application/json
```

Body:

```json
{
  "status": "confirmed"
}
```

Dieu kien:

- Order phai thuoc shop.
- Online order phai `paymentStatus = paid` truoc khi shop xu ly.
- Transition phai hop le theo state machine.
- Neu gui trung status hien tai, API tra order hien tai.

Xu ly dac biet:

- Khi shop set `status = cancelled`, backend set `cancelledBy = shop`, `cancelReason = Cancelled by shop`, hoan stock. Neu order da paid thi `paymentStatus = refund_pending`.
- Khi shop set `status = delivered` cho don COD, backend set `paymentStatus = paid` va `paidAt`.

## 7. Luong API admin

### 7.1 Lay danh sach order

```http
GET /v1/api/admin/orders?page=1&limit=20&status=pending&paymentStatus=paid
Authorization: Bearer <admin_token>
```

Admin thay tat ca order, khong bi gioi han visibility nhu shop.

Response metadata:

```json
{
  "orders": [],
  "pagination": {
    "total": 0,
    "page": 1,
    "limit": 20,
    "totalPages": 0,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

### 7.2 Lay chi tiet order admin

```http
GET /v1/api/admin/orders/{id}
Authorization: Bearer <admin_token>
```

Validate:

- `{id}` phai la MongoDB ObjectId hop le.

### 7.3 Admin cap nhat status order

```http
PATCH /v1/api/admin/orders/{id}/status
Authorization: Bearer <admin_token>
Content-Type: application/json
```

Body:

```json
{
  "status": "confirmed",
  "note": "Admin confirmed order"
}
```

Dieu kien:

- `{id}` phai hop le.
- Transition phai hop le.
- Online order phai paid truoc khi `confirmed` hoac `shipping`.

Xu ly dac biet:

- Neu `status = cancelled`, backend set `cancelledBy = admin`, `cancelReason = note || Cancelled by admin`, hoan stock. Neu order da paid thi `paymentStatus = refund_pending`.
- Neu co `note` va khong phai cancel, backend luu vao `order.notes`.
- Neu chuyen COD sang `delivered`, backend set `paymentStatus = paid` va `paidAt`.

### 7.4 Admin xac nhan da hoan tien thu cong

```http
PATCH /v1/api/admin/orders/{id}/refund/complete
Authorization: Bearer <admin_token>
Content-Type: application/json
```

Body:

```json
{
  "note": "Refunded manually via bank transfer"
}
```

Dieu kien:

- Order phai `status = cancelled`.
- `paymentStatus` phai la `refund_pending`.

Xu ly:

- Set `paymentStatus = refunded`.
- Set `refundedAt = now`.
- Append note vao `order.notes`.
- Neu order da `refunded`, API tra ve order hien tai, khong xu ly lai.

## 8. Thu tu goi API de tich hop frontend

### 8.1 COD tu cart

```txt
1. User them san pham vao cart
2. User chon dia chi
3. POST /v1/api/order/orders
   body: { type: "cart", addressId, paymentMethod: "cod" }
4. Hien thi trang dat hang thanh cong
5. Shop GET /v1/api/shop/orders se thay don pending
6. Shop PATCH confirmed -> shipping -> delivered
7. Khi delivered, COD tu dong paymentStatus = paid
```

### 8.2 COD mua ngay

```txt
1. User bam mua ngay
2. POST /v1/api/order/orders
   body: { type: "buy_now", addressId, productId, variantId, quantity, finalPrice, paymentMethod: "cod" }
3. Hien thi trang dat hang thanh cong
4. Shop xu ly nhu COD tu cart
```

### 8.3 SePay tu cart hoac mua ngay

```txt
1. POST /v1/api/order/orders voi paymentMethod = "bank_transfer"
2. Lay order._id tu response
3. POST /api/payments/sepay/create voi { orderId }
4. Frontend hien QR tu metadata.qrData.qrText va transferContent
5. User chuyen khoan dung so tien va noi dung
6. SePay goi POST /api/payments/sepay/webhook
7. Backend set order.paymentStatus = paid
8. Frontend poll GET /api/payments/{paymentId}/status hoac GET /v1/api/order/orders/{orderId}
9. Khi order paid, shop moi thay don va co the confirmed
```

### 8.4 User huy don

```txt
1. User vao chi tiet order
2. Neu status la pending/confirmed, goi PATCH /v1/api/order/orders/{id}/cancel
3. Backend cancelled + hoan stock
4. Neu da paid, paymentStatus = refund_pending
5. Admin xu ly hoan tien ben ngoai va goi refund/complete
```

## 9. Loi thuong gap

| Tinh huong | Message co the gap |
| --- | --- |
| Sai `paymentMethod` | `Invalid paymentMethod` |
| Sai `type` | `Invalid order type. Must be "cart" or "buy_now"` |
| Address khong thuoc user | `Address not found or does not belong to the user` |
| Cart rong | `Cart is empty` |
| Cart co san pham nhieu shop | `All products in cart must belong to the same shop` |
| Het stock | `Insufficient stock for ...` |
| Gia client khac server | `Gia da duoc cap nhat, vui long refresh lai trang` |
| Huy don sai status | `Cannot cancel order with status "..."` |
| Transition sai | `Cannot transition from ... to ...` |
| Tao payment cho COD | `Only bank_transfer order can create SePay payment` |
| Tao payment cho order khong pending | `Only pending order can create SePay payment` |
| Online order chua paid ma shop/admin xu ly | `Online payment order is not available for shop processing until paid` |

## 10. Checklist tich hop

- Luon luu `orderId` sau khi tao order.
- Voi order online, bat buoc goi tiep `POST /api/payments/sepay/create`.
- Khong cho shop xac nhan don online truoc khi `paymentStatus = paid`.
- Poll payment/order status den khi `SUCCESS`/`paid` hoac `FAILED`/`EXPIRED`.
- Hien thong bao het han dua tren `paymentExpiredAt`/`expiredAt`.
- Khi user huy order da paid, hien trang thai cho hoan tien vi backend set `refund_pending`, khong tu dong refund.
- Sau khi admin refund thu cong, goi `PATCH /v1/api/admin/orders/{id}/refund/complete`.
