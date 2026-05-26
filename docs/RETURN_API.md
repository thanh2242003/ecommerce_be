# Return / Refund API Documentation

## Overview

The return feature allows users to request returns for delivered orders within 3 days of delivery. Returns require admin approval before processing.

### Return Status Flow

```
pending (user created) → approved (admin confirmed) → returned (user sent back) → completed (refund processed)
                      ↓
                    rejected (admin denied)
                    
cancelled (user can cancel if pending or approved)
```

---

## User Endpoints

### 1. Create Return Request

**POST** `/v1/api/return/request`

Create a new return request for an order.

**Conditions:**
- Order status must be "delivered"
- Return must be initiated within 3 days of delivery
- Only one active return per order

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "orderId": "64f1a8c9d5e2f3a4b5c6d7e8",
  "reason": "defective",
  "description": "Product stopped working after 2 days",
  "returnItems": [
    {
      "variantId": "64f1a8c9d5e2f3a4b5c6d7e9",
      "quantity": 1
    }
  ]
}
```

**Parameters:**
- `orderId` (required): Order ID to return
- `reason` (required): Reason for return (e.g., 'defective', 'wrong_product', 'not_as_described', 'changed_mind', 'other')
- `description` (optional): Detailed description of the issue
- `returnItems` (optional): Specific items to return. If empty, all items will be returned.
  - `variantId`: Variant ID from the order
  - `quantity`: Number of items to return (must not exceed ordered quantity)

**Response (201):**
```json
{
  "code": 201,
  "message": "Return request created successfully",
  "metadata": {
    "returnId": "64f1b9d9e5f3g4a5b6c7d8e9",
    "orderId": "64f1a8c9d5e2f3a4b5c6d7e8",
    "userId": "64f1a8c9d5e2f3a4b5c6d7e0",
    "shopId": "64f1a8c9d5e2f3a4b5c6d7e1",
    "reason": "defective",
    "description": "Product stopped working after 2 days",
    "returnItems": [
      {
        "productId": "64f1a8c9d5e2f3a4b5c6d7e2",
        "variantId": "64f1a8c9d5e2f3a4b5c6d7e9",
        "productName": "Wireless Headphones",
        "quantity": 1,
        "price": 99.99
      }
    ],
    "returnPrice": 99.99,
    "status": "pending",
    "requestedAt": "2024-05-21T10:00:00Z",
    "approvedAt": null,
    "returnedAt": null,
    "completedAt": null,
    "cancelledAt": null
  }
}
```

**Error Responses:**
- `400`: Order not eligible (not delivered, or outside 3-day window), return already exists, invalid items
- `404`: Order not found

---

### 2. Get All Return Requests

**GET** `/v1/api/return/requests`

Get all return requests for the current user.

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `status` (optional): Filter by status (pending, approved, rejected, returned, completed, cancelled)

**Response (200):**
```json
{
  "code": 200,
  "message": "Get return requests successfully",
  "metadata": [
    {
      "returnId": "64f1b9d9e5f3g4a5b6c7d8e9",
      "orderId": "64f1a8c9d5e2f3a4b5c6d7e8",
      "userId": "64f1a8c9d5e2f3a4b5c6d7e0",
      "shopId": "64f1a8c9d5e2f3a4b5c6d7e1",
      "reason": "defective",
      "description": "Product stopped working after 2 days",
      "returnItems": [...],
      "returnPrice": 99.99,
      "status": "pending",
      "requestedAt": "2024-05-21T10:00:00Z"
    }
  ]
}
```

---

### 3. Get Return Request Details

**GET** `/v1/api/return/requests/:id`

Get detailed information about a specific return request.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "code": 200,
  "message": "Get return request successfully",
  "metadata": {
    "returnId": "64f1b9d9e5f3g4a5b6c7d8e9",
    "orderId": "64f1a8c9d5e2f3a4b5c6d7e8",
    "userId": "64f1a8c9d5e2f3a4b5c6d7e0",
    "shopId": "64f1a8c9d5e2f3a4b5c6d7e1",
    "reason": "defective",
    "description": "Product stopped working after 2 days",
    "returnItems": [...],
    "returnPrice": 99.99,
    "status": "approved",
    "adminId": "64f1c8d8e5f3f4a5b6c7d8e2",
    "approvalReason": "Approved for defective product",
    "requestedAt": "2024-05-21T10:00:00Z",
    "approvedAt": "2024-05-21T11:00:00Z",
    "returnedAt": null,
    "completedAt": null
  }
}
```

