const Proposal = require('./proposal.model');
const Invoice = require('../invoices/invoice.model');

// Create Proposal
exports.createProposal = async (req, res, next) => {
  try {
    const data = { ...req.body };
    data.createdBy = req.user._id;

    if (['brand_super_admin', 'brand_manager'].includes(req.user.role)) {
      data.brandId = req.user.brandId;
      data.agencyId = req.user.agencyId;
      if (req.user.adminId) data.adminId = req.user.adminId;
    } else if (['agency_super_admin', 'agency_manager'].includes(req.user.role)) {
      data.agencyId = req.user.agencyId || req.user._id;
      if (req.user.adminId) data.adminId = req.user.adminId;
    } else if (req.user.role === 'commander_admin') {
      data.adminId = req.user._id;
    }

    const proposal = await Proposal.create(data);
    res.status(201).json({ success: true, data: proposal });
  } catch (error) {
    next(error);
  }
};

// Get All Proposals
exports.getProposals = async (req, res, next) => {
  try {
    let queryFilter = { isDeleted: false };
    
    // Pagination & Search
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    if (req.query.search) {
      queryFilter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { proposalNumber: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    if (req.query.status) {
      queryFilter.status = req.query.status;
    }

    if (req.user.role === 'commander_admin') {
      queryFilter.adminId = req.user._id;
    } else if (['brand_super_admin', 'brand_manager'].includes(req.user.role) && req.user.brandId) {
      queryFilter.brandId = req.user.brandId;
    } else if (['agency_super_admin', 'agency_manager'].includes(req.user.role) && req.user.agencyId) {
      queryFilter.agencyId = req.user.agencyId;
    }

    const total = await Proposal.countDocuments(queryFilter);
    const proposals = await Proposal.find(queryFilter)
      .populate('clientId', 'name email')
      .populate('masterItems', 'name itemCode price categories')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({ 
      success: true, 
      count: proposals.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: proposals 
    });
  } catch (error) {
    next(error);
  }
};

// Get Single Proposal
exports.getProposal = async (req, res, next) => {
  try {
    const proposal = await Proposal.findOne({ _id: req.params.id, isDeleted: false })
      .populate('clientId', 'name email address phone')
      .populate('masterItems', 'name itemCode category price duration description');
    if (!proposal) {
      return res.status(404).json({ success: false, message: 'Proposal not found' });
    }
    res.status(200).json({ success: true, data: proposal });
  } catch (error) {
    next(error);
  }
};

// Update Proposal
exports.updateProposal = async (req, res, next) => {
  try {
    const proposal = await Proposal.findOne({ _id: req.params.id, isDeleted: false });
    if (!proposal) {
      return res.status(404).json({ success: false, message: 'Proposal not found' });
    }

    req.body.updatedBy = req.user._id;

    const updatedProposal = await Proposal.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: updatedProposal });
  } catch (error) {
    next(error);
  }
};

// Soft Delete Proposal
exports.deleteProposal = async (req, res, next) => {
  try {
    const proposal = await Proposal.findOne({ _id: req.params.id, isDeleted: false });
    if (!proposal) {
      return res.status(404).json({ success: false, message: 'Proposal not found' });
    }

    proposal.isDeleted = true;
    proposal.updatedBy = req.user._id;
    await proposal.save();

    res.status(200).json({ success: true, message: 'Proposal deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Approve Proposal
exports.approveProposal = async (req, res, next) => {
  try {
    const proposal = await Proposal.findOne({ _id: req.params.id, isDeleted: false });
    if (!proposal) {
      return res.status(404).json({ success: false, message: 'Proposal not found' });
    }

    proposal.status = 'Approved';
    proposal.updatedBy = req.user._id;
    await proposal.save();

    res.status(200).json({ success: true, data: proposal, message: 'Proposal approved' });
  } catch (error) {
    next(error);
  }
};

// Generate Invoice from Proposal
exports.generateInvoice = async (req, res, next) => {
  try {
    const proposal = await Proposal.findOne({ _id: req.params.id, isDeleted: false });
    if (!proposal) {
      return res.status(404).json({ success: false, message: 'Proposal not found' });
    }
    if (proposal.status !== 'Approved') {
      return res.status(400).json({ success: false, message: 'Proposal must be approved to generate invoice' });
    }

    // Check if invoice already exists
    const existingInvoice = await Invoice.findOne({ proposalId: proposal._id, isDeleted: false });
    if (existingInvoice) {
      return res.status(400).json({ success: false, message: 'Invoice already generated for this proposal', invoiceId: existingInvoice._id });
    }

    // Create Invoice
    const invoiceData = {
      proposalId: proposal._id,
      clientId: proposal.clientId,
      amount: proposal.subtotal,
      tax: proposal.tax,
      discount: proposal.discount,
      grandTotal: proposal.grandTotal,
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // Default +15 days
      createdBy: req.user._id,
      adminId: proposal.adminId,
      agencyId: proposal.agencyId,
      brandId: proposal.brandId
    };

    const invoice = await Invoice.create(invoiceData);

    proposal.status = 'Converted to Invoice';
    await proposal.save();

    res.status(201).json({ success: true, data: invoice, message: 'Invoice generated successfully' });
  } catch (error) {
    next(error);
  }
};

// Generate PDF (Mock implementation)
exports.generatePDF = async (req, res, next) => {
  try {
    // Return a dummy PDF URL or binary stream for now
    res.status(200).json({ success: true, url: '/dummy-proposal.pdf' });
  } catch (error) {
    next(error);
  }
};
