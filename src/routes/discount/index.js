'use strict';

const express = require('express');
const router = express.Router();
const DiscountController = require('../../controllers/discount.controller');
const ShopDiscountController = require('../../controllers/shop.discount.controller');
const { asyncHandler } = require('../../auth/checkAuth');
const { authenticationV2 } = require('../../auth/authUtils');
const { shopAuthenticationV2 } = require('../../auth/shopAuth');

/*
========================
    PUBLIC ENDPOINTS
========================
*/

// Get discount amount for order
router.post('/amount', asyncHandler(DiscountController.getDiscountAmount));

// Get all discount codes with applicable products
router.get('/list_product_code', asyncHandler(DiscountController.getAllDiscountCodesWithProducts));

/*
========================
    SHOP ENDPOINTS
========================
*/

// All below routes require authentication
router.use(shopAuthenticationV2);

// Create discount code
router.post('', asyncHandler(DiscountController.createDiscountCode));

// Get all discount codes for shop
router.get('', asyncHandler(DiscountController.getAllDiscountCodesByShop));

// Update discount
router.patch('/:id', asyncHandler(ShopDiscountController.updateDiscount));

// Delete discount
router.delete('/:id', asyncHandler(ShopDiscountController.deleteDiscount));

module.exports = router;