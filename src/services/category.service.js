'use strict';

const { BadRequestError, NotFoundError } = require('../core/error.response');
const Category = require('../models/category.model');
const { uploadFilesToCloudinary } = require('../helpers/cloudinary.helper');

class CategoryService {
  
  // ================= GET ALL CATEGORIES =================
  static async getAllCategories() {
    try {
      const categories = await Category.find({ isActive: true })
        .sort({ createdAt: -1 })
        .lean();
      return categories;
    } catch (error) {
      throw error;
    }
  }

  // ================= GET CATEGORY BY ID =================
  static async getCategoryById(categoryId) {
    try {
      const category = await Category.findById(categoryId).lean();
      if (!category) {
        throw new NotFoundError('Category not found');
      }
      return category;
    } catch (error) {
      throw error;
    }
  }

  // ================= GET CATEGORY BY SLUG =================
  static async getCategoryBySlug(slug) {
    try {
      const category = await Category.findOne({ slug, isActive: true }).lean();
      if (!category) {
        throw new NotFoundError('Category not found');
      }
      return category;
    } catch (error) {
      throw error;
    }
  }

  // ================= CREATE CATEGORY (Admin only) =================
  static async createCategory({ name, description = '', adminId, imageFile = null }) {
    try {
      if (!name || name.trim() === '') {
        throw new BadRequestError('Category name is required');
      }

      if (!adminId) {
        throw new BadRequestError('Admin ID is required');
      }

      // Check if category name already exists
      const existingCategory = await Category.findOne({ 
        name: { $regex: `^${name}$`, $options: 'i' } 
      });
      
      if (existingCategory) {
        throw new BadRequestError('Category name already exists');
      }

      const categoryData = {
        name: name.trim(),
        description: description.trim(),
        adminId
      };

      if (imageFile) {
        const urls = await uploadFilesToCloudinary([imageFile], 'learning-ecommerce/categories');
        if (urls && urls.length > 0) categoryData.image = urls[0];
      }

      const newCategory = await Category.create(categoryData);

      return newCategory.toJSON();
    } catch (error) {
      throw error;
    }
  }

  // ================= UPDATE CATEGORY =================
  static async updateCategory(categoryId, { name, description, isActive }) {
    try {
      const category = await Category.findById(categoryId);
      if (!category) {
        throw new NotFoundError('Category not found');
      }

      // Check if new name already exists (if name is being updated)
      if (name && name !== category.name) {
        const existingCategory = await Category.findOne({ 
          _id: { $ne: categoryId },
          name: { $regex: `^${name}$`, $options: 'i' }
        });
        if (existingCategory) {
          throw new BadRequestError('Category name already exists');
        }
        category.name = name.trim();
      }

      if (description !== undefined) {
        category.description = description.trim();
      }

      if (isActive !== undefined) {
        category.isActive = isActive;
      }

      // If imageFile provided in update payload, upload and replace
      if (arguments[1] && arguments[1].imageFile) {
        const imgFile = arguments[1].imageFile;
        if (imgFile) {
          const urls = await uploadFilesToCloudinary([imgFile], 'learning-ecommerce/categories');
          if (urls && urls.length > 0) category.image = urls[0];
        }
      }
      await category.save();
      return category.toJSON();
    } catch (error) {
      throw error;
    }
  }

  // ================= DELETE CATEGORY =================
  static async deleteCategory(categoryId) {
    try {
      const category = await Category.findById(categoryId);
      if (!category) {
        throw new NotFoundError('Category not found');
      }

      // Soft delete - set isActive to false
      category.isActive = false;
      await category.save();
      
      return { message: 'Category deleted successfully' };
    } catch (error) {
      throw error;
    }
  }

  // ================= SEED DEFAULT CATEGORIES =================
  static async seedDefaultCategories(adminId) {
    try {
      if (!adminId) {
        throw new BadRequestError('Admin ID is required');
      }

      const defaultCategories = [
        { name: 'Quần áo', description: 'Các loại quần áo, áo sơ mi, áo khoác, etc.' },
        { name: 'Giày dép', description: 'Giày sneaker, sandal, dép, boot, etc.' },
        { name: 'Đồ chơi', description: 'Các loại đồ chơi cho trẻ em' },
        { name: 'Thực phẩm', description: 'Thực phẩm, đồ uống, bánh kẹo, etc.' },
        { name: 'Đồ dùng', description: 'Đồ dùng hàng ngày, gia dụng' },
        { name: 'Khác', description: 'Các sản phẩm khác' }
      ];

      for (const cat of defaultCategories) {
        const exists = await Category.findOne({ 
          name: { $regex: `^${cat.name}$`, $options: 'i' } 
        });
        
        if (!exists) {
          await Category.create({
            ...cat,
            adminId
          });
        }
      }

      return { message: 'Default categories seeded successfully' };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = CategoryService;
