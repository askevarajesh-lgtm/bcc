// shimInvoiceModel.js
module.exports = {
  find: () => ({ populate: () => ({ sort: () => ({ lean: () => [] }) }) }),
  findById: () => ({ populate: () => ({ lean: () => null }) }),
  findOne: () => ({ lean: () => null }),
  create: async (data) => data,
  updateOne: async () => ({}),
};
