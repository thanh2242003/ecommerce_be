'use strict';

const { SuccessResponse } = require('../core/success.response');
const AdminProductService = require('../services/admin.product.service');

class AdminProductController {
    getProducts = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get products successfully!',
            metadata: await AdminProductService.getProducts(req.query),
        }).send(res);
    };

    updateProductStatus = async (req, res, next) => {
        new SuccessResponse({
            message: 'Update product status successfully!',
            metadata: await AdminProductService.updateProductStatus(
                req.params.id,
                req.body.status,
                req.adminId,
                req.body.moderationNote
            ),
        }).send(res);
    };

    deleteProduct = async (req, res, next) => {
        new SuccessResponse({
            message: 'Delete product successfully!',
            metadata: await AdminProductService.deleteProduct(req.params.id),
        }).send(res);
    };
}

module.exports = new AdminProductController();
