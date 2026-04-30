'use strict';

const express = require('express');
const router = express.Router();
const AddressController = require('../../controllers/address.controller');
const { asyncHandler } = require('../../auth/checkAuth');
const { authenticationV2 } = require('../../auth/authUtils');

// Tất cả route address đều cần đăng nhập
router.use(authenticationV2);

router.post('', asyncHandler(AddressController.createAddress));
router.get('', asyncHandler(AddressController.getAddresses));
router.get('/default', asyncHandler(AddressController.getDefaultAddress));
router.put('/set-default/:id', asyncHandler(AddressController.setDefaultAddress));
router.put('/:id', asyncHandler(AddressController.updateAddress));
router.delete('/:id', asyncHandler(AddressController.deleteAddress));

module.exports = router;
