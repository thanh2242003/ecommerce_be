# Cancel Order API

This document describes the API to allow a user to cancel their own order.

**Endpoint**: `PATCH /v1/api/order/orders/:id/cancel`

**Authentication**: Required — user must be authenticated (token via `authenticationV2`).

**Permissions**: Only the order owner (`userId` on the order) may cancel the order.

**Allowed order statuses for cancellation**:
- `pending`
- `confirmed`

If the order is in any of these statuses, cancellation is NOT allowed and the API returns an error:
- `processing`
- `shipped`
- `delivered`
- `cancelled`


## Request

Path parameters:
- `id` — the order id to cancel

Body (JSON):
- `cancelReason` (optional): string — reason provided by the user

Example:

```json
PATCH /v1/api/order/orders/610c2b.../cancel
Content-Type: application/json
Authorization: Bearer <token>

{
  "cancelReason": "Changed my mind"
}
```


## Behavior / Side effects
- Verifies that the authenticated user owns the order (single DB lookup).
- Verifies the current `status` is `pending` or `confirmed`; otherwise returns error.
- Performs the following updates inside a MongoDB transaction:
  - `status` -> `cancelled`
  - `cancelReason` -> provided value or `null`
  - `cancelledAt` -> current timestamp
  - `cancelledBy` -> `'user'`
  - For each order item:
    - Increment the matching `Product.variants.$.stock` by the cancelled quantity.
    - Decrement `Product.salesNumber` by the cancelled quantity.
    - Increment `Inventory.totalQuantity` for the product/shop by the cancelled quantity.
- Does NOT delete the order document.


## Successful response

HTTP 200

```json
{
  "status": "success",
  "message": "Order cancelled successfully",
  "metadata": {
    "_id": "610c2b...",
    "status": "cancelled",
    "cancelReason": "Changed my mind",
    "cancelledAt": "2026-05-17T12:34:56.789Z",
    "cancelledBy": "user",
    ...other order fields
  }
}
```


## Error cases
- 400 Bad Request — when the current order status forbids cancellation. Example message: `Cannot cancel order with status "processing"`.
- 404 Not Found — when the order does not exist or does not belong to the authenticated user.
- 500 Internal Server Error — if an unexpected error occurs while restoring stock or updating records.


## Modified files (implementation reference)
- [src/models/order.model.js](src/models/order.model.js#L1) — added `cancelReason`, `cancelledAt`, `cancelledBy` fields
- [src/routes/order/index.js](src/routes/order/index.js#L1) — added `PATCH /orders/:id/cancel` route
- [src/controllers/order.controller.js](src/controllers/order.controller.js#L1) — added `cancelOrder` controller method
- [src/services/order.service.js](src/services/order.service.js#L1) — added `cancelOrder` service implementing the transactional rollback of stock/inventory


## Curl example

```bash
curl -X PATCH \
  "http://localhost:3000/v1/api/order/orders/610c2b.../cancel" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"cancelReason":"Changed my mind"}'
```


## Notes & recommendations
- The operation is transactional; if inventory/stock updates fail the order update will be rolled back.
- If you want shops or admins to be able to cancel orders later, add corresponding API endpoints and set `cancelledBy` to `shop` or `admin`.
- Consider emitting a notification (push/email) after successful cancellation (the current implementation attempts notifications only on order creation).

