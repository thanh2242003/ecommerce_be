'use strict';

const { convertToOnjectIdMongodb } = require("../../utils");
const { cart } = require("../cart.model");



const findCardById = async (cardId) => {
    return await cart.findOne({ _id: convertToOnjectIdMongodb(cardId) }).lean();
}

module.exports = { findCardById }