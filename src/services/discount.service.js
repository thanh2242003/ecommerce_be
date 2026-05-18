"use strict";
const { BadRequestError, NotFoundError } = require('../core/error.response');
const Discount = require('../models/discount.model');
const { findAllDiscountCodesUnselected, checkDiscountExists } = require('../models/repositories/discount.repo');
const { findAllProducts } = require('../models/repositories/product.repo');
const { convertToOnjectIdMongodb } = require('../utils');
/**
    1. generate discount code [Shop | Admin]
    2. Get discount amount [Users]
    3. Get all discount codes [Users | Shop]
    4. verify discount code [users]
    5. delete discount code [shop \ admin]
    6. cancel discount code [users]
 */

class DiscountService {
    static async createDiscountCode(payload) {
        const {
            code,
            startDate,
            start_date,
            expiryDate,
            end_date,
            isActive,
            shopId,
            minOrderValue,
            min_order_value,
            product_ids,
            appliesTo,
            applies_to,
            name,
            description,
            type,
            maxUses,
            max_uses,
            maxUsesPerUser,
            max_uses_per_user,
            value,
            usersUsed,
        } = payload;

        const sDate = startDate || start_date;
        const eDate = expiryDate || end_date;

        if (new Date(sDate) > new Date(eDate)) {
            throw BadRequestError(`Start day must be before end day!`);
        }

        // check uniqueness for same scope/shop combination
        const found = await Discount.findOne({
            code: code.toUpperCase(),
            ...(shopId ? { shopId: convertToOnjectIdMongodb(shopId) } : { scope: 'platform' }),
        }).lean();

        if (found && found.isActive) {
            throw new BadRequestError(`Discount code '${code}' already exists!`);
        }

        const newDiscount = await Discount.create({
            code: String(code).toUpperCase(),
            description: description || name,
            type,
            value,
            startDate: new Date(sDate),
            expiryDate: new Date(eDate),
            maxUses: maxUses || max_uses || 1,
            usedCount: 0,
            maxUsesPerUser: maxUsesPerUser || max_uses_per_user || 1,
            minOrderValue: minOrderValue || min_order_value || 0,
            shopId: shopId || null,
            appliesTo: appliesTo || applies_to || 'all',
            applicableProducts: appliesTo == 'specific' || applies_to == 'specific' ? product_ids || [] : [],
            isActive: typeof isActive === 'boolean' ? isActive : true,
            scope: shopId ? 'shop' : 'platform',
        });

        return newDiscount;
    }

    static async updateDiscount() {
        //....
    }

    //get all discount available with products
    static async getAllDiscountCodesWithProducts({ code, shopId, userId, limit = 50, page = 1 }) {
        //create index for discount code
        const foundDiscountCode = await Discount.findOne({
            code,
            $or: [
                { scope: 'platform' },
                { shopId: convertToOnjectIdMongodb(shopId) }
            ],
        }).lean();

        if (!foundDiscountCode || !foundDiscountCode.isActive) {
            throw new NotFoundError(`Discount code '${code}' not exists!`);
        }

        const now = new Date();
        if (new Date(foundDiscountCode.startDate) > now || new Date(foundDiscountCode.expiryDate) < now) {
            throw new NotFoundError(`Discount code '${code}' is not active at this time`);
        }

        const { appliesTo: discount_applies_to, applicableProducts: discount_product_ids } = foundDiscountCode;

        let products

        if (discount_applies_to == 'all') {
            // get all product

            products = await findAllProducts(
                {
                    limit: +limit,
                    sort: 'ctime',
                    page: +page,
                    filter: {
                        product_shop: convertToOnjectIdMongodb(shopId),
                        isPublished: true,

                    },
                    select: ['title', 'price', 'images']

                })

            return products
        }
        if (discount_applies_to == 'specific') {
            // get product by ids

            products = await findAllProducts(
                {
                    limit: +limit,
                    sort: 'ctime',
                    page: +page,
                    filter: {
                        _id: { $in: discount_product_ids },
                        isPublished: true,

                    },
                    select: ['product_name']

                })

            return products
        }
    }

    //get all discount of shop
    static async getAllDiscountCodesByShop({
        limit, page, shopId
    }) {
        const discounts = await findAllDiscountCodesUnselected({
            limit: +limit,
            page: +page,
            sort: 'ctime',
            filter: {
                shopId: convertToOnjectIdMongodb(shopId),
                isActive: true,
                scope: 'shop',
            },
            unselect: ['__v', 'shopId'],
            model: Discount
        });

        return discounts;
    }
    /*
        Apply Discount Code
        products = [
            {
                productId,
                shopId,
                quantity,
                name,
                price
            },
            {
                productId,
                shopId,
                quantity,
                name,
                price
            }
        ]
    */
    static async getDiscountAmount({ codeId, shopId, userId, products }) {
        const foundDiscountCode = await Discount.findOne({
            code: String(codeId).toUpperCase(),
            isActive: true,
            $or: [
                { scope: 'platform' },
                { shopId: convertToOnjectIdMongodb(shopId) }
            ]
        }).lean();

        if (!foundDiscountCode) throw new NotFoundError(`Discount code not found`);

        const {
            isActive: discount_is_active,
            maxUses: discount_max_uses,
            startDate: discount_start_date,
            minOrderValue: discount_min_order_value,
            maxUsesPerUser: discount_max_uses_per_user,
            usersUsed: discount_users_used,
            type: discount_type,
            expiryDate: discount_end_date,
            value: discount_value
        } = foundDiscountCode;

        if (!discount_is_active) {
            throw new NotFoundError(`Discount expired! `);
        }

        if (discount_max_uses <= 0) {
            throw new NotFoundError(`All discount uses have been used!`);
        }
        if (new Date() < new Date(discount_start_date) || new Date() > new Date(discount_end_date)) {
            throw new NotFoundError(`Discount code has expired!`);
        }
        // check minimum order value
        let totalOrder = 0;
        if (discount_min_order_value > 0) {
            totalOrder = products.reduce((acc, product) => {
                return acc + (product.quantity * product.price);
            }, 0);

            if (totalOrder < discount_min_order_value) {
                throw new BadRequestError(`Discount requires a minimum order value of ${discount_min_order_value}`);
            }
        }

        const amount = discount_type === 'fixed_amount' ? discount_value : totalOrder * (discount_value / 100);

        return {
            totalOrder,
            discount: amount,
            totalPrice: totalOrder - amount,
        };
    }

    static async deleteDiscountCode({ codeId, shopId }) {
        const deleted = await Discount.findOneAndDelete({
            code: String(codeId).toUpperCase(),
            shopId: convertToOnjectIdMongodb(shopId),
        });
        return deleted;
    }

    static async cancelDiscountCode({ codeId, shopId, userId }) {
        const foundDiscountCode = await checkDiscountExists(discount, {
            discount_code: codeId,
            discount_shopId: convertToOnjectIdMongodb(shopId),
        })
        if (!foundDiscountCode) throw new NotFoundError(`Discount code not found`);

        // if (foundDiscountCode.discount_users_used.find(user => user.userId === userId)) {
        //     throw new BadRequestError(`Discount code has been used by this user!`)
        // }

        const result = await discount.findByIdAndUpdate(foundDiscountCode._id, {
            $pull: {
                discount_users_used: userId,
            },
            $inc: {
                discount_max_uses: 1,
                discount_user_count: -1,
            },
        })
        return result
    }
}

module.exports = DiscountService;