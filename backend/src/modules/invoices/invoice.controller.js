const Invoice = require('./invoice.model');

// Get All Invoices
exports.getInvoices = async (req, res, next) => {
  try {
    let queryFilter = { isDeleted: false };
    
    // Pagination & Search
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    if (req.query.search) {
      queryFilter.invoiceNumber = { $regex: req.query.search, $options: 'i' };
    }
    if (req.query.paymentStatus) {
      queryFilter.paymentStatus = req.query.paymentStatus;
    }
    if (req.query.invoiceStatus) {
      queryFilter.invoiceStatus = req.query.invoiceStatus;
    }

    if (req.user.role === 'commander_admin') {
      queryFilter.adminId = req.user._id;
    } else if (['brand_super_admin', 'brand_manager'].includes(req.user.role) && req.user.brandId) {
      queryFilter.brandId = req.user.brandId;
    } else if (['agency_super_admin', 'agency_manager'].includes(req.user.role) && req.user.agencyId) {
      queryFilter.agencyId = req.user.agencyId;
    }

    const total = await Invoice.countDocuments(queryFilter);
    const invoices = await Invoice.find(queryFilter)
      .populate('clientId', 'name email')
      .populate('proposalId', 'proposalNumber name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({ 
      success: true, 
      count: invoices.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: invoices 
    });
  } catch (error) {
    next(error);
  }
};

// Get Single Invoice
exports.getInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, isDeleted: false })
      .populate('clientId', 'name email address phone')
      .populate({
        path: 'proposalId',
        select: 'proposalNumber name masterItems',
        populate: {
          path: 'masterItems',
          select: 'name itemCode category price duration description'
        }
      });
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    next(error);
  }
};

// Update Payment
exports.updatePayment = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, isDeleted: false });
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const { paymentMode, transactionId } = req.body;
    
    invoice.paymentStatus = 'Paid';
    invoice.invoiceStatus = 'Paid';
    invoice.paymentMode = paymentMode;
    invoice.transactionId = transactionId;
    invoice.updatedBy = req.user._id;

    await invoice.save();

    res.status(200).json({ success: true, data: invoice, message: 'Payment updated successfully' });
  } catch (error) {
    next(error);
  }
};

// Generate PDF (Mock implementation)
exports.generatePDF = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, url: '/dummy-invoice.pdf' });
  } catch (error) {
    next(error);
  }
};
