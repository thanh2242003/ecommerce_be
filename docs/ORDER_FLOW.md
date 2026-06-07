# Tai lieu luong Order

Tai lieu nay mo ta luong tao don, thanh toan, xu ly don hang va cac trang thai lien quan trong backend hien tai.

## 1. Tong quan

Order co 2 nhom trang thai rieng:

- `status`: trang thai xu ly/vong doi don hang.
- `paymentStatus`: trang thai thanh toan cua don hang.
- `paymentExpiredAt`: han thanh toan cua don online.

Viec tach 2 field nay giup tranh nham lan giua "don hang dang o buoc nao" va "don hang da thanh toan hay chua".

## 2. Trang thai don hang

Field: `order.status`

| Trang thai | Mo ta |
| --- | --- |
| `pending` | Don vua duoc tao; COD cho shop xac nhan ngay, online chi cho shop thay sau khi da thanh toan |
| `confirmed` | Shop da xac nhan don |
| `shipping` | Don dang duoc giao |
| `delivered` | Don da giao thanh cong |
| `cancelled` | Don da bi huy |

## 3. Trang thai thanh toan

Field: `order.paymentStatus`

| Trang thai | Mo ta |
| --- | --- |
| `unpaid` | Don chua bat dau thanh toan |
| `pending` | Da tao payment, dang cho user chuyen khoan |
| `paid` | Thanh toan thanh cong |
| `failed` | Thanh toan that bai |
| `expired` | Payment het han |
| `refund_pending` | Da huy don da thanh toan, dang cho xu ly hoan tien |
| `refunded` | Da hoan tien |

## 4. Luong tao don

API:

```http
POST /v1/api/order/orders
```

Yeu cau dang nhap.

### 4.1 Tao don tu gio hang

Request:

```json
{
  "type": "cart",
  "addressId": "address-id",
  "paymentMethod": "cod"
}
```

Xu ly backend:

1. Kiem tra dia chi co thuoc user khong.
2. Lay cart cua user va populate product.
3. Kiem tra cart khong rong.
4. Kiem tra tat ca san pham trong cart cung mot shop.
5. Kiem tra variant ton tai va du stock.
6. Snapshot thong tin san pham vao order items.
7. Tru stock trong `Product.variants`.
8. Tru ton kho trong `Inventory`.
9. Xoa gio hang.
10. Tao order voi:
    - `status = pending`
    - `paymentMethod = cod` neu la COD
    - `paymentStatus = unpaid` neu la COD
    - `paymentMethod = bank_transfer` neu la online/SePay
    - `paymentStatus = pending` neu la online/SePay
    - `paymentExpiredAt` neu la online/SePay

Voi don online, stock da duoc giu/tru ngay khi tao order, nhung shop chua thay don de xac nhan cho den khi thanh toan thanh cong.

### 4.2 Tao don mua ngay

Request:

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

Xu ly backend:

1. Kiem tra dia chi co thuoc user khong.
2. Kiem tra `productId`, `variantId`, `quantity`.
3. Lay product va variant.
4. Kiem tra stock.
5. Snapshot thong tin san pham vao order items.
6. Tru stock va inventory.
7. Tao order voi:
   - `status = pending`
   - `paymentMethod = cod` va `paymentStatus = unpaid` neu COD
   - `paymentMethod = bank_transfer` va `paymentStatus = pending` neu online/SePay
   - `paymentExpiredAt` neu la online/SePay

Gia tri `paymentMethod` hop le:

| Gia tri | Mo ta |
| --- | --- |
| `cod` | Thanh toan khi nhan hang |
| `bank_transfer` | Thanh toan online qua SePay |
| `online` | Alias, backend map thanh `bank_transfer` |
| `sepay` | Alias, backend map thanh `bank_transfer` |

He thong khong ho tro thanh toan the trong Order Flow. Moi dieu kien nghiep vu chi dung `paymentMethod = cod` hoac `paymentMethod = bank_transfer`.

