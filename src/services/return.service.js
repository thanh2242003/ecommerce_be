'use strict';

const Return = require('../models/return.model');
const Order = require('../models/order.model');
const Product = require('../models/product.model');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../core/error.response');

const RETURN_WINDOW_DAYS = 3; // 3 days to initiate return after delivery

class ReturnService {

    /**
     * Check if an order is eligible for return
     * - Order status must be 'delivered'
     * - Must be within 3 days of delivery
     */
    static async canReturnOrder(orderId, userId) {
        const order = await Order.findOne({ _id: orderId, userId });
        
        if (!order) {
            throw new NotFoundError('Order not found or does not belong to the user');
        }

        if (order.status !== 'delivered') {
            throw new BadRequestError(`Cannot return order with status "${order.status}". Order must be delivered first.`);
        }

        // Check if return window is still open (3 days)
        const deliveryTime = order.updatedAt;
        const now = new Date();
        const daysSinceDelivery = (now - deliveryTime) / (1000 * 60 * 60 * 24);

        if (daysSinceDelivery > RETURN_WINDOW_DAYS) {
            throw new BadRequestError(`Return window has expired. Returns are only allowed within ${RETURN_WINDOW_DAYS} days of delivery.`);
        }

        return order;
    }

    /**
     * Check if return request already exists for an order
     */
    static async checkExistingReturn(orderId) {
        const existingReturn = await Return.findOne({
            orderId,
            status: { $ne: 'cancelled' }
        });

        if (existingReturn) {
            throw new BadRequestError('A return request already exists for this order. Please wait for admin response.');
        }
    }

    /**
     * Create a new return request
     * 
     * Body: {
     *   orderId: ObjectId,
     *   reason: string (required), // 'defective', 'wrong_product', 'not_as_described', 'changed_mind', 'other'
     *   description: string,
     *   returnItems: [ { variantId, quantity }, ... ], // If empty, return all items
     * }
     */
    static async createReturn({ userId, orderId, reason, description, returnItems }) {
        // Validate order eligibility
        const order = await this.canReturnOrder(orderId, userId);

        // Check if return already exists
        await this.checkExistingReturn(orderId);

        // Determine which items to return
        let itemsToReturn = [];
        let totalReturnPrice = 0;

        if (!returnItems || returnItems.length === 0) {
            // Return all items
            itemsToReturn = order.items.map(item => ({
                productId: item.productId,
                variantId: item.variantId,
                productName: item.productName,
                quantity: item.quantity,
                price: item.price
            }));

            totalReturnPrice = order.finalPrice;
        } else {
            // Return specific items
            for (const requestItem of returnItems) {
                const orderItem = order.items.find(item => 
                    String(item.variantId) === String(requestItem.variantId)
                );

                if (!orderItem) {
                    throw new BadRequestError(`Item with variantId ${requestItem.variantId} not found in order`);
                }

                if (requestItem.quantity > orderItem.quantity) {
                    throw new BadRequestError(
                        `Cannot return ${requestItem.quantity} items. Only ${orderItem.quantity} were ordered.`
                    );
                }

                itemsToReturn.push({
                    productId: orderItem.productId,
                    variantId: orderItem.variantId,
                    productName: orderItem.productName,
                    quantity: requestItem.quantity,
                    price: orderItem.price
                });

                totalReturnPrice += orderItem.price * requestItem.quantity;
            }
        }

        if (itemsToReturn.length === 0) {
            throw new BadRequestError('No items selected for return');
        }

        // Create return request
        const returnRequest = new Return({
            orderId,
            userId,
            shopId: order.shopId,
            reason,
            description,
            returnItems: itemsToReturn,
            returnPrice: totalReturnPrice,
            status: 'pending',
            requestedAt: new Date()
        });

        await returnRequest.save();

        return this.formatReturnResponse(returnRequest);
    }

    /**
     * Get all return requests for a user
     */
    static async getReturnsByUser({ userId, status }) {
        const query = { userId };

        if (status) {
            query.status = status;
        }

        const returns = await Return.find(query)
            .populate('orderId', 'orderCode items status')
            .populate('shopId', 'name')
            .sort({ requestedAt: -1 });

        return returns.map(ret => this.formatReturnResponse(ret));
    }

    /**
     * Get return request details
     */
    static async getReturnById({ returnId, userId }) {
        const returnRequest = await Return.findOne({ _id: returnId, userId })
            .populate('orderId')
            .populate('shopId', 'name')
            .populate('adminId', 'email');

        if (!returnRequest) {
            throw new NotFoundError('Return request not found');
        }

        return this.formatReturnResponse(returnRequest);
    }

