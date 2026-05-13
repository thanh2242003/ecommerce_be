'use strict';

const express = require('express');
const router = express.Router();

const UserController = require('../../controllers/user.controller');
const { asyncHandler } = require('../../auth/checkAuth');
const { authenticationV2 } = require('../../auth/authUtils');

// Protected: cần token
router.use(authenticationV2);

// GET /v1/api/user/profile
router.get('/profile', asyncHandler(UserController.getProfile));

// GET /v1/api/user/reviews
router.get('/reviews', asyncHandler(UserController.getMyReviews));

// PATCH /v1/api/user/profile
router.patch('/profile', asyncHandler(UserController.updateProfile));

// PATCH /v1/api/user/password
router.patch('/password', asyncHandler(UserController.changePassword));

// PATCH /v1/api/user/fcm-token
router.patch('/fcm-token', asyncHandler(UserController.updateFcmToken));

// DELETE /v1/api/user/fcm-token
router.delete('/fcm-token', asyncHandler(UserController.removeFcmToken));

module.exports = router;