## 5. Luong thanh toan SePay

Voi don online, sau khi tao order frontend phai lay `order._id` de tao payment SePay. Order online da co `paymentExpiredAt`, nen neu user khong thanh toan dung han thi backend se huy don va hoan stock khi user goi lai API order/payment.

API:

```http
POST /api/payments/sepay/create
```

Request:

```json
{
  "orderId": "order-id"
}
```

Dieu kien:

- Order phai thuoc user dang dang nhap.
- `order.status` phai la `pending`.
- `order.paymentMethod` phai la `bank_transfer`.
- `order.paymentStatus` phai la `pending`.
- `order.finalPrice` phai lon hon `0`.
- Neu da co payment `PENDING` hoac `PROCESSING` chua het han, backend tra lai payment cu.

Sau khi tao payment:

- `order.paymentMethod = bank_transfer`
- `order.paymentStatus = pending`
- `order.paymentExpiredAt = payment.expiredAt`
- `order.transactionId = null`
- `order.paidAt = null`

Khi SePay webhook thanh cong:

- `Payment.status = SUCCESS`
- `order.paymentStatus = paid`
- `order.paidAt = now`
- `order.paymentExpiredAt = null`
- `order.transactionId = payload.id`
- `order.status` khong doi

Neu webhook sai so tien hoac sai transfer type:

- `Payment.status = FAILED`
- `order.paymentStatus = failed`
- `order.status = cancelled`
- Hoan lai stock va inventory.

Neu payment het han:

- `Payment.status = EXPIRED`
- `order.status = cancelled`
- `order.paymentStatus = expired`
- Hoan lai stock va inventory.

Neu webhook SUCCESS den muon sau khi order/payment da dong:

- Cac trang thai bi bo qua: `order.status = cancelled`, hoac `paymentStatus` la `failed`, `expired`, `refund_pending`, `refunded`.
- Backend khong set `paymentStatus = paid`.
- Backend khong set `transactionId`.
- Backend khong doi `order.status`.
- Backend ghi webhook log voi `processResult = order_not_payable` hoac payment da `failed/expired`, sau do return ignored.

## 6. Luong shop xu ly don

### 6.1 Lay danh sach don cua shop

```http
GET /v1/api/shop/orders?page=1&limit=20&status=pending&paymentStatus=paid
```

Query:

| Ten | Mo ta |
| --- | --- |
| `page` | Trang hien tai |
| `limit` | So don moi trang |
| `status` | Loc theo trang thai xu ly don |
| `paymentStatus` | Loc theo trang thai thanh toan |

Mac dinh shop chi thay:

- Don COD: `paymentMethod = cod`
- Don online: chi thay khi `paymentStatus = paid`

Nhu vay don online chua thanh toan se khong vao hang cho shop xac nhan.

### 6.2 Cap nhat trang thai don

```http
PATCH /v1/api/shop/orders/{orderId}/status
```

Request:

```json
{
  "status": "confirmed"
}
```

Transition hop le:

```txt
pending -> confirmed
pending -> cancelled
confirmed -> shipping
confirmed -> cancelled
shipping -> delivered
```

Luu y:

- Don `paymentMethod != cod` phai co `paymentStatus = paid` moi duoc chuyen tu `pending` sang `confirmed`.
- Don `paymentMethod != cod` phai co `paymentStatus = paid` moi duoc chuyen sang `shipping`.
- Don COD khi chuyen sang `delivered` se duoc cap nhat `paymentStatus = paid` va `paidAt`.
- User/shop/admin huy don da thanh toan se cap nhat `paymentStatus = refund_pending`, hoan stock/inventory mot lan.
- Admin hoan tien thu cong ben ngoai he thong, sau do xac nhan de chuyen `paymentStatus = refunded`.
- Don `delivered` va `cancelled` la trang thai ket thuc, khong chuyen tiep nua.