**Error Responses:**
- `404`: Return request not found

---

### 4. Mark Return as Returned

**PATCH** `/v1/api/return/requests/:id/mark-returned`

User marks the return package as sent back (after admin approves).

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "trackingNumber": "TRACK123456789"
}
```

**Parameters:**
- `trackingNumber` (optional): Tracking number for the returned package

**Response (200):**
```json
{
  "code": 200,
  "message": "Return marked as returned successfully",
  "metadata": {
    "returnId": "64f1b9d9e5f3g4a5b6c7d8e9",
    "status": "returned",
    "returnedAt": "2024-05-21T12:00:00Z",
    "notes": "Tracking: TRACK123456789"
  }
}
```

**Error Responses:**
- `400`: Return must be in "approved" status first
- `404`: Return request not found

---

### 5. Cancel Return Request

**PATCH** `/v1/api/return/requests/:id/cancel`

User cancels a return request (only if pending or approved).

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "code": 200,
  "message": "Return request cancelled successfully",
  "metadata": {
    "returnId": "64f1b9d9e5f3g4a5b6c7d8e9",
    "status": "cancelled",
    "cancelledAt": "2024-05-21T12:00:00Z"
  }
}
```

**Error Responses:**
- `400`: Cannot cancel returns with status "returned", "completed", or "rejected"
- `404`: Return request not found

---

## Admin Endpoints

### 1. Get All Return Requests (Admin)

**GET** `/v1/api/admin/returns`

Get all return requests for admin review.

**Headers:**
```
Authorization: Bearer {admin_token}
```

