'use strict';

const { Readable } = require('stream');
const cloudinary = require('../configs/cloudinary.config');

function uploadBufferToCloudinary(file, folder) {
    return new Promise((resolve, reject) => {
        if (!file || !file.buffer) {
            reject(new Error('Invalid file buffer'));
            return;
        }

        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: 'image'
            },
            (error, result) => {
                if (error) {
                    reject(error);
                    return;
                }

                resolve(result);
            }
        );

        Readable.from(file.buffer).pipe(uploadStream);
    });
}

async function uploadFilesToCloudinary(files = [], folder = 'learning-ecommerce/products') {
    if (!Array.isArray(files) || files.length === 0) {
        return [];
    }

    const results = await Promise.all(
        files.map((file) => uploadBufferToCloudinary(file, folder))
    );

    return results.map((result) => result.secure_url || result.url);
}

module.exports = {
    uploadFilesToCloudinary
};