'use strict';

const Address = require('../models/address.model');
const { BadRequestError, NotFoundError } = require('../core/error.response');

class AddressService {

    // Thêm địa chỉ mới cho user
    // Địa chỉ đầu tiên tự động là mặc định, các địa chỉ sau là phụ
    static async createAddress({ userId, receiverName, receiverPhone, address }) {
        if (!receiverName || !receiverPhone || !address) {
            throw new BadRequestError('receiverName, receiverPhone, and address are required');
        }

        // Kiểm tra user đã có địa chỉ nào chưa
        const existingCount = await Address.countDocuments({ userId });
        const isDefault = existingCount === 0; // Địa chỉ đầu tiên = mặc định

        return await Address.create({ userId, receiverName, receiverPhone, address, isDefault });
    }

    // Lấy tất cả địa chỉ của user
    static async getAddressesByUser({ userId }) {
        return await Address.find({ userId }).lean();
    }

    // Cập nhật địa chỉ — chỉ cho phép user sở hữu
    static async updateAddress({ userId, addressId, receiverName, receiverPhone, address }) {
        const updated = await Address.findOneAndUpdate(
            { _id: addressId, userId },
            {
                ...(receiverName && { receiverName }),
                ...(receiverPhone && { receiverPhone }),
                ...(address && { address })
            },
            { new: true }
        );

        if (!updated) {
            throw new NotFoundError('Address not found or does not belong to the user');
        }

        return updated;
    }

    // Xóa địa chỉ — chỉ cho phép user sở hữu
    // Nếu xóa địa chỉ mặc định → tự động chuyển địa chỉ cũ nhất còn lại thành mặc định
    static async deleteAddress({ userId, addressId }) {
        const deleted = await Address.findOneAndDelete({ _id: addressId, userId });

        if (!deleted) {
            throw new NotFoundError('Address not found or does not belong to the user');
        }

        // Nếu vừa xóa địa chỉ mặc định → gán mặc định cho địa chỉ cũ nhất còn lại
        if (deleted.isDefault) {
            const oldest = await Address.findOne({ userId }).sort({ createdAt: 1 });
            if (oldest) {
                oldest.isDefault = true;
                await oldest.save();
            }
        }

        return deleted;
    }

    // Lấy địa chỉ mặc định của user
    static async getDefaultAddress({ userId }) {
        const defaultAddr = await Address.findOne({ userId, isDefault: true }).lean();

        if (!defaultAddr) {
            throw new NotFoundError('No default address found');
        }

        return defaultAddr;
    }

    // Đặt 1 địa chỉ làm mặc định (bỏ mặc định cũ)
    static async setDefaultAddress({ userId, addressId }) {
        const target = await Address.findOne({ _id: addressId, userId });

        if (!target) {
            throw new NotFoundError('Address not found or does not belong to the user');
        }

        // Bỏ mặc định tất cả địa chỉ cũ của user
        await Address.updateMany({ userId }, { isDefault: false });

        // Đặt địa chỉ mới làm mặc định
        target.isDefault = true;
        await target.save();

        return target;
    }
}

module.exports = AddressService;
