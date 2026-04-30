'use strict';

const express = require('express');
const router = express.Router();

const UserController = require('../../controllers/user.controller');
const { asyncHandler } = require('../../auth/checkAuth');
const { authenticationV2 } = require('../../auth/authUtils');

// Protected: cần token
router.use(authenticationV2);
router.get('/profile', asyncHandler(UserController.getProfile));

module.exports = router;