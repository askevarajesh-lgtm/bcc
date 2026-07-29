const mongoose = require("mongoose");
const DomainPurchase = require("./domainPurchase.model");
const Transaction = require("../transactions/transaction.model");
const {
  buildQuery,
  executePaginatedQuery,
} = require("../../utils/pagination.helper");

const getAllDomainPurchases = async (companyId, reqQuery = {}) => {
  const additionalFilters = { tenantCompanyId: companyId };

  // Search functionality
  if (reqQuery.search) {
    const searchRegex = { $regex: reqQuery.search, $options: "i" };
    additionalFilters.$or = [
      { domainName: searchRegex },
      { contactPerson: searchRegex },
      { contactNumber: searchRegex },
      { product: searchRegex },
      { paymentDetail: searchRegex },
    ];
  }

  // Filter by company
  if (reqQuery.companyId) {
    additionalFilters.companyId = reqQuery.companyId;
  }

  const queryOptions = buildQuery(reqQuery, {
    searchFields: ["domainName", "contactPerson", "contactNumber", "product"],
    defaultSortField: "paymentDate",
    defaultSortOrder: "desc",
    additionalFilters,
  });

  const result = await executePaginatedQuery(DomainPurchase, queryOptions);

  // Populate company and user fields
  if (result.data && Array.isArray(result.data)) {
    await DomainPurchase.populate(result.data, [
      { path: "companyId", select: "name email phone address" },
      { path: "createdBy", select: "name email" },
      { path: "updatedBy", select: "name email" },
    ]);
  }

  return result;
};

const getDomainPurchaseById = async (domainPurchaseId, companyId) => {
  const domainPurchase = await DomainPurchase.findOne({
    _id: domainPurchaseId,
    tenantCompanyId: companyId,
  })
    .populate("companyId", "name email phone address")
    .populate("createdBy", "name email")
    .populate("updatedBy", "name email");

  if (!domainPurchase) {
    throw new Error("Domain Purchase not found");
  }

  return domainPurchase;
};

const createDomainPurchase = async (domainPurchaseData, companyId, userId) => {
  // Validate required fields
  if (!domainPurchaseData.domainName) {
    throw new Error("Domain Name is required");
  }
  if (!domainPurchaseData.companyId) {
    throw new Error("Company Name is required");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const domainPurchase = new DomainPurchase({
      ...domainPurchaseData,
      tenantCompanyId: companyId,
      createdBy: userId,
    });
    
    const savedDomainPurchase = await domainPurchase.save({ session });
    
    if (domainPurchaseData.paidAmount > 0) {
      const transaction = new Transaction({
        domainPurchaseId: savedDomainPurchase._id,
        companyId: domainPurchaseData.companyId,
        amount: domainPurchaseData.paidAmount,
        paymentDate: domainPurchaseData.paymentDate || new Date(),
        paymentMethod: 'Other',
        transactionType: 'Manual',
        status: 'Verified',
        recordedBy: userId,
        adminId: companyId, 
        agencyId: companyId,
        screenshotUrl: domainPurchaseData.paymentScreenshotUrl,
        referenceNumber: domainPurchaseData.paymentDetail,
      });
      await transaction.save({ session });
      
      savedDomainPurchase.transactionId = transaction._id;
      await savedDomainPurchase.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    return savedDomainPurchase;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const updateDomainPurchase = async (
  domainPurchaseId,
  domainPurchaseData,
  companyId,
  userId,
) => {
  const domainPurchase = await DomainPurchase.findOne({
    _id: domainPurchaseId,
    tenantCompanyId: companyId,
  });

  if (!domainPurchase) {
    throw new Error("Domain Purchase not found");
  }

  // Validate required fields if being updated
  if (
    domainPurchaseData.domainName !== undefined &&
    !domainPurchaseData.domainName
  ) {
    throw new Error("Domain Name cannot be empty");
  }
  if (
    domainPurchaseData.companyId !== undefined &&
    !domainPurchaseData.companyId
  ) {
    throw new Error("Company Name cannot be empty");
  }

  Object.assign(domainPurchase, domainPurchaseData);
  domainPurchase.updatedBy = userId;
  await domainPurchase.save();

  return await getDomainPurchaseById(domainPurchaseId, companyId);
};

const deleteDomainPurchase = async (domainPurchaseId, companyId) => {
  const domainPurchase = await DomainPurchase.findOne({
    _id: domainPurchaseId,
    tenantCompanyId: companyId,
  });

  if (!domainPurchase) {
    throw new Error("Domain Purchase not found");
  }

  await domainPurchase.deleteOne();
  return { message: "Domain Purchase deleted successfully" };
};

module.exports = {
  getAllDomainPurchases,
  getDomainPurchaseById,
  createDomainPurchase,
  updateDomainPurchase,
  deleteDomainPurchase,
};
