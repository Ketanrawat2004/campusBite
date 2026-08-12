'use strict';

/**
 * Parse pagination params from request query.
 */
function parsePagination(query, defaults = {}) {
  const page = Math.max(1, parseInt(query.page) || defaults.page || 1);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(query.limit) || defaults.limit || 20)
  );
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

/**
 * Build pagination metadata for API responses.
 */
function buildMeta(page, limit, total) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page * limit < total,
    hasPrevPage: page > 1,
  };
}

module.exports = { parsePagination, buildMeta };
