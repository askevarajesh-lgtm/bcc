// shimOperationModel.js
module.exports = {
  Service: {
    find: () => ({ lean: () => [] }),
    findById: () => ({ lean: () => null }),
    findOne: () => ({ lean: () => null }),
  },
  Plan: {
    find: () => ({ lean: () => [] }),
    findById: () => ({ lean: () => null }),
    findOne: () => ({ lean: () => null }),
  }
};
