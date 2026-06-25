// shimUserModel.js
module.exports = {
  find: () => ({ select: () => ({ lean: () => [] }) }),
  findById: () => ({ select: () => ({ lean: () => null }) }),
  findOne: () => ({ select: () => ({ lean: () => null }) }),
  distinct: () => [],
};
