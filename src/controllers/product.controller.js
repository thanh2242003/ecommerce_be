'use strict';

const userModel = require('../models/user.model');
const { SuccessResponse } = require("../core/success.response");
const { ProductFactory, ProductService } = require("../services/product.service");

class ProductController {

    createProduct = async (req, res, next) => {
        const payload = {
            productId: req.body.productId,
            title: req.body.title || req.body.product_name,
            description: req.body.description || req.body.product_description,
            price: req.body.price || req.body.product_price,
            discountedPrice: req.body.discountedPrice || req.body.product_discountedPrice || 0,
            categoryId: req.body.categoryId || req.body.product_categoryId,
            gender: req.body.gender !== undefined ? req.body.gender : req.body.product_gender || 2,
            images: req.body.images || (req.body.product_thumb ? [req.body.product_thumb] : []),
            sizes: req.body.sizes || req.body.product_sizes || [],
            //product_attributes: req.body.product_attributes || {},
            colors: req.body.colors || [],
            variants: req.body.variants || [],
            product_shop: req.shopId
        }

        new SuccessResponse({
            message: 'Create new Product successfully!',
            metadata: await ProductFactory.createProduct(
                payload
            )
        }).send(res);
    }

    updateProduct = async (req, res, next) => {
        new SuccessResponse({
            message: 'Update product successfully!',
            metadata: await ProductService.updateProduct(
                req.params.productId,
                {
                    ...req.body,
                    product_shop: req.shopId
                },
                req.shopId
            )
        }).send(res);
    }

    deleteProduct = async (req, res, next) => {
        new SuccessResponse({
            message: 'Delete product successfully!',
            metadata: await ProductService.deleteProduct(req.params.productId, req.shopId)
        }).send(res);
    }

    getAllProducts = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get all products successfully!',
            metadata: await ProductService.getProducts({
                categoryId: req.query.categoryId,
                minPrice: req.query.minPrice,
                maxPrice: req.query.maxPrice,
                gender: req.query.gender,
                sort: req.query.sort,
                page: req.query.page,
                limit: req.query.limit
            })
        }).send(res);
    }

    getProductById = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get product successfully!',
            metadata: await ProductService.getProductById(req.params.productId)
        }).send(res);
    }

    searchProducts = async (req, res, next) => {
        new SuccessResponse({
            message: 'Search products successfully!',
            metadata: await ProductService.searchProducts({
                keyword: req.query.q,
                categoryId: req.query.categoryId,
                userId: req.user?.userId ?? null   // set by optionalAuth; null for guests
            })
        }).send(res);
    }

    getSuggestedProducts = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get suggested products successfully!',
            metadata: await ProductService.getSuggestedProducts(req.params.userId)
        }).send(res);
    }

    getTopSelling = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get top selling products!',
            metadata: await ProductService.getTopSelling(req.query.limit)
        }).send(res);
    }

    addReview = async (req, res, next) => {
        const userId = req.user.userId;
        const u = await userModel.findById(userId).select('name email').lean();
        const userName = u?.name || u?.email || 'User';

        new SuccessResponse({
            message: 'Review added successfully!',
            metadata: await ProductService.addReview(req.params.productId, {
                userId,
                userName,
                content: req.body.content,
                rating: req.body.rating
            })
        }).send(res);
    }

    // SHOP

    getAllDraftForShop = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get draft products successfully!',
            metadata: await ProductService.getProducts({
                product_shop: req.shopId,
                isDraft: true
            })
        }).send(res);
    }

    getAllPublishForShop = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get published products successfully!',
            metadata: await ProductService.getProducts({
                product_shop: req.shopId,
                isPublished: true
            })
        }).send(res);
    }

    publishProduct = async (req, res, next) => {
        new SuccessResponse({
            message: 'Publish product successfully!',
            metadata: await ProductService.updateProduct(
                req.params.productId,
                { isDraft: false, isPublished: true },
                req.shopId
            )
        }).send(res);
    }

    unPublishProduct = async (req, res, next) => {
        new SuccessResponse({
            message: 'Unpublish product successfully!',
            metadata: await ProductService.updateProduct(
                req.params.productId,
                { isDraft: true, isPublished: false },
                req.shopId
            )
        }).send(res);
    }
}

module.exports = new ProductController();