    /**
     * Get all returns for admin (shop or system admin)
     */
    static async getReturnsForAdmin({ shopId, status, page = 1, limit = 10 }) {
        const query = {};

        if (shopId) {
            query.shopId = shopId;
        }

        if (status) {
            query.status = status;
        }

        const skip = (page - 1) * limit;

        const [returns, total] = await Promise.all([
            Return.find(query)
                .populate('orderId', 'orderCode items status')
                .populate('userId', 'email fullName')
                .populate('shopId', 'name')
                .sort({ requestedAt: -1 })
                .skip(skip)
                .limit(limit),
            Return.countDocuments(query)
        ]);

        return {
            data: returns.map(ret => this.formatReturnResponse(ret)),
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Admin approves return request
     */
    static async approveReturn({ returnId, adminId, approvalReason = '' }) {
        const returnRequest = await Return.findById(returnId);

        if (!returnRequest) {
            throw new NotFoundError('Return request not found');
        }

        if (returnRequest.status !== 'pending') {
            throw new BadRequestError(`Cannot approve return with status "${returnRequest.status}". Only pending returns can be approved.`);
        }

        returnRequest.status = 'approved';
        returnRequest.adminId = adminId;
        returnRequest.approvalReason = approvalReason;
        returnRequest.approvedAt = new Date();

        await returnRequest.save();

        return this.formatReturnResponse(returnRequest);
    }

    /**
     * Admin rejects return request
     */
    static async rejectReturn({ returnId, adminId, approvalReason = '' }) {
        const returnRequest = await Return.findById(returnId);

        if (!returnRequest) {
            throw new NotFoundError('Return request not found');
        }

        if (returnRequest.status !== 'pending') {
            throw new BadRequestError(`Cannot reject return with status "${returnRequest.status}". Only pending returns can be rejected.`);
        }

        returnRequest.status = 'rejected';
        returnRequest.adminId = adminId;
        returnRequest.approvalReason = approvalReason;
        returnRequest.approvedAt = new Date();

        await returnRequest.save();

        return this.formatReturnResponse(returnRequest);
    }

    /**
     * User marks return as "returned" (products sent back)
     */
    static async markAsReturned({ returnId, userId, trackingNumber = '' }) {
        const returnRequest = await Return.findOne({ _id: returnId, userId });

        if (!returnRequest) {
            throw new NotFoundError('Return request not found');
        }

        if (returnRequest.status !== 'approved') {
            throw new BadRequestError(`Cannot mark as returned. Return must be approved first.`);
        }

        returnRequest.status = 'returned';
        returnRequest.returnedAt = new Date();
        returnRequest.notes = trackingNumber ? `Tracking: ${trackingNumber}` : '';

        await returnRequest.save();

        return this.formatReturnResponse(returnRequest);
    }

    /**
     * Admin completes return (processes refund)
     */
    static async completeReturn({ returnId, adminId, refundAmount = null }) {
        const returnRequest = await Return.findById(returnId);

        if (!returnRequest) {
            throw new NotFoundError('Return request not found');
        }

        if (returnRequest.status !== 'returned') {
            throw new BadRequestError(`Cannot complete return. Return must be marked as "returned" first.`);
        }

        returnRequest.status = 'completed';
        returnRequest.adminId = adminId;
        returnRequest.completedAt = new Date();

        // If refund amount differs from request (partial refund), update it
        if (refundAmount !== null && refundAmount >= 0) {
            returnRequest.returnPrice = refundAmount;
        }

        await returnRequest.save();

        return this.formatReturnResponse(returnRequest);
    }

    /**
     * Admin cancels a return request (force cancel)
     * Allowed when return is pending, approved, or returned.
     */
    static async adminCancelReturn({ returnId, adminId, reason = '' }) {
        const returnRequest = await Return.findById(returnId);

        if (!returnRequest) {
            throw new NotFoundError('Return request not found');
        }

        if (!['pending', 'approved', 'returned'].includes(returnRequest.status)) {
            throw new BadRequestError(`Cannot cancel return with status "${returnRequest.status}".`);
        }

        returnRequest.status = 'cancelled';
        returnRequest.adminId = adminId;
        returnRequest.approvalReason = reason || '';
        returnRequest.cancelledAt = new Date();

        await returnRequest.save();

        return this.formatReturnResponse(returnRequest);
    }

    /**
     * User cancels return request (only if still pending)
     */
    static async cancelReturn({ returnId, userId }) {
        const returnRequest = await Return.findOne({ _id: returnId, userId });

        if (!returnRequest) {
            throw new NotFoundError('Return request not found');
        }

        if (returnRequest.status !== 'pending' && returnRequest.status !== 'approved') {
            throw new BadRequestError(`Cannot cancel return with status "${returnRequest.status}".`);
        }

        returnRequest.status = 'cancelled';
        returnRequest.cancelledAt = new Date();

        await returnRequest.save();

        return this.formatReturnResponse(returnRequest);
    }

    /**
     * Format return response
     */
    static formatReturnResponse(returnData) {
        const data = returnData.toObject ? returnData.toObject() : returnData;

        return {
            returnId: data._id,
            orderId: data.orderId,
            userId: data.userId,
            shopId: data.shopId,
            reason: data.reason,
            description: data.description,
            returnItems: data.returnItems,
            returnPrice: data.returnPrice,
            status: data.status,
            adminId: data.adminId,
            approvalReason: data.approvalReason,
            requestedAt: data.requestedAt,
            approvedAt: data.approvedAt,
            returnedAt: data.returnedAt,
            completedAt: data.completedAt,
            cancelledAt: data.cancelledAt,
            notes: data.notes,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
        };
    }
}

module.exports = ReturnService;
