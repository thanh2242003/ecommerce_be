'use strict';

const { CREATED, OK, SuccessResponse } = require("../core/success.response");
const AccessService = require("../services/access.service");

class AccessController {
    // ================= SHOP ENDPOINTS =================
    signIn = async (req, res, next) => {
        new SuccessResponse({
            message: 'Login successfully!',
            metadata: await AccessService.signIn(req.body)
        }).send(res);
    }

    signUp = async (req, res, next) => {
        new CREATED({
            message: 'Registered successfully!',
            metadata: await AccessService.signUp(req.body),
            options: {
                limit: 10
            }
        }).send(res);

    }

    // ================= USER ENDPOINTS =================
    userSignIn = async (req, res, next) => {
        new SuccessResponse({
            message: 'Login successfully!',
            metadata: await AccessService.userSignIn(req.body)
        }).send(res);
    }

    userSignUp = async (req, res, next) => {
        new CREATED({
            message: 'Registered successfully!',
            metadata: await AccessService.userSignUp(req.body),
            options: {
                limit: 10
            }
        }).send(res);
    }

    logout = async (req, res, next) => {
        new SuccessResponse({
            message: 'Logout successfully!',
            metadata: await AccessService.logout({ keyStore: req.keyStore })
        }).send(res);
    }

    handlerRefreshToken = async (req, res, next) => {
        // =================================================================
        //v2 fixed
        new SuccessResponse({
            message: 'Get token successfully!',
            metadata: await AccessService.handlerRefeshTokenV2({
                refreshToken: req.refreshToken,
                user: req.user,
                keyStore: req.keyStore
            })
        }).send(res);
    }


}

module.exports = new AccessController;