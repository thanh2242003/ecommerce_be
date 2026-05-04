'use strict';

const { SuccessResponse, CREATED } = require('../core/success.response');
const UserService = require('../services/user.service');

class UserController {
  // GET /v1/api/user/profile
  getProfile = async (req, res, next) => {
    new SuccessResponse({
      message: 'Get profile successfully!',
      metadata: await UserService.getProfile(req.user.userId),
    }).send(res);
  };

  // PATCH /v1/api/user/profile
  updateProfile = async (req, res, next) => {
    const { name, phone, address, avatar } = req.body;
    new SuccessResponse({
      message: 'Update profile successfully!',
      metadata: await UserService.updateProfile(req.user.userId, {
        name,
        phone,
        address,
        avatar
      })
    }).send(res);
  };

  // PATCH /v1/api/user/password
  changePassword = async (req, res, next) => {
    const { oldPassword, newPassword } = req.body;
    new SuccessResponse({
      message: 'Password changed successfully!',
      metadata: await UserService.changePassword(req.user.userId, oldPassword, newPassword)
    }).send(res);
  };

  // PATCH /v1/api/user/fcm-token
  updateFcmToken = async (req, res, next) => {
    const { fcmToken } = req.body;
    new SuccessResponse({
      message: 'FCM token updated successfully!',
      metadata: await UserService.updateFcmToken(req.user.userId, fcmToken)
    }).send(res);
  };

  // DELETE /v1/api/user/fcm-token
  removeFcmToken = async (req, res, next) => {
    const { fcmToken } = req.body;
    new SuccessResponse({
      message: 'FCM token removed successfully!',
      metadata: await UserService.removeFcmToken(req.user.userId, fcmToken)
    }).send(res);
  };
}

module.exports = new UserController();