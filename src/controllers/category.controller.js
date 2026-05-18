'use strict';

const { SuccessResponse } = require('../core/success.response');
const CategoryService = require('../services/category.service');

class CategoryController {

  // ================= GET ALL CATEGORIES =================
  getAllCategories = async (req, res, next) => {
    new SuccessResponse({
      message: 'Get all categories successfully!',
      metadata: await CategoryService.getAllCategories()
    }).send(res);
  }

  // ================= GET CATEGORY BY ID =================
  getCategoryById = async (req, res, next) => {
    new SuccessResponse({
      message: 'Get category successfully!',
      metadata: await CategoryService.getCategoryById(req.params.categoryId)
    }).send(res);
  }

  // ================= GET CATEGORY BY SLUG =================
  getCategoryBySlug = async (req, res, next) => {
    new SuccessResponse({
      message: 'Get category successfully!',
      metadata: await CategoryService.getCategoryBySlug(req.params.slug)
    }).send(res);
  }

  // ================= CREATE CATEGORY (Admin only) =================
  createCategory = async (req, res, next) => {
    new SuccessResponse({
      message: 'Create category successfully!',
      metadata: await CategoryService.createCategory({
        name: req.body.name,
        description: req.body.description,
        adminId: req.adminId, // Admin ID from x-client-id header
        imageFile: req.file
      })
    }).send(res);
  }

  // ================= UPDATE CATEGORY =================
  updateCategory = async (req, res, next) => {
    new SuccessResponse({
      message: 'Update category successfully!',
      metadata: await CategoryService.updateCategory(
        req.params.categoryId,
        {
          name: req.body.name,
          description: req.body.description,
          isActive: req.body.isActive,
          imageFile: req.file
        }
      )
    }).send(res);
  }

  // ================= DELETE CATEGORY =================
  deleteCategory = async (req, res, next) => {
    new SuccessResponse({
      message: 'Delete category successfully!',
      metadata: await CategoryService.deleteCategory(req.params.categoryId)
    }).send(res);
  }

  // ================= SEED DEFAULT CATEGORIES (Admin only) =================
  seedCategories = async (req, res, next) => {
    new SuccessResponse({
      message: 'Categories seeded successfully!',
      metadata: await CategoryService.seedDefaultCategories(req.adminId)
    }).send(res);
  }
}

module.exports = new CategoryController();
