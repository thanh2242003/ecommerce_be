'use strict';

/**
 * Parse pagination parameters from query
 * @param {object} query - Query object containing page and limit
 * @returns {object} { page, limit, skip }
 */
const parsePagination = (query) => {
    let page = parseInt(query.page) || 1;
    let limit = parseInt(query.limit) || 10;

    // Validation
    page = page < 1 ? 1 : page;
    limit = limit < 1 ? 10 : limit > 100 ? 100 : limit;

    const skip = (page - 1) * limit;

    return { page, limit, skip };
};

/**
 * Create pagination metadata
 * @param {number} total - Total count
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {object} Pagination metadata
 */
const getPaginationMetadata = (total, page, limit) => {
    return {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
    };
};

module.exports = {
    parsePagination,
    getPaginationMetadata
};
