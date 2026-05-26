'use strict';

const userModel = require('../models/user.model');
const { SuccessResponse } = require('../core/success.response');
const { BadRequestError } = require('../core/error.response');
const { ProductFactory, ProductService } = require('../services/product.service');
const { uploadFilesToCloudinary } = require('../helpers/cloudinary.helper');

function parseMultipartField(value, fallback = undefined) {
    if (value === undefined || value === null || value === '') {
        return fallback;
    }

    if (Array.isArray(value)) {
        return value;
    }

    if (typeof value === 'string') {
        const trimmed = value.trim();

        if (!trimmed) {
            return fallback;
        }

        try {
            return JSON.parse(trimmed);
        } catch (error) {
            return value;
        }
    }

    return value;
}

function parseNumberField(value, fieldName) {
    if (value === undefined || value === null || value === '') {
        return undefined;
    }

    const parsed = Number(value);
    if (Number.isNaN(parsed)) {
        throw new BadRequestError(`${fieldName} must be a number`);
    }

    return parsed;
}

function validateCreateProductBody(payload) {
    if (!payload.title) {
        throw new BadRequestError('title is required');
    }

    if (payload.price === undefined || payload.price === null || payload.price === '') {
        throw new BadRequestError('price is required');
    }

    if (!payload.categoryId) {
        throw new BadRequestError('categoryId is required');
    }

    if (!Array.isArray(payload.sizes) || payload.sizes.length === 0) {
        throw new BadRequestError('sizes is required');
    }

    if (!Array.isArray(payload.colors) || payload.colors.length === 0) {
        throw new BadRequestError('colors is required');
    }

    if (!Array.isArray(payload.variants) || payload.variants.length === 0) {
        throw new BadRequestError('variants is required');
    }
}

class ProductController {
    createProduct = async (req, res, next) => {
        const payload = {
            productId: req.body.productId,
            title: req.body.title || req.body.product_name,
            description: req.body.description || req.body.product_description,
            price: parseNumberField(req.body.price ?? req.body.product_price, 'price'),
            discountedPrice: parseNumberField(
                req.body.discountedPrice ?? req.body.product_discountedPrice ?? 0,
                'discountedPrice'
            ) ?? 0,
            categoryId: req.body.categoryId || req.body.product_categoryId,
            gender: parseNumberField(
                req.body.gender !== undefined ? req.body.gender : (req.body.product_gender ?? 2),
                'gender'
            ) ?? 2,
            sizes: parseMultipartField(req.body.sizes ?? req.body.product_sizes, []),
            colors: parseMultipartField(req.body.colors, []),
            variants: parseMultipartField(req.body.variants, []),
            product_shop: req.shopId
        };

        validateCreateProductBody(payload);

        payload.images = await uploadFilesToCloudinary(req.files || []);

        new SuccessResponse({
            message: 'Create new Product successfully!',
            metadata: await ProductFactory.createProduct(payload)
        }).send(res);
    }

    updateProduct = async (req, res, next) => {
        const updateData = {
            ...req.body,
            product_shop: req.shopId
        };

        if (req.body.price !== undefined) {
            updateData.price = parseNumberField(req.body.price, 'price');
        }

        if (req.body.discountedPrice !== undefined) {
            updateData.discountedPrice = parseNumberField(req.body.discountedPrice, 'discountedPrice');
        }

        if (req.body.gender !== undefined) {
            updateData.gender = parseNumberField(req.body.gender, 'gender');
        }

        if (req.body.sizes !== undefined) {
            updateData.sizes = parseMultipartField(req.body.sizes, []);
        }

        if (req.body.colors !== undefined) {
            updateData.colors = parseMultipartField(req.body.colors, []);
        }

        if (req.body.variants !== undefined) {
            updateData.variants = parseMultipartField(req.body.variants, []);
        }

        if (req.files && req.files.length > 0) {
            updateData.images = await uploadFilesToCloudinary(req.files);
        }

        new SuccessResponse({
            message: 'Update product successfully!',
            metadata: await ProductService.updateProduct(
                req.params.productId,
                updateData,
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

    getProductByIdForShop = async (req, res, next) => {
        const shopId = req.shopId;

        new SuccessResponse({
            message: 'Get product successfully!',
            metadata: await ProductService.getProductByIdForShop(req.params.productId, shopId)
        }).send(res);
    }

    getReviews = async (req, res, next) => {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        new SuccessResponse({
            message: 'Get reviews successfully!',
            metadata: await ProductService.getReviews(req.params.productId, { page, limit })
        }).send(res);
    }

    searchProducts = async (req, res, next) => {
        new SuccessResponse({
            message: 'Search products successfully!',
            metadata: await ProductService.searchProducts({
                keyword: req.query.q,
                categoryId: req.query.categoryId,
                userId: req.user?.userId ?? null
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
                rating: req.body.rating,
                orderId: req.body.orderId
            })
        }).send(res);
    }

    updateReview = async (req, res, next) => {
        const userId = req.user.userId;

        new SuccessResponse({
            message: 'Review updated successfully!',
            metadata: await ProductService.updateReview(
                req.params.productId,
                req.params.reviewId,
                userId,
                { content: req.body.content, rating: req.body.rating }
            )
        }).send(res);
    }

    deleteReview = async (req, res, next) => {
        const userId = req.user.userId;

        new SuccessResponse({
            message: 'Review deleted successfully!',
            metadata: await ProductService.deleteReview(
                req.params.productId,
                req.params.reviewId,
                userId
            )
        }).send(res);
    }

    shopReplyReview = async (req, res, next) => {
        const shopId = req.shopId;

        new SuccessResponse({
            message: 'Reply added successfully!',
            metadata: await ProductService.replyToReview(
                req.params.productId,
                req.params.reviewId,
                shopId,
                { content: req.body.content }
            )
        }).send(res);
    }

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
