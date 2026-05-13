'use strict';

const express = require('express');
const router = express.Router();

const ProductController = require('../../controllers/product.controller');
const ShopProductController = require('../../controllers/shop.product.controller');
const { asyncHandler } = require('../../auth/checkAuth');
const { authenticationV2, optionalAuth } = require('../../auth/authUtils');
const { shopAuthenticationV2 } = require('../../auth/shopAuth');
const upload = require('../../configs/multer.config');

/*
========================
        PUBLIC
========================
*/

// SEARCH — optional auth so keyword is saved for logged-in users
router.get('/search', optionalAuth, asyncHandler(ProductController.searchProducts));

// TOP SELLING
router.get('/top-selling', asyncHandler(ProductController.getTopSelling));

// SUGGESTED (recommendation by search history)
router.get('/suggested/:userId', asyncHandler(ProductController.getSuggestedProducts));

// GET ALL (with filter by category, price, gender, etc.)
router.get('/', asyncHandler(ProductController.getAllProducts));

// GET DETAIL
// GET REVIEWS (public)
router.get('/:productId/reviews', asyncHandler(ProductController.getReviews));

// GET DETAIL
router.get('/:productId', asyncHandler(ProductController.getProductById));


/*
========================
        AUTH
========================
*/
router.use(authenticationV2);

// ADD REVIEW (requires auth)
router.post('/:productId/reviews', asyncHandler(ProductController.addReview));

// UPDATE REVIEW (requires auth, owner)
router.patch('/:productId/reviews/:reviewId', asyncHandler(ProductController.updateReview));

// DELETE REVIEW (requires auth, owner)
router.delete('/:productId/reviews/:reviewId', asyncHandler(ProductController.deleteReview));

// SHOP reply to review (shopAuthenticationV2)
router.post('/:productId/reviews/:reviewId/reply', shopAuthenticationV2, asyncHandler(ProductController.shopReplyReview));

/*
========================
        SHOP APIs (requires shopAuthenticationV2)
========================
*/

// CREATE (validate body first, then upload images to Cloudinary)
router.post('/', shopAuthenticationV2, upload.array('images', 5), asyncHandler(ProductController.createProduct));

// UPDATE (validate body first, then upload images to Cloudinary if present)
router.patch('/:productId', shopAuthenticationV2, upload.array('images', 5), asyncHandler(ProductController.updateProduct));

// DELETE (hard delete)
router.delete('/:productId', shopAuthenticationV2, asyncHandler(ProductController.deleteProduct));

// DRAFTS
router.get('/shop/drafts', shopAuthenticationV2, asyncHandler(ProductController.getAllDraftForShop));

// PUBLISHED
router.get('/shop/published', shopAuthenticationV2, asyncHandler(ProductController.getAllPublishForShop));

// PUBLISH
router.patch('/:productId/publish', shopAuthenticationV2, asyncHandler(ProductController.publishProduct));

// UNPUBLISH
router.patch('/:productId/unpublish', shopAuthenticationV2, asyncHandler(ProductController.unPublishProduct));

/*
========================
    SHOP SOFT DELETE
========================
*/

// Soft delete product
router.patch('/:id/soft-delete', shopAuthenticationV2, asyncHandler(ShopProductController.softDeleteProduct));

// Restore product
router.patch('/:id/restore', shopAuthenticationV2, asyncHandler(ShopProductController.restoreProduct));

// Permanently delete product
router.delete('/:id/permanent', shopAuthenticationV2, asyncHandler(ShopProductController.permanentlyDeleteProduct));

// Get deleted products
router.get('/shop/deleted', shopAuthenticationV2, asyncHandler(ShopProductController.getDeletedProducts));

module.exports = router;

// 'use strict';

// const express = require('express');
// const router = express.Router();
// const ProductController = require('../../controllers/product.controller');
// const { asyncHandler } = require('../../auth/checkAuth');
// const { authenticationV2 } = require('../../auth/authUtils');

// //Public routes
// router.get('/search/:keySearch',asyncHandler(ProductController.getSearchProducts));
// router.get('',asyncHandler(ProductController.findAllProducts));
// router.get('/:product_id',asyncHandler(ProductController.findProduct));




// // Authentication
// router.use(authenticationV2)

// ////////////////////////////////////////////////////////////////

// router.post('',asyncHandler(ProductController.createProduct));
// router.patch('/:productId',asyncHandler(ProductController.updateProduct));


// router.post('/publish/:id',asyncHandler(ProductController.publishProductByShop));
// router.post('/unpublish/:id',asyncHandler(ProductController.unPublishProductByShop));


// // Query //
// router.get('/drafts/all',asyncHandler(ProductController.getAllDraftForShop));
// router.get('/published/all',asyncHandler(ProductController.getAllPublishForShop));

// module.exports = router