'use strict';

const express = require('express');
const router = express.Router();
const AccessController = require('../../controllers/access.controller');
const { asyncHandler } = require('../../auth/checkAuth');
const { authenticationV2 } = require('../../auth/authUtils');



// Sign Up
router.post('/shop/signup', asyncHandler(AccessController.signUp));

// Sign In
router.post('/shop/signin', asyncHandler(AccessController.signIn));

// ================= USER ENDPOINTS =================
// User Sign Up
router.post('/user/signup', asyncHandler(AccessController.userSignUp));

// User Sign In
router.post('/user/signin', asyncHandler(AccessController.userSignIn));

// Authentication
router.use(authenticationV2)
// Logout (works for both shop and user)
router.post('/logout', asyncHandler(AccessController.logout));
router.post('/handlerRefreshToken', asyncHandler(AccessController.handlerRefreshToken));
router.use('/user', require('../user/user.route'));






module.exports = router