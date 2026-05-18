'use strict';

const express = require('express');
const router = express.Router();

const CategoryController = require('../../controllers/category.controller');
const { asyncHandler } = require('../../auth/checkAuth');
const { verifyAdmin } = require('../../auth/adminAuth');
const upload = require('../../configs/multer.config');

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
        ADMIN ONLY (via JWT token)
========================
*/

// CREATE CATEGORY (Admin only)
router.post('/', verifyAdmin, upload.single('image'), asyncHandler(CategoryController.createCategory));

// UPDATE CATEGORY (Admin only)
router.patch('/:categoryId', verifyAdmin, upload.single('image'), asyncHandler(CategoryController.updateCategory));

// DELETE CATEGORY (Admin only)
router.delete('/:categoryId', verifyAdmin, asyncHandler(CategoryController.deleteCategory));

// SEED CATEGORIES (Admin only)
router.post('/seed/default', verifyAdmin, asyncHandler(CategoryController.seedCategories));

module.exports = router;
