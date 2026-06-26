
module.exports = {
  buildDropdownOptions: (items, labelField, valueField) =>
    (items || []).map(i => ({ label: i[labelField], value: i[valueField] || i._id })),

  buildDropdownQuery: (query, config) => {
    const filters = { ...config.additionalFilters };
    const searchVal = query.search || query.q;
    if (searchVal && config.searchFields && config.searchFields.length > 0) {
      filters.$or = config.searchFields.map(field => ({ [field]: { $regex: searchVal, $options: 'i' } }));
    }
    const sortField = query.sortBy || config.defaultSortField || 'name';
    const sortOrder = query.sortOrder === 'desc' ? -1 : 1;
    const sort = { [sortField]: sortOrder };
    return { filters, sort, limit: parseInt(query.limit) || 0, page: parseInt(query.page) || 1 };
  },

  executeDropdownQuery: async (Model, queryOptions, populateOptions = [], selectFields = '') => {
    let query = Model.find(queryOptions.filters).select(selectFields).sort(queryOptions.sort);
    if (queryOptions.limit > 0) {
      const skip = ((queryOptions.page || 1) - 1) * queryOptions.limit;
      query = query.skip(skip).limit(queryOptions.limit);
    }
    if (populateOptions) {
      if (Array.isArray(populateOptions)) {
        populateOptions.forEach(pop => {
          query = query.populate(pop);
        });
      } else {
        query = query.populate(populateOptions);
      }
    }
    return await query.exec();
  }
};
