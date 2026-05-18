'use strict'

const { Types } = require('mongoose');
const { BadRequestError } = require('../core/error.response');
const Product = require('../models/product.model');
const Inventory = require('../models/inventory.model');
const SearchHistory = require('../models/search_history.model');
const Order = require('../models/order.model');

function formatProductResponse(doc) {
    if (!doc) return doc;
    const obj = doc.toObject ? doc.toObject() : { ...doc };
    const rawReviews = Array.isArray(obj.reviews) ? obj.reviews : [];
    const reviews = rawReviews.map((r) => ({
        userId: r.userId != null ? String(r.userId) : '',
        userName: r.userName != null ? String(r.userName) : '',
        content: r.content != null ? String(r.content) : '',
        rating: typeof r.rating === 'number' ? r.rating : Number(r.rating) || 0
    }));
    const sum = reviews.reduce((s, r) => s + r.rating, 0);
    const ratings = reviews.length
        ? Math.round((sum / reviews.length) * 10) / 10
        : 0;
    return {
        ...obj,
        description: obj.description != null ? String(obj.description) : '',
        ratings,
        reviews
    };
}

function formatProductsList(list) {
    return Array.isArray(list) ? list.map(formatProductResponse) : [];
}

function normalizeText(value) {
    return String(value ?? '').trim();
}

function validateProductVariants({ sizes, colors, variants }) {
    if (!Array.isArray(sizes) || sizes.length === 0) {
        throw new BadRequestError('Missing required fields: sizes');
    }

    if (!Array.isArray(colors) || colors.length === 0) {
        throw new BadRequestError('Missing required fields: colors');
    }

    if (!Array.isArray(variants) || variants.length === 0) {
        throw new BadRequestError('Missing required fields: variants');
    }

    const validSizes = new Set(sizes.map(normalizeText));
    const validColors = new Set(colors.map((color) => normalizeText(color?.title)));
    const seenKeys = new Set();

    variants.forEach((variant, index) => {
        const variantColor = normalizeText(variant?.color);
        const variantSize = normalizeText(variant?.size);

        if (!variantColor || !variantSize) {
            throw new BadRequestError(`Variant ${index + 1} must have color and size`);
        }

        if (!validColors.has(variantColor)) {
            throw new BadRequestError(
                `Variant ${index + 1} has invalid color "${variantColor}". Available colors: ${Array.from(validColors).join(', ')}`
            );
        }

        if (!validSizes.has(variantSize)) {
            throw new BadRequestError(
                `Variant ${index + 1} has invalid size "${variantSize}". Available sizes: ${Array.from(validSizes).join(', ')}`
            );
        }

        if (variant.stock !== undefined && (typeof variant.stock !== 'number' || Number.isNaN(variant.stock) || variant.stock < 0)) {
            throw new BadRequestError(`Variant ${index + 1} stock must be a number greater than or equal to 0`);
        }

        const key = `${variantColor}::${variantSize}`;
        if (seenKeys.has(key)) {
            throw new BadRequestError(`Duplicate variant detected for ${variantColor} / ${variantSize}`);
        }

        seenKeys.add(key);
    });
}


// ================= PRODUCT FACTORY =================
class ProductFactory {
    static async createProduct(payload) {
        return new ProductService(payload).createProduct()
    }
}

// ================= PRODUCT SERVICE =================
class ProductService {

    constructor({
        title,
        description,
        price,
        discountedPrice,
        categoryId,
        gender,
        images,
        sizes,
        colors,
        variants,
        //product_attributes,
        product_shop
    }) {
        this.title = title
        this.description = description
        this.price = price
        this.discountedPrice = discountedPrice
        this.categoryId = categoryId
        this.gender = gender
        this.images = images
        this.sizes = sizes
        this.colors = colors
        this.variants = variants
        //this.product_attributes = product_attributes
        this.product_shop = product_shop
    }

