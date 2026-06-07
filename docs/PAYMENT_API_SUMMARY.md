# Tong hop API thanh toan

Tai lieu nay tong hop cac API thanh toan dang co trong backend. He thong hien dang ho tro thanh toan SePay bang chuyen khoan ngan hang/QR.

## Base URL

```txt
http://localhost:3000
```

## Header chung

Nhung API protected can dang nhap:

```http
x-client-id: <user_id>
authorization: <access_token>
Content-Type: application/json
```

Rieng webhook SePay khong dung token user, vi duoc goi tu SePay ve server.

## Luong thanh toan tong quat

1. User tao don online bang API `POST /v1/api/order/orders` voi `paymentMethod = bank_transfer`.
2. Frontend lay `orderId` tu don hang vua tao.
3. Goi `POST /api/payments/sepay/create` voi `orderId`.
4. Backend tao payment, tra ve thong tin QR/chuyen khoan.
5. User chuyen khoan dung so tien va noi dung `paymentCode`.
6. SePay goi webhook `POST /api/payments/sepay/webhook`.
7. Backend xac thuc giao dich, cap nhat payment thanh `SUCCESS` va `order.paymentStatus` thanh `paid`.
8. Frontend co the poll `GET /api/payments/{paymentId}/status` de cap nhat trang thai.

## 1. Tao don hang truoc khi thanh toan

```http
POST /v1/api/order/orders
```

Yeu cau dang nhap.

### Body tao tu gio hang

```json
{
  "type": "cart",
  "addressId": "6834f9479f65a6f4623e8f23",
  "paymentMethod": "bank_transfer"
}
```

### Body mua ngay

```json
{
  "type": "buy_now",
  "addressId": "6834f9479f65a6f4623e8f23",
  "productId": "6834f9479f65a6f4623e8f24",
  "variantId": "6834f9479f65a6f4623e8f25",
  "quantity": 1,
  "finalPrice": 350000,
  "paymentMethod": "bank_transfer"
}
```

### Response `201`

```json
{
  "message": "Order created successfully",
  "status": 201,
  "metadata": {
    "_id": "6834f9479f65a6f4623e8f23",
    "status": "pending",
    "paymentMethod": "bank_transfer",
    "paymentStatus": "pending",
    "paymentExpiredAt": "2026-05-27T09:00:00.000Z",
    "finalPrice": 350000
  }
}
```

Luu y: `metadata._id` chinh la `orderId` de tao payment SePay.

## 2. Tao thanh toan SePay

```http
POST /api/payments/sepay/create
```

Yeu cau dang nhap.

### Body

```json
{
  "orderId": "6834f9479f65a6f4623e8f23"
}
```

### Response `201`

```json
{
  "message": "Create SePay payment successfully",
  "status": 201,
  "metadata": {
    "_id": "6835a67c7ffcc32ab5e4d8e4",
    "orderId": "6834f9479f65a6f4623e8f23",
    "transactionId": null,
    "userId": "6834d9a8146ebec8be2a8a42",
    "amount": 350000,
    "paymentMethod": "SEPAY",
    "status": "PENDING",
    "expiredAt": "2026-05-27T09:00:00.000Z",
    "qrData": {
      "paymentCode": "OD3E8F2301020304",
      "amount": 350000,
      "bankName": "Vietcombank",
      "bankAccount": "1017588888",
      "transferContent": "OD3E8F2301020304",
      "qrText": "https://qr.sepay.vn/img?acc=1017588888&bank=Vietcombank&amount=350000&des=OD3E8F2301020304"
    },
    "createdAt": "2026-05-27T08:45:00.000Z",
    "updatedAt": "2026-05-27T08:45:00.000Z"
  }
}
```

### Dieu kien tao payment

- `orderId` la bat buoc.
- Don hang phai thuoc user dang dang nhap.
- Don hang chi duoc tao payment khi `status = pending`.
- Don hang phai co `paymentMethod = bank_transfer`.
- Don hang phai co `paymentStatus = pending`.
- `finalPrice` cua don hang phai lon hon `0`.
- Neu don hang da co payment `PENDING` hoac `PROCESSING` chua het han, API tra lai payment cu thay vi tao payment moi.
- Khi tao payment, order duoc cap nhat:
  - `paymentMethod`: `bank_transfer`
  - `paymentStatus`: `pending`
  - `paymentExpiredAt`: theo `payment.expiredAt`
  - `transactionId`: `null`
  - `paidAt`: `null`

## 3. Kiem tra trang thai payment

```http
GET /api/payments/{paymentId}/status
```

Yeu cau dang nhap.

### Path params

| Ten | Kieu | Mo ta |
| --- | --- | --- |
| `paymentId` | string | ID cua payment |

### Response `200`

```json
{
  "message": "Get payment status successfully",
  "status": 200,
  "metadata": {
    "_id": "6835a67c7ffcc32ab5e4d8e4",
    "orderId": "6834f9479f65a6f4623e8f23",
    "transactionId": "92704",
    "status": "SUCCESS",
    "paidAt": "2026-05-27T08:47:11.000Z"
  }
}
```

Luu y: moi lan goi API nay, backend se tu dong kiem tra va cho het han cac payment pending/processing da qua `expiredAt` cua user hien tai.

## 4. Lich su thanh toan

