
module.exports = {
  getPaginationParams: (query) => {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const skip = (page - 1) * limit;
    return { page, limit, skip };
  },
  buildPaginationMeta: (total, page, limit) => ({
    total, page, limit,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page < Math.ceil(total / limit),
    hasPrevPage: page > 1,
  }),
};
