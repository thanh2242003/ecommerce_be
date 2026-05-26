# Return Feature - Quick Reference Guide

## Implementation Summary

A complete return/refund system has been added to your e-learning backend. This allows users to request returns for delivered orders within 3 days, with admin approval workflow.

## Key Features

✅ **User-Initiated Returns**
- Users can create return requests for delivered orders
- Returns available only within 3 days of delivery
- Specific items can be returned or entire order

✅ **Admin Approval Workflow**
- Admin can approve or reject return requests
- Detailed approval/rejection reasons
- Track return status through each stage

✅ **Refund Processing**
- Admin marks returns as received
- Process full or partial refunds
- Complete tracking from request to completion

## Files Created/Modified

### New Files
```
src/models/return.model.js              # Return request database schema
src/services/return.service.js          # Business logic for returns
src/controllers/return.controller.js    # User-facing return endpoints
src/controllers/admin.return.controller.js  # Admin return management
src/routes/return/index.js              # Return routes (user)
docs/RETURN_API.md                      # Complete API documentation
```

### Modified Files
```
src/routes/admin/index.js               # Added admin return routes
src/routes/index.js                     # Registered return routes
```

## API Endpoints Overview

### User Endpoints (Require Authentication)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/v1/api/return/request` | Create return request |
| GET | `/v1/api/return/requests` | Get all user's returns |
| GET | `/v1/api/return/requests/:id` | Get return details |
| PATCH | `/v1/api/return/requests/:id/cancel` | Cancel return |
| PATCH | `/v1/api/return/requests/:id/mark-returned` | Mark as returned |

### Admin Endpoints (Require Admin Auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/api/admin/returns` | List all returns (with filters) |
| PATCH | `/v1/api/admin/returns/:id/approve` | Approve return request |
| PATCH | `/v1/api/admin/returns/:id/reject` | Reject return request |
| PATCH | `/v1/api/admin/returns/:id/complete` | Complete return & process refund |
| PATCH | `/v1/api/admin/returns/:id/cancel` | Cancel return request (admin) |

## Return Status Flow

```
User Request (pending)
    ↓
Admin Decision
    ├─→ Approved (approved)
    │       ↓
    │   User Sends Package (returned)
    │       ↓
    │   Admin Completes (completed)
    │
    └─→ Rejected (rejected)

At any time (pending/approved):
    └─→ Cancelled by User (cancelled)

Admin may also cancel a return request when its status is `pending`, `approved`, or `returned`.
```

## Example Usage

### 1. Create a Return Request
```bash
curl -X POST http://localhost:8000/v1/api/return/request \
  -H "Authorization: Bearer {user_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "64f1a8c9d5e2f3a4b5c6d7e8",
    "reason": "defective",
    "description": "Product stopped working after 2 days",
    "returnItems": [
      {
        "variantId": "64f1a8c9d5e2f3a4b5c6d7e9",
        "quantity": 1
      }
    ]
  }'
```

### 2. Get Return Status
```bash
curl -X GET http://localhost:8000/v1/api/return/requests \
  -H "Authorization: Bearer {user_token}"
```

### 3. Admin Approves Return
```bash
curl -X PATCH http://localhost:8000/v1/api/admin/returns/:id/approve \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "approvalReason": "Approved - Valid defect claim"
  }'
```

### 4. Mark Return Package Sent
```bash
curl -X PATCH http://localhost:8000/v1/api/return/requests/:id/mark-returned \
  -H "Authorization: Bearer {user_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "trackingNumber": "TRACK123456789"
  }'
```

### 5. Admin Completes Return
```bash
curl -X PATCH http://localhost:8000/v1/api/admin/returns/:id/complete \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "refundAmount": 99.99
  }'
```

## Business Rules

1. **Return Window**: 3 days from delivery date
2. **Eligibility**: Only "delivered" orders can be returned
3. **One Active Return per Order**: Cannot have multiple return requests for same order
4. **Admin Approval Required**: All returns need admin confirmation before processing
5. **Partial Returns**: Can return specific items from an order
6. **Cancellation**: Users can cancel returns if status is "pending" or "approved"
7. **Admin Cancellation**: Admins can cancel a return when it's `pending`, `approved`, or `returned` (records adminId and reason).

## Database Schema

### Return Model Fields
- `orderId`: Reference to order
- `userId`: Reference to user who requested return
- `shopId`: Reference to shop selling the items
- `reason`: Reason for return
- `description`: Detailed description
- `returnItems`: Array of items being returned
- `returnPrice`: Refund amount
- `status`: Current status (enum)
- `adminId`: Admin who handled the request
- `approvalReason`: Reason for approval/rejection
- `requestedAt`, `approvedAt`, `returnedAt`, `completedAt`: Timestamps
- `notes`: Additional notes/tracking info

## Integration with Existing Systems

✅ Integrated with:
- User authentication (uses `authenticationV2`)
- Admin authentication (uses `verifyAdmin`)
- Order model (returns reference orders)
- Error handling (uses project's error response format)
- Success responses (uses project's success response format)

## Next Steps (Optional Enhancements)

1. **Notification System**: Send notifications when return status changes
   - User notifications when approved/rejected
   - Admin notifications when return is marked as "returned"

2. **Partial Refunds**: Support automatic partial refunds based on return reason

3. **Return History**: Add analytics for return trends by product/reason

4. **Automated Return Window**: Calculate and validate 3-day window automatically

5. **Shipping Integration**: Generate return shipping labels

6. **Inventory Restoration**: Automatically restore inventory when return is completed

## Troubleshooting

### Return Window Expired Error
- Make sure order status is "delivered"
- Check if 3 days have passed since delivery
- Timestamp comparison is based on order `updatedAt` field

### "Return Already Exists" Error
- Check for existing non-cancelled returns
- User must cancel existing return before creating a new one

### Admin Cannot Approve
- Verify return status is "pending"
- Check admin authentication is valid

### Cannot Mark as Returned
- Return must first be in "approved" status
- User must wait for admin approval before marking as returned

## Files Location Reference

```
e:\DATN\BE-Learning-master\
├── src/
│   ├── models/
│   │   └── return.model.js
│   ├── services/
│   │   └── return.service.js
│   ├── controllers/
│   │   ├── return.controller.js
│   │   └── admin.return.controller.js
│   └── routes/
│       ├── return/
│       │   └── index.js
│       └── admin/
│           └── index.js (modified)
└── docs/
    └── RETURN_API.md
```

## Testing Checklist

- [ ] Create return request for delivered order
- [ ] Verify 3-day return window validation
- [ ] Verify cannot create return for non-delivered order
- [ ] Create multiple return requests and verify only one active per order
- [ ] Admin approves return request
- [ ] Admin rejects return request with reason
- [ ] User cancels pending return
- [ ] User marks return as returned with tracking number
- [ ] Admin completes return with refund amount
 - [ ] Admin completes return with refund amount
 - [ ] Admin cancels return request (force cancel)
- [ ] Test partial refund vs full refund
- [ ] Verify pagination in admin list endpoint
- [ ] Test filtering by status and shop

---

For complete endpoint details, see: [RETURN_API.md](RETURN_API.md)