## 7. Luong user huy don

API:

```http
PATCH /v1/api/order/orders/{orderId}/cancel
```

Request:

```json
{
  "cancelReason": "Doi y khong mua nua"
}
```

Dieu kien:

- User phai la chu don.
- Chi huy duoc don co `status = pending` hoac `confirmed`.

Xu ly backend:

- `order.status = cancelled`
- Neu don chua thanh toan, `paymentStatus` giu nguyen gia tri thanh toan hien tai (`unpaid`/`pending`).
- Neu don da thanh toan, `paymentStatus = refund_pending` de tranh hoan tien tu dong ngoai y muon.
- Gan:
  - `cancelReason`
  - `cancelledAt`
  - `cancelledBy = user`
- Hoan lai stock trong product variant.
- Hoan lai inventory.

## 8. Luong timeout thanh toan

Khi user goi cac API payment nhu:

```http
GET /api/payments/{paymentId}/status
GET /api/payments/history
POST /api/payments/sepay/create
```

Backend se kiem tra cac payment pending/processing da qua `expiredAt`.

Backend cung kiem tra cac order online qua han thanh toan:

- `paymentMethod = bank_transfer`
- `paymentStatus = pending`
- `paymentExpiredAt <= now`

Neu payment het han:

1. `Payment.status = EXPIRED`
2. `order.status = cancelled`
3. `order.paymentStatus = expired`
4. `cancelReason = Payment timeout`
5. `cancelledBy = admin`
6. Hoan lai stock va inventory.

Neu user tao order online nhung chua goi API tao payment, order van co `paymentExpiredAt`. Khi user goi lai API order/payment, backend se huy order qua han va hoan stock.

## 9. Luong admin quan ly don

### 9.1 Lay danh sach don

```http
GET /v1/api/admin/orders?status=pending&paymentStatus=paid&page=1&limit=20
```

Admin co the filter:

- `status`
- `paymentStatus`
- `page`
- `limit`

### 9.2 Cap nhat trang thai don

```http
PATCH /v1/api/admin/orders/{orderId}/status
```

Request:

```json
{
  "status": "confirmed",
  "note": "Admin confirmed order"
}
```

Admin update status dung chung state machine voi shop. Neu admin huy don da thanh toan, backend set:

- `status = cancelled`
- `paymentStatus = refund_pending`
- `stockRestoredAt = now` neu stock chua tung duoc hoan

### 9.3 Xac nhan da hoan tien thu cong

```http
PATCH /v1/api/admin/orders/{orderId}/refund/complete
```

Request:

```json
{
  "note": "Refunded manually via bank transfer"
}
```

Dieu kien:

- `order.status = cancelled`
- `order.paymentStatus = refund_pending`

Xu ly:

- `order.paymentStatus = refunded`
- `order.refundedAt = now`
- Neu goi lai khi da `refunded`, API tra ve order hien tai va khong refund lap.

## 10. State machine cuoi cung

### 10.1 Order status transitions

| Current | Allowed next |
| --- | --- |
| `pending` | `confirmed`, `cancelled` |
| `confirmed` | `shipping`, `cancelled` |
| `shipping` | `delivered` |
| `delivered` | Khong co |
| `cancelled` | Khong co |

Transition khong hop le:

- `pending -> delivered`
- `shipping -> pending`
- `cancelled -> confirmed`
- `delivered -> confirmed`
- `delivered -> cancelled`
- `cancelled -> delivered`

### 10.2 Payment status transitions

| Current | Trigger | Next |
| --- | --- | --- |
| `unpaid` | COD delivered | `paid` |
| `pending` | SePay webhook success | `paid` |
| `pending` | SePay webhook invalid/sai tien | `failed` |
| `pending` | Qua han thanh toan | `expired` |
| `paid` | User/shop/admin huy don da thanh toan | `refund_pending` |
| `refund_pending` | Admin xac nhan da hoan tien thu cong | `refunded` |
| `refunded` | Goi refund lai | Giu `refunded` |

