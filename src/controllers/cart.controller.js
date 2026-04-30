'use strict';

const { CREATED, OK, SuccessResponse } = require("../core/success.response");
const CartService = require("../services/cart.service");

class CartController {

    // POST /v1/api/cart/add
    addToCartMobile = async (req, res, next) => {
        const { productId, quantity, color, size } = req.body;
        const userId = req.user.userId;

        new SuccessResponse({
            message: 'Item added to cart successfully!',
            metadata: await CartService.addToCartMobile({
                userId, productId, quantity, color, size
            })
        }).send(res);
    }

    // POST /v1/api/cart/update
    update = async (req, res, next) => {
        const { productId, quantity, color, size } = req.body;
        const userId = req.user.userId;

        new SuccessResponse({
            message: 'Update quantity cart successfully!',
            metadata: await CartService.updateQuantity({
                userId, productId, quantity, color, size
            })
        }).send(res);
    }

    // DELETE /v1/api/cart
    delete = async (req, res, next) => {
        const { productId, color, size } = req.body;
        const userId = req.user.userId;

        new SuccessResponse({
            message: 'Delete cart item successfully!',
            metadata: await CartService.deleteCartItem({
                userId, productId, color, size
            })
        }).send(res);
    }

    // GET /v1/api/cart
    listToCart = async (req, res, next) => {
        const userId = req.user.userId;

        new SuccessResponse({
            message: 'Get list cart successfully!',
            metadata: await CartService.getListCart({ userId })
        }).send(res);
    }

}

module.exports = new CartController;