    // ================= CREATE =================
    async createProduct() {

        if (!this.title || !this.price) {
            throw new BadRequestError('Missing required fields')
        }

        validateProductVariants({
            sizes: this.sizes,
            colors: this.colors,
            variants: this.variants
        });

        const newProduct = await Product.create({
            title: this.title,
            description: this.description,
            price: this.price,
            discountedPrice: this.discountedPrice,
            categoryId: this.categoryId,
            gender: this.gender,
            images: this.images || [],
            sizes: this.sizes || [],
            colors: this.colors || [],
            variants: this.variants,
            product_shop: this.product_shop,
            salesNumber: 0,
            reviews: []
        })

        // ✅ TỰ ĐỘNG TẠO INVENTORY RECORD
        const totalQuantity = this.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0;
        
        await Inventory.create({
            productId: newProduct._id,
            shopId: this.product_shop,
            totalQuantity: totalQuantity,
            location: 'Main Warehouse',
            variants: newProduct.variants.map(v => ({
                variantId: v._id,
                size: v.size,
                color: v.color,
                stock: v.stock || 0
            }))
        }).catch((err) => {
            // Log error but don't fail product creation
            console.error('[ProductService] Failed to create inventory:', err.message);
        });

        return formatProductResponse(newProduct)
    }

    // ================= GET ALL =================
    static async getAllProducts({ page = 1, limit = 10 }) {
        const skip = (page - 1) * limit

        // Public listing: only return published & approved products
        const list = await Product.find({ isPublished: true, status: 'approved' })
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 })

        return formatProductsList(list)
    }

    // ================= GET BY ID =================
    static async getProductById(productId) {
        if (!Types.ObjectId.isValid(productId)) {
            throw new BadRequestError('Invalid product ID format')
        }
        const found = await Product.findById(productId)

        if (!found) throw new BadRequestError('Product not found')

        // Only expose product to users if it is published and approved
        if (!found.isPublished || String(found.status).toLowerCase() !== 'approved') {
            throw new BadRequestError('Product not available')
        }

        return formatProductResponse(found)
    }

    // ================= SEARCH =================
    static async searchProducts({ keyword, categoryId, userId = null }) {
        if (userId && keyword && Types.ObjectId.isValid(userId)) {
            SearchHistory.create({
                userId: new Types.ObjectId(userId),
                keyword: String(keyword).trim()
            }).catch((err) => {
                console.error('[SearchHistory] Failed to save keyword:', err.message);
            });
        }

        const query = { isPublished: true, status: 'approved' };
        
        if (keyword) {
            query.title = { $regex: keyword, $options: 'i' };
        }
        
        if (categoryId) {
            query.categoryId = categoryId;
        }

        const list = await Product.find(query);
        return formatProductsList(list);
    }


    // ================= FILTER =================
    static async getProducts({
        categoryId,
        minPrice,
        maxPrice,
        gender,
        sort = 'createdAt',
        page = 1,
        limit = 10,
        product_shop,
        isDraft,
        isPublished
    }) {
        const query = { isDeleted: false }

        if (categoryId) query.categoryId = categoryId
        if (gender !== undefined) query.gender = gender
        if (product_shop) query.product_shop = product_shop
        if (isDraft !== undefined) query.isDraft = isDraft
        if (isPublished !== undefined) query.isPublished = isPublished

        // If caller did not explicitly request drafts/published and it's not a shop-scoped query,
        // only return published & approved products for public users.
        if (isPublished === undefined && !product_shop) {
            query.isPublished = true;
            query.status = 'approved';
        }

        if (minPrice || maxPrice) {
            query.price = {}
            if (minPrice) query.price.$gte = minPrice
            if (maxPrice) query.price.$lte = maxPrice
        }

        const skip = (page - 1) * limit

        const list = await Product.find(query)
            .sort({ [sort]: -1 })
            .skip(skip)
            .limit(limit)

        return formatProductsList(list)
    }

    // ================= TOP SELLING =================
    static async getTopSelling(limit = 10) {
        // Only top selling among published & approved products
        const list = await Product.find({ isDeleted: false, isPublished: true, status: 'approved' })
            .sort({ salesNumber: -1 })
            .limit(limit)

        return formatProductsList(list)
    }

    // ================= UPDATE =================
    static async updateProduct(productId, payload, shopId) {
        if (!Types.ObjectId.isValid(productId)) {
            throw new BadRequestError('Invalid product ID format')
        }
        
        // Verify ownership if shopId is provided
        if (shopId) {
            const product = await Product.findById(productId);
            if (!product) throw new BadRequestError('Product not found');
            
            if (String(product.product_shop) !== String(shopId)) {
                throw new BadRequestError('You do not have permission to update this product')
            }
        }
        
        const updated = await Product.findByIdAndUpdate(
            productId,
            payload,
            { new: true }
        )

        if (!updated) throw new BadRequestError('Update failed')

        return formatProductResponse(updated)
    }

    // ================= DELETE =================
    static async deleteProduct(productId, shopId) {
        if (!Types.ObjectId.isValid(productId)) {
            throw new BadRequestError('Invalid product ID format')
        }
        
        // Verify ownership if shopId is provided
        if (shopId) {
            const product = await Product.findById(productId);
            if (!product) throw new BadRequestError('Product not found');
            
            if (String(product.product_shop) !== String(shopId)) {
                throw new BadRequestError('You do not have permission to delete this product')
            }
        }
        
        const deleted = await Product.findByIdAndDelete(productId)

        if (!deleted) throw new BadRequestError('Delete failed')

        return formatProductResponse(deleted)
    }

    static async addReview(productId, { userId, userName, content, rating, orderId }) {
        if (!Types.ObjectId.isValid(productId)) {
            throw new BadRequestError('Invalid product ID format')
        }
        if (content == null || String(content).trim() === '') {
            throw new BadRequestError('content is required')
        }
        const r = Number(rating);
        if (Number.isNaN(r) || r < 0 || r > 5) {
            throw new BadRequestError('rating must be a number between 0 and 5')
        }

        // Order-based validation: require orderId that belongs to user, contains product, and is delivered
        if (!orderId || !Types.ObjectId.isValid(orderId)) {
            throw new BadRequestError('orderId is required and must be a valid id')
        }

        const order = await Order.findById(orderId).lean();
        if (!order) throw new BadRequestError('Order not found')
        if (String(order.userId) !== String(userId)) throw new BadRequestError('Order does not belong to user')
        if (order.status !== 'delivered') throw new BadRequestError('Order must be delivered to be reviewed')

        const itemMatch = Array.isArray(order.items) && order.items.some(it => String(it.productId) === String(productId));
        if (!itemMatch) throw new BadRequestError('Order does not contain this product')

        // Ensure this order hasn't been reviewed already for this product
        const productDoc = await Product.findById(productId).select('reviews product_shop');
        if (!productDoc) throw new BadRequestError('Product not found');

        const existing = (productDoc.reviews || []).some(r => r.orderId && String(r.orderId) === String(orderId));
        if (existing) throw new BadRequestError('This order has already been reviewed')

        const updated = await Product.findByIdAndUpdate(
            productId,
            {
                $push: {
                    reviews: {
                        userId: new Types.ObjectId(userId),
                        userName: String(userName).trim(),
                        content: String(content).trim(),
                        rating: r,
                        orderId: new Types.ObjectId(orderId)
                    }
                }
            },
            { new: true }
        );

        if (!updated) throw new BadRequestError('Failed to add review');

        return formatProductResponse(updated);
    }

    static async getReviews(productId, { page = 1, limit = 10 } = {}) {
        if (!Types.ObjectId.isValid(productId)) {
            throw new BadRequestError('Invalid product ID format')
        }

        const product = await Product.findById(productId).select('reviews')
        if (!product) throw new BadRequestError('Product not found')

        const rawReviews = Array.isArray(product.reviews) ? product.reviews : [];
        const total = rawReviews.length;
        const start = (page - 1) * limit;
        const paged = rawReviews.slice(start, start + limit).map((r) => ({
            _id: r._id ? String(r._id) : undefined,
            userId: r.userId != null ? String(r.userId) : '',
            userName: r.userName != null ? String(r.userName) : '',
            content: r.content != null ? String(r.content) : '',
            rating: typeof r.rating === 'number' ? r.rating : Number(r.rating) || 0,
            createdAt: r.createdAt || null,
            updatedAt: r.updatedAt || null
        }));

        const sum = rawReviews.reduce((s, r) => s + (Number(r.rating) || 0), 0);
        const ratings = rawReviews.length ? Math.round((sum / rawReviews.length) * 10) / 10 : 0;

        return {
            reviews: paged,
            total,
            page,
            limit,
            ratings
        };
    }

    static async getReviewsByUser(userId, { page = 1, limit = 10 } = {}) {
        if (!Types.ObjectId.isValid(userId)) {
            throw new BadRequestError('Invalid user ID format')
        }

        // Aggregate reviews across products
        const skip = (page - 1) * limit;

        const pipeline = [
            { $unwind: '$reviews' },
            { $match: { 'reviews.userId': new Types.ObjectId(userId) } },
            { $project: {
                productId: '$_id',
                productTitle: '$title',
                productImage: { $arrayElemAt: ['$images', 0] },
                'review._id': '$reviews._id',
                'review.content': '$reviews.content',
                'review.rating': '$reviews.rating',
                'review.orderId': '$reviews.orderId',
                'review.createdAt': '$reviews.createdAt',
                'review.updatedAt': '$reviews.updatedAt'
            }},
            { $sort: { 'review.createdAt': -1 } },
            { $skip: skip },
            { $limit: limit }
        ];

        const results = await Product.aggregate(pipeline);

        // Count total
        const countPipeline = [
            { $unwind: '$reviews' },
            { $match: { 'reviews.userId': new Types.ObjectId(userId) } },
            { $count: 'total' }
        ];
        const countRes = await Product.aggregate(countPipeline);
        const total = countRes[0] ? countRes[0].total : 0;

        return {
            reviews: results.map(r => ({
                productId: r.productId ? String(r.productId) : undefined,
                title: r.productTitle,
                image: r.productImage,
                review: r.review
            })),
            total,
            page,
            limit
        };
    }

    static async updateReview(productId, reviewId, userId, { content, rating }) {
        if (!Types.ObjectId.isValid(productId) || !Types.ObjectId.isValid(reviewId)) {
            throw new BadRequestError('Invalid id format')
        }

        if ((content == null || String(content).trim() === '') && rating == null) {
            throw new BadRequestError('No update fields provided')
        }

        const updateFields = {};
        if (content != null) updateFields['reviews.$.content'] = String(content).trim();
        if (rating != null) {
            const r = Number(rating);
            if (Number.isNaN(r) || r < 0 || r > 5) throw new BadRequestError('rating must be a number between 0 and 5')
            updateFields['reviews.$.rating'] = r;
        }

        const query = {
            _id: productId,
            'reviews._id': reviewId,
            'reviews.userId': new Types.ObjectId(userId)
        };

        const updated = await Product.findOneAndUpdate(
            query,
            { $set: updateFields },
            { new: true }
        );

        if (!updated) throw new BadRequestError('Review not found or permission denied')

        return formatProductResponse(updated);
    }

    static async deleteReview(productId, reviewId, userId) {
        if (!Types.ObjectId.isValid(productId) || !Types.ObjectId.isValid(reviewId)) {
            throw new BadRequestError('Invalid id format')
        }

        const updated = await Product.findOneAndUpdate(
            { _id: productId },
            { $pull: { reviews: { _id: reviewId, userId: new Types.ObjectId(userId) } } },
            { new: true }
        );

        if (!updated) throw new BadRequestError('Review not found or permission denied')

        return formatProductResponse(updated);
    }

    static async replyToReview(productId, reviewId, shopId, { content }) {
        if (!Types.ObjectId.isValid(productId) || !Types.ObjectId.isValid(reviewId)) {
            throw new BadRequestError('Invalid id format')
        }

        if (content == null || String(content).trim() === '') {
            throw new BadRequestError('content is required')
        }

        const product = await Product.findById(productId).select('product_shop');
        if (!product) throw new BadRequestError('Product not found')
        if (String(product.product_shop) !== String(shopId)) throw new BadRequestError('Permission denied')

        const updated = await Product.findOneAndUpdate(
            { _id: productId, 'reviews._id': reviewId },
            { $set: { 'reviews.$.shopResponse': { shopId: new Types.ObjectId(shopId), content: String(content).trim(), respondedAt: new Date() } } },
            { new: true }
        );

        if (!updated) throw new BadRequestError('Review not found')

        return formatProductResponse(updated);
    }

    // ================= INCREASE SALES =================
    static async increaseSales(productId, quantity = 1) {
        if (!Types.ObjectId.isValid(productId)) {
            throw new BadRequestError('Invalid product ID format')
        }
        return await Product.findByIdAndUpdate(
            productId,
            { $inc: { salesNumber: quantity } },
            { new: true }
        )
    }

    // ================= SUGGESTED PRODUCTS (recommendation) =================
    /**
     * GET /products/suggested/:userId
     *
     * Algorithm (single-pass, no N+1):
     *  1. Aggregate search_histories for the user:
     *     - Group by keyword → count occurrences
     *     - Sort desc by count
     *     - Take top 5 keywords
     *  2. Build one $or regex query against `products.title`
     *  3. Return up to 20 unique products
     */
    static async getSuggestedProducts(userId) {
        if (!Types.ObjectId.isValid(userId)) {
            throw new BadRequestError('Invalid user ID format')
        }

        // ── Step 1: top-5 keywords from search history ──────────────────────
        const TOP_KEYWORDS = 5;
        const PRODUCT_LIMIT = 20;

        /**
         * MongoDB aggregation pipeline:
         *
         * [ { $match: { userId } },
         *   { $group: { _id: "$keyword", count: { $sum: 1 } } },
         *   { $sort:  { count: -1 } },
         *   { $limit: TOP_KEYWORDS },
         *   { $project: { _id: 0, keyword: "$_id" } } ]
         */
        const topKeywordDocs = await SearchHistory.aggregate([
            {
                $match: { userId: new Types.ObjectId(userId) }
            },
            {
                $group: {
                    _id: { $toLower: '$keyword' }, // normalise case before grouping
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            },
            {
                $limit: TOP_KEYWORDS
            },
            {
                $project: { _id: 0, keyword: '$_id' }
            }
        ]);

        // No history → return empty list (no junk fallback)
        if (!topKeywordDocs.length) return [];

        const keywords = topKeywordDocs.map((d) => d.keyword);

        // ── Step 2: single query with $or regex ─────────────────────────────
        // Build one regex per keyword (case-insensitive) and OR them together.
        // This is one round-trip to MongoDB regardless of the number of keywords.
        const regexConditions = keywords.map((kw) => ({
            title: { $regex: kw, $options: 'i' }
        }));

        const products = await Product
            .find({ $or: regexConditions })
            .select('_id title images price categoryId')
            .limit(PRODUCT_LIMIT)
            .lean(); // lean() for raw JS objects → faster serialisation

        // ── Step 3: deduplicate by _id (already unique from find, belt-and-suspenders) ──
        const seen = new Set();
        const unique = products.filter((p) => {
            const id = p._id.toString();
            if (seen.has(id)) return false;
            seen.add(id);
            return true;
        });

        return unique;
    }
}

module.exports = {
    ProductFactory,
    ProductService
}
