'use strict';

const { CREATED, OK, SuccessResponse } = require("../core/success.response");
const CartService = require("../services/cart.service");

class CartController {

    // POST /v1/api/cart/add
    // Body: { productId, variantId, quantity }
    addToCartMobile = async (req, res, next) => {
        const { productId, variantId, quantity } = req.body;
        const userId = req.user.userId;

        new SuccessResponse({
            message: 'Item added to cart successfully!',
            metadata: await CartService.addToCartMobile({
                userId, productId, variantId, quantity
            })
        }).send(res);
    }

    // POST /v1/api/cart/update
    // Body: { productId, variantId, quantity }
    update = async (req, res, next) => {
        const { productId, variantId, quantity } = req.body;
        const userId = req.user.userId;

        new SuccessResponse({
            message: 'Update quantity cart successfully!',
            metadata: await CartService.updateQuantity({
                userId, productId, variantId, quantity
            })
        }).send(res);
    }

    // DELETE /v1/api/cart
    // Body: { productId, variantId }
    delete = async (req, res, next) => {
        const { productId, variantId } = req.body;
        const userId = req.user.userId;

        new SuccessResponse({
            message: 'Delete cart item successfully!',
            metadata: await CartService.deleteCartItem({
                userId, productId, variantId
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