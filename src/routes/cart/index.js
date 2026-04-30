'use strict';

const express = require('express');
const router = express.Router();
const CartController = require('../../controllers/cart.controller');
const { asyncHandler } = require('../../auth/checkAuth');
const { authenticationV2 } = require('../../auth/authUtils');

// All cart routes require authentication
router.use(authenticationV2);

// POST   /v1/api/cart/add      — add item to cart
router.post('/add', asyncHandler(CartController.addToCartMobile));

// POST   /v1/api/cart/update   — update item quantity
router.post('/update', asyncHandler(CartController.update));

// DELETE /v1/api/cart          — delete a cart item
router.delete('', asyncHandler(CartController.delete));

// GET    /v1/api/cart          — get cart list
router.get('', asyncHandler(CartController.listToCart));

module.exports = router;