```http
GET /api/payments/history?page=1&limit=10
```

Yeu cau dang nhap.

### Query params

| Ten | Bat buoc | Mac dinh | Mo ta |
| --- | --- | --- | --- |
| `page` | Khong | `1` | Trang hien tai |
| `limit` | Khong | `10` | So payment moi trang |

### Response `200`

```json
{
  "message": "Get payment history successfully",
  "status": 200,
  "metadata": {
    "items": [
      {
        "_id": "6835a67c7ffcc32ab5e4d8e4",
        "orderId": "6834f9479f65a6f4623e8f23",
        "status": "SUCCESS",
        "amount": 350000,
        "transactionId": "92704",
        "createdAt": "2026-05-27T08:45:00.000Z"
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
}
```

## 5. Webhook SePay

```http
POST /api/payments/sepay/webhook
```

API nay duoc SePay goi ve server sau khi co giao dich ngan hang.

### Headers

```http
x-sepay-signature: <signature>
x-sepay-timestamp: <timestamp>
Content-Type: application/json
```

### Body mau

```json
{
  "id": 92704,
  "gateway": "Vietcombank",
  "transactionDate": "2024-07-02 11:08:33",
  "accountNumber": "1017588888",
  "subAccount": "",
  "code": "OD3E8F2301020304",
  "content": "OD3E8F2301020304 chuyen tien",
  "transferType": "in",
  "description": "NGUYEN VAN A chuyen tien",
  "transferAmount": 350000,
  "accumulated": 105000000,
  "referenceCode": "FT24012345678"
}
```

### Response thanh cong `200`

```json
{
  "success": true
}
```

### Xu ly webhook

- Backend lay ma thanh toan tu `code`, neu khong co thi lay tu `content`, sau do tim trong `description` theo pattern `OD...`.
- Giao dich hop le khi:
  - Co `id`.
  - Co payment code.
  - `transferType` la `in`.
  - `transferAmount` bang dung `payment.amount`.
  - Payment chua het han.
- Neu hop le:
  - Payment chuyen sang `PROCESSING`, sau do `SUCCESS`.
  - Gan `transactionId` bang `payload.id`.
  - Gan `paidAt`.
  - `order.paymentStatus` chuyen sang `paid`.
  - `order.paymentExpiredAt` chuyen ve `null`.
  - `order.status` khong bi doi, vi day la trang thai xu ly don hang.
  - Order gan `paymentMethod = bank_transfer`.
  - Gui notification cho user.
- Neu sai so tien: payment thanh `FAILED`, order bi huy va hoan lai stock/inventory.
- Neu het han: payment thanh `EXPIRED`, order bi huy voi ly do `Payment timeout` va hoan lai stock/inventory.
- Neu webhook SUCCESS den muon sau khi order da `cancelled` hoac `paymentStatus` da `failed`, `expired`, `refund_pending`, `refunded`: backend ghi log va bo qua, khong cap nhat order/payment thanh paid.
- Webhook co log de tranh xu ly trung theo `eventId = payload.id`.

## Trang thai payment

| Trang thai | Mo ta |
| --- | --- |
| `PENDING` | Da tao payment, dang cho user chuyen khoan |
| `PROCESSING` | Webhook dang duoc xu ly |
| `SUCCESS` | Thanh toan thanh cong, `order.paymentStatus` da duoc mark `paid` |
| `FAILED` | Webhook khong hop le hoac sai so tien |
| `EXPIRED` | Qua thoi gian thanh toan, order bi huy |

## Trang thai order lien quan thanh toan

| Trang thai | Mo ta |
| --- | --- |
| `pending` | Don moi tao |
| `confirmed` | Don da duoc shop xac nhan |
| `shipping` | Don dang giao |
| `delivered` | Don da giao |
| `cancelled` | Don bi huy |

## Trang thai thanh toan tren order

| Trang thai | Mo ta |
| --- | --- |
| `unpaid` | Don chua bat dau thanh toan |
| `pending` | Da tao payment, dang cho user chuyen khoan |
| `paid` | Da thanh toan thanh cong |
| `failed` | Thanh toan that bai, vi du sai so tien |
| `expired` | Payment het han |
| `refund_pending` | Don da thanh toan bi huy, dang cho admin hoan tien thu cong |
| `refunded` | Da hoan tien |

## Bien moi truong lien quan

| Bien | Mo ta |
| --- | --- |
| `SEPAY_BANK_ACCOUNT` | So tai khoan nhan tien |
| `SEPAY_BANK_NAME` | Ten ngan hang nhan tien |
| `SEPAY_WEBHOOK_SECRET` | Secret de verify webhook |
| `SEPAY_PAYMENT_TIMEOUT_MINUTES` | Thoi gian het han payment, mac dinh `15` phut |

## Goi y frontend

- Sau khi tao payment, hien thi `qrData.qrText` lam anh QR.
- Hien thi noi dung chuyen khoan bang `qrData.transferContent`.
- Bat user chuyen dung `amount`.
- Poll `GET /api/payments/{paymentId}/status` moi 3-5 giay.
- Khi status la `SUCCESS`, dieu huong sang man hinh thanh cong/don hang.
- Khi status la `EXPIRED` hoac `FAILED`, order da bi huy va stock/inventory da duoc hoan lai; user can tao don moi.
