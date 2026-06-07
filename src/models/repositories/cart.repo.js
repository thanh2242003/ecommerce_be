'use strict';

const { convertToOnjectIdMongodb } = require("../../utils");
const { cart } = require("../cart.model");

const findCartById = async (cartId) => {
    return await cart.findOne({ _id: convertToOnjectIdMongodb(cartId) }).lean();
};

module.exports = { findCartById };
