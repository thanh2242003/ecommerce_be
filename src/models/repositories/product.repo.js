'use strict';

// const { product, electronic, clothing, furniture } = require('../../models/product.model');
const Product = require('../../models/product.model');
console.log("Product model:", Product);
const { Types, Schema } = require('mongoose');
const { getSelectData, getUnSelectData, convertToOnjectIdMongodb } = require('../../utils');

// =================================================================


const findAllDraftForShop = async ({ query, limit, skip }) => {
    return await queryProduct({ query, limit, skip })
}

const findAllPublishForShop = async ({ query, limit, skip }) => {
    return await queryProduct({ query, limit, skip })
}
// Gop 2 thang tren thanh 1
const queryProduct = async ({ query, limit, skip }) => {
    return await Product.find(query).
        populate('product_shop', 'name email -_id').
        sort({ updateAt: -1 }).
        skip(skip).
        limit(limit).
        lean().
        exec()
}

const searchProductsByUser = async ({ keySearch }) => {
    const regexSearch = new RegExp(keySearch, 'i')
    const results = await Product.find(
        { isPublished: true, $text: { $search: regexSearch } },
        { score: { $meta: 'textScore' } }
    ).sort({ score: { $meta: 'textScore' } }).lean()

    return results
}


const findAllProducts = async ({ limit, sort, page, filter, select }) => {
    const skip = (page - 1) * limit
    const sortBy = sort === 'ctime' ? { _id: -1 } : { _id: 1 }
    const products = await Product.find(filter).
        sort(sortBy).
        skip(skip).
        limit(limit).
        select(getSelectData(select)).
        lean()
    return products
}

const findProduct = async ({ product_id, unSelect }) => {
    return await Product.findById(product_id).select(getUnSelectData(unSelect))
}



// PUT
const publishProductByShop = async ({ product_shop, product_id }) => {
    // const foundShop = await product.findOne({
    //     product_shop: new Types.ObjectId(product_shop),
    //     _id: new Types.ObjectId(product_id),
    // })

    // if (!foundShop) {
    //     return null;
    // }

    // foundShop.isDraft = false;
    // foundShop.isPublished = true;

    // const {modifiedCount} = foundShop.update(foundShop) // update = 1 , ko update = 0

    // return modifiedCount

    const foundShop = await Product.findOneAndUpdate(
        {
            product_shop: new Types.ObjectId(product_shop),
            _id: new Types.ObjectId(product_id),
        },
        {
            $set: {
                isDraft: false,
                isPublished: true,
            }
        },
        { new: true } // Return the updated document
    );
    if (!foundShop) {
        return null;
    }
    return 1;
}

const unPublishProductByShop = async ({ product_shop, product_id }) => {

    const foundShop = await Product.findOneAndUpdate(
        {
            product_shop: new Types.ObjectId(product_shop),
            _id: new Types.ObjectId(product_id),
        },
        {
            $set: {
                isDraft: true,
                isPublished: false,
            }
        },
        { new: true } // Return the updated document
    );
    if (!foundShop) {
        return null;
    }
    return 1;
}

const updateProductById = async ({ productId, bodyUpdate, model, isNew = true }) => {
    return await model.findOneAndUpdate(
        { _id: productId }, // Tìm sản phẩm dựa trên _id
        bodyUpdate,         // Dữ liệu cập nhật
        { new: isNew });
}

const getProductById = async (productId) => {
    if (!Types.ObjectId.isValid(productId)) return null;
    return await Product.findById(productId).lean()
}

const checkProductByServer = async (products) => {
    return await Promise.all(products.map(async product => {
        const foundProduct = await getProductById(product.productId);
        if (foundProduct) {
            return {
                price: foundProduct.price || foundProduct.product_price,
                quantity: foundProduct.product_quantity || product.quantity || 0,
                productId: product.productId,
            }
        }
    }))
}

module.exports = {
    findAllDraftForShop,
    publishProductByShop,
    findAllPublishForShop,
    unPublishProductByShop,
    searchProductsByUser,
    findAllProducts,
    findProduct,
    updateProductById,
    getProductById,
    checkProductByServer
};
