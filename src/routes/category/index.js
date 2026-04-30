'use strict';

const express = require('express');
const router = express.Router();

const CategoryController = require('../../controllers/category.controller');
const { asyncHandler } = require('../../auth/checkAuth');
const { requireAdminByClientId } = require('../../auth/adminAuth');

/*
========================
        PUBLIC
========================
*/

// GET ALL CATEGORIES
router.get('/', asyncHandler(CategoryController.getAllCategories));

// GET CATEGORY BY SLUG
router.get('/slug/:slug', asyncHandler(CategoryController.getCategoryBySlug));

// GET CATEGORY BY ID
router.get('/:categoryId', asyncHandler(CategoryController.getCategoryById));

/*
========================
        ADMIN ONLY (via x-client-id header)
========================
*/

// CREATE CATEGORY (Admin only)
router.post('/', requireAdminByClientId, asyncHandler(CategoryController.createCategory));

// UPDATE CATEGORY (Admin only)
router.patch('/:categoryId', requireAdminByClientId, asyncHandler(CategoryController.updateCategory));

// DELETE CATEGORY (Admin only)
router.delete('/:categoryId', requireAdminByClientId, asyncHandler(CategoryController.deleteCategory));

// SEED CATEGORIES (Admin only)
router.post('/seed/default', requireAdminByClientId, asyncHandler(CategoryController.seedCategories));

module.exports = router;