**Query Parameters:**
- `shopId` (optional): Filter by shop
- `status` (optional): Filter by status (pending, approved, rejected, returned, completed)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response (200):**
```json
{
  "code": 200,
  "message": "Get return requests successfully",
  "metadata": {
    "data": [
      {
        "returnId": "64f1b9d9e5f3g4a5b6c7d8e9",
        "orderId": "64f1a8c9d5e2f3a4b5c6d7e8",
        "userId": "64f1a8c9d5e2f3a4b5c6d7e0",
        "shopId": "64f1a8c9d5e2f3a4b5c6d7e1",
        "reason": "defective",
        "returnItems": [...],
        "returnPrice": 99.99,
        "status": "pending",
        "requestedAt": "2024-05-21T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

---

### 2. Approve Return Request

**PATCH** `/v1/api/admin/returns/:id/approve`

Admin approves a return request.

**Headers:**
```
Authorization: Bearer {admin_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "approvalReason": "Approved - Valid defect claim"
}
```

**Parameters:**
- `approvalReason` (optional): Reason for approval

**Response (200):**
```json
{
  "code": 200,
  "message": "Return request approved successfully",
  "metadata": {
    "returnId": "64f1b9d9e5f3g4a5b6c7d8e9",
    "status": "approved",
    "adminId": "64f1c8d8e5f3f4a5b6c7d8e2",
    "approvalReason": "Approved - Valid defect claim",
    "approvedAt": "2024-05-21T11:00:00Z"
  }
}
```

**Error Responses:**
- `400`: Return must be in "pending" status
- `404`: Return request not found

---

### 3. Reject Return Request

**PATCH** `/v1/api/admin/returns/:id/reject`

Admin rejects a return request.

**Headers:**
```
Authorization: Bearer {admin_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "approvalReason": "Rejected - User error, not a defect"
}
```

**Parameters:**
- `approvalReason` (required): Reason for rejection

**Response (200):**
```json
{
  "code": 200,
  "message": "Return request rejected successfully",
  "metadata": {
    "returnId": "64f1b9d9e5f3g4a5b6c7d8e9",
    "status": "rejected",
    "adminId": "64f1c8d8e5f3f4a5b6c7d8e2",
    "approvalReason": "Rejected - User error, not a defect",
    "approvedAt": "2024-05-21T11:00:00Z"
  }
}
```

**Error Responses:**
- `400`: Return must be in "pending" status
- `404`: Return request not found

---

### 4. Complete Return Request

**PATCH** `/v1/api/admin/returns/:id/complete`

Admin completes a return (processes refund).

**Headers:**
```
Authorization: Bearer {admin_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "refundAmount": 99.99
}
```

**Parameters:**
- `refundAmount` (optional): Refund amount. If provided and different from requested, it becomes a partial refund.

**Response (200):**
```json
{
  "code": 200,
  "message": "Return completed successfully",
  "metadata": {
    "returnId": "64f1b9d9e5f3g4a5b6c7d8e9",
    "status": "completed",
    "adminId": "64f1c8d8e5f3f4a5b6c7d8e2",
    "returnPrice": 99.99,
    "completedAt": "2024-05-21T14:00:00Z"
  }
}
```

**Error Responses:**
- `400`: Return must be in "returned" status
- `404`: Return request not found

---

### 5. Admin Cancel Return Request

**PATCH** `/v1/api/admin/returns/:id/cancel`

Admin can cancel (force-cancel) a return request.

**Headers:**
```
Authorization: Bearer {admin_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "reason": "Optional reason for admin cancellation"
}
```

**Behavior & Rules:**
- Admin may cancel returns when the return status is `pending`, `approved`, or `returned`.
- Cancelling sets the return status to `cancelled`, records `adminId`, `approvalReason` (if provided), and `cancelledAt` timestamp.

**Response (200):**
```json
{
  "code": 200,
  "message": "Return request cancelled by admin successfully",
  "metadata": {
    "returnId": "64f1b9d9e5f3g4a5b6c7d8e9",
    "status": "cancelled",
    "adminId": "64f1c8d8e5f3f4a5b6c7d8e2",
    "approvalReason": "Optional reason",
    "cancelledAt": "2024-05-21T12:00:00Z"
  }
}
```

**Error Responses:**
- `400`: Cannot cancel return with current status (only `pending`/`approved`/`returned` allowed)
- `404`: Return request not found


## Summary of Status Transitions

```
User Creates Return Request
         ↓
    Status: pending
         ↓
   [Admin Reviews]
         ↓
    ┌────┴────┐
    ↓         ↓
approved    rejected
    ↓
Status: approved
    ↓
[User Ships Products]
    ↓
Mark as Returned
    ↓
Status: returned
    ↓
[Admin Inspects & Processes Refund]
    ↓
Complete Return
    ↓
Status: completed

At any time (if pending/approved):
    → User can Cancel Return
    → Status: cancelled
```

---

## Error Codes

| Code | Message | Cause |
|------|---------|-------|
| 400 | Cannot return order with status "X" | Order must be delivered |
| 400 | Return window has expired | More than 3 days since delivery |
| 400 | Return request already exists | Already an active return for this order |
| 400 | Item not found in order | Invalid variantId in returnItems |
| 400 | Cannot return X items | Quantity exceeds ordered quantity |
| 400 | No items selected for return | returnItems is empty and no default behavior |
| 400 | Cannot approve/reject return with status "X" | Return not in "pending" status |
| 400 | Cannot complete return | Return not in "returned" status |
| 404 | Order not found | Order doesn't exist or doesn't belong to user |
| 404 | Return request not found | Return ID doesn't exist or user has no access |

---

## Example Workflow

1. **User initiates return:**
   ```bash
   POST /v1/api/return/request
   Body: { orderId, reason, description, returnItems }
   Response: returnId, status="pending"
   ```

2. **Admin reviews and approves:**
   ```bash
   PATCH /v1/api/admin/returns/:id/approve
   Body: { approvalReason }
   Response: status="approved"
   ```

3. **User sends back products:**
   ```bash
   PATCH /v1/api/return/requests/:id/mark-returned
   Body: { trackingNumber }
   Response: status="returned"
   ```

4. **Admin completes return & processes refund:**
   ```bash
   PATCH /v1/api/admin/returns/:id/complete
   Body: { refundAmount }
   Response: status="completed"
   ```
