'use strict';

const { SuccessResponse, CREATED } = require('../core/success.response');
const UserService = require('../services/user.service');
const { uploadFilesToCloudinary } = require('../helpers/cloudinary.helper');

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
    const { name, phone, address } = req.body;
    let avatar = req.body.avatar;

    // If a file was uploaded via multipart/form-data, upload to Cloudinary
    if (req.file) {
      const urls = await uploadFilesToCloudinary([req.file], 'learning-ecommerce/avatars');
      if (Array.isArray(urls) && urls.length > 0) {
        avatar = urls[0];
      }
    }

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

  getMyReviews = async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    new SuccessResponse({
      message: 'Get my reviews successfully!',
      metadata: await require('../services/product.service').ProductService.getReviewsByUser(req.user.userId, { page, limit })
    }).send(res);
  };
}

module.exports = new UserController();