Khong dung `paymentStatus = cancelled`; order bi huy duoc bieu dien bang `status = cancelled`.

## 11. Idempotency va chong double processing

| Truong hop | Cach xu ly |
| --- | --- |
| Webhook SePay goi lap | Co `WebhookLog.eventId`, payment `SUCCESS` tra duplicate |
| Webhook SUCCESS den muon | Neu order da `cancelled` hoac paymentStatus da `failed/expired/refund_pending/refunded`, webhook bi log va ignored |
| User bam thanh toan nhieu lan | Neu co payment `PENDING/PROCESSING` chua het han thi tra payment cu |
| Payment timeout lap | Order da `cancelled` thi khong xu ly lai |
| Payment fail lap | Order da `cancelled` thi khong xu ly lai |
| Hoan stock lap | Co `stockRestoredAt`; da hoan thi khong cong stock/inventory nua |
| Refund lap | API complete refund tra ve order hien tai neu da `refunded`; `refundedAt` giu nguyen |
| Shop xac nhan nhieu lan | Neu status moi trung status hien tai thi return order hien tai |
| COD delivered | Set `paymentStatus = paid` mot lan, giu `paidAt` neu da co |

## 12. API lien quan den order

| Method | Endpoint | Mo ta |
| --- | --- | --- |
| `POST` | `/v1/api/order/orders` | User tao don |
| `GET` | `/v1/api/order/orders` | User lay danh sach don cua minh |
| `GET` | `/v1/api/order/orders/{id}` | User lay chi tiet don |
| `PATCH` | `/v1/api/order/orders/{id}/cancel` | User huy don |
| `GET` | `/v1/api/shop/orders` | Shop lay danh sach don |
| `GET` | `/v1/api/shop/orders/{id}` | Shop lay chi tiet don |
| `PATCH` | `/v1/api/shop/orders/{id}/status` | Shop cap nhat trang thai don |
| `GET` | `/v1/api/admin/orders` | Admin lay danh sach don |
| `GET` | `/v1/api/admin/orders/{id}` | Admin lay chi tiet don |
| `PATCH` | `/v1/api/admin/orders/{id}/status` | Admin cap nhat trang thai don |
| `PATCH` | `/v1/api/admin/orders/{id}/refund/complete` | Admin xac nhan da hoan tien thu cong |
| `POST` | `/api/payments/sepay/create` | Tao thanh toan SePay cho order |
| `GET` | `/api/payments/{paymentId}/status` | Kiem tra trang thai payment |
| `POST` | `/api/payments/sepay/webhook` | Webhook SePay xac nhan giao dich |

## 13. Tom tat flow chinh

```txt
User tao order
  -> order.status = pending
  -> COD: order.paymentStatus = unpaid, shop thay don ngay
  -> Online: order.paymentStatus = pending, order.paymentExpiredAt duoc set, shop chua thay don

User tao SePay payment
  -> order.paymentStatus = pending

SePay webhook thanh cong
  -> order.paymentStatus = paid
  -> order.status giu nguyen pending
  -> shop bat dau thay don de xac nhan

Shop xac nhan don
  -> order.status = confirmed

Shop giao hang
  -> chi cho phep neu bank_transfer da paid
  -> order.status = shipping

Giao thanh cong
  -> order.status = delivered
  -> Neu COD: order.paymentStatus = paid, paidAt = now

Payment fail/timeout
  -> order.status = cancelled
  -> order.paymentStatus = failed/expired
  -> hoan lai stock va inventory

User/shop/admin huy don da paid
  -> order.status = cancelled
  -> order.paymentStatus = refund_pending
  -> stockRestoredAt chi set mot lan

Admin hoan tien thu cong xong
  -> order.paymentStatus = refunded
  -> refundedAt = now
```
