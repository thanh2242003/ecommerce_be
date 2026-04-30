'use strict';

const { CREATED, SuccessResponse } = require('../core/success.response');
const AddressService = require('../services/address.service');

class AddressController {

    // POST /v1/api/address
    createAddress = async (req, res, next) => {
        const userId = req.user.userId;

        new CREATED({
            message: 'Address created successfully',
            metadata: await AddressService.createAddress({
                userId,
                ...req.body
            })
        }).send(res);
    }

    // GET /v1/api/address
    getAddresses = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get addresses successfully',
            metadata: await AddressService.getAddressesByUser({
                userId: req.user.userId
            })
        }).send(res);
    }

    // PUT /v1/api/address/:id
    updateAddress = async (req, res, next) => {
        new SuccessResponse({
            message: 'Address updated successfully',
            metadata: await AddressService.updateAddress({
                userId: req.user.userId,
                addressId: req.params.id,
                ...req.body
            })
        }).send(res);
    }

    // DELETE /v1/api/address/:id
    deleteAddress = async (req, res, next) => {
        new SuccessResponse({
            message: 'Address deleted successfully',
            metadata: await AddressService.deleteAddress({
                userId: req.user.userId,
                addressId: req.params.id
            })
        }).send(res);
    }

    // GET /v1/api/address/default
    getDefaultAddress = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get default address successfully',
            metadata: await AddressService.getDefaultAddress({
                userId: req.user.userId
            })
        }).send(res);
    }

    // PUT /v1/api/address/set-default/:id
    setDefaultAddress = async (req, res, next) => {
        new SuccessResponse({
            message: 'Default address updated successfully',
            metadata: await AddressService.setDefaultAddress({
                userId: req.user.userId,
                addressId: req.params.id
            })
        }).send(res);
    }
}

module.exports = new AddressController;
