'use strict';

const { SuccessResponse } = require('../core/success.response');
const UserService = require('../services/user.service');

class UserController {
  getProfile = async (req, res, next) => {
    new SuccessResponse({
      message: 'Get profile successfully!',
      metadata: await UserService.getProfile(req.user.userId),
    }).send(res);
  };
}

module.exports = new UserController();