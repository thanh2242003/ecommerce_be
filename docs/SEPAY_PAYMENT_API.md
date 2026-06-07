# SePay Payment API

## Base

- Protected APIs require:
  - `x-client-id`
  - `authorization` (access token)

## 1) Create SePay Transaction

`POST /api/payments/sepay/create`

Request:

```json
{
  "orderId": "6834f9479f65a6f4623e8f23"
}
```

Response `201`:

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
      "qrText": "BANK:Vietcombank|ACCOUNT:1017588888|AMOUNT:350000|CONTENT:OD3E8F2301020304"
    },
    "createdAt": "2026-05-27T08:45:00.000Z",
    "updatedAt": "2026-05-27T08:45:00.000Z"
  }
}
```

## 2) Get Payment Status

`GET /api/payments/:paymentId/status`

Response `200`:

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

## 3) SePay Webhook

`POST /api/payments/sepay/webhook`

Headers:

- `x-sepay-signature`
- `x-sepay-timestamp`
- `content-type: application/json`

Payload example:

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

Success response (must be accepted by SePay):

```json
{
  "success": true
}
```

## 4) Payment History

`GET /api/payments/history?page=1&limit=10`

Response `200`:

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

## Status Definitions

- `PENDING`: Created, waiting for transfer.
- `PROCESSING`: Callback is being processed.
- `SUCCESS`: Payment verified and `order.paymentStatus` marked `paid`.
- `FAILED`: Callback invalid or amount mismatch.
- `EXPIRED`: Timed out, order cancelled.
