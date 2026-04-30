'use strict';

const express = require('express');
const router = express.Router();

// Nếu bạn muốn tắt apiKey hoàn toàn, bỏ middleware apiKey & permission.
// router.use(apiKey)
// router.use(permission('0000'))

router.use('/v1/api/address', require('./address/index'))
router.use('/v1/api/order', require('./order/index'))
router.use('/v1/api/checkout', require('./checkout/index'))
router.use('/v1/api/discount', require('./discount/index'))
router.use('/v1/api/inventory', require('./inventory/index'))
router.use('/v1/api/cart', require('./cart/index'))
router.use('/v1/api/category', require('./category/index'))
router.use('/v1/api/product', require('./product/index'))
router.use('/v1/api/search', require('./search/index'))
router.use('/v1/api/users', require('./notification/index'))
router.use('/v1/api', require('./notification/notification.routes'))
router.use('/api/users', require('./notification/index'))
router.use('/v1/api', require('./access/index'))
router.use('/v1/api/shop', require('./shop/index'));
router.use('/v1/api/admin', require('./admin/index'));

module.exports = router