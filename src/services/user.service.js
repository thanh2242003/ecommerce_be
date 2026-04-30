// 'use strict';

// const userModel = require("../models/user.model");

// const findByEmail = async ({ email, select = {
//     email: 1, password: 1, name: 1, status: 1, roles: 1, phone: 1, address: 1, avatar: 1
// } }) => {
//     return await userModel.findOne({ email }).select(select).lean()
// }

// module.exports = {
//     findByEmail
// }

'use strict';

const { BadRequestError } = require('../core/error.response');
const userModel = require('../models/user.model');

class UserService {

    // ================= LOGIN =================
    static async findByEmail({ email, select = {
        email: 1,
        password: 1,
        name: 1,
        status: 1,
        roles: 1,
        phone: 1,
        address: 1,
        avatar: 1
    } }) {
        return await userModel.findOne({ email }).select(select).lean();
    }

    // ================= GET PROFILE =================
    static async getProfile(userId) {
        const user = await userModel.findById(userId)
            .select('name email phone address avatar status roles verify')
            .lean();

        if (!user) {
            throw new BadRequestError('User not found');
        }

        return user;
    }
}

module.exports = UserService;
