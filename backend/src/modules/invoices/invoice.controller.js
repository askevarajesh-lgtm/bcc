const Invoice = require('./invoice.model');

// Create Invoice
exports.createInvoice = async (req, res, next) => {
  try {
    const data = { ...req.body };
    data.createdBy = req.user._id;

    if (req.user.role === 'commander_admin') {
      data.adminId = req.user._id;
    } else if (['brand_super_admin', 'brand_manager'].includes(req.user.role)) {
      data.brandId = req.user.brandId || req.user._id;
      data.agencyId = req.companyId || req.user.agencyId;
      if (req.user.adminId) data.adminId = req.user.adminId;
    } else {
      data.agencyId = req.companyId || req.user.agencyId || req.user._id;
      if (req.user.adminId) data.adminId = req.user.adminId;
    }

    const invoice = await Invoice.create(data);
    res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    next(error);
  }
};

// Update Invoice
exports.updateInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, isDeleted: false });
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    req.body.updatedBy = req.user._id;

    const updatedInvoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: updatedInvoice });
  } catch (error) {
    next(error);
  }
};

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
    if (req.query.clientId) {
      queryFilter.clientId = req.query.clientId;
    }
    if (req.query.companyId) {
      queryFilter.clientId = req.query.companyId;
    }

    if (req.user.role === 'commander_admin') {
      queryFilter.adminId = req.user._id;
    } else if (['brand_super_admin', 'brand_manager'].includes(req.user.role)) {
      queryFilter.brandId = req.user.brandId || req.user._id;
      // Clients should not see draft invoices
      queryFilter.invoiceStatus = { $ne: 'Draft' };
    } else {
      queryFilter.agencyId = req.companyId || req.user.agencyId || req.user._id;
    }

    const total = await Invoice.countDocuments(queryFilter);
    const invoices = await Invoice.find(queryFilter)
      .populate('clientId', 'name email')
      .populate({
        path: 'proposalId',
        select: 'proposalNumber name masterItems',
        populate: {
          path: 'masterItems',
          select: 'name price description status categories startDate endDate handlingDuration'
        }
      })
      .populate('createdBy', 'name email roleName')
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
          select: 'name itemCode category categories price duration description startDate endDate handlingDuration'
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

// Delete Invoice
exports.deleteInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, isDeleted: false });
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    
    invoice.isDeleted = true;
    invoice.updatedBy = req.user._id;
    await invoice.save();
    
    res.status(200).json({ success: true, message: 'Invoice deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Send Invoice to Client
exports.sendInvoice = async (req, res, next) => {
  try {
    const { method } = req.body;
    const invoice = await Invoice.findOne({ _id: req.params.id, isDeleted: false });
    
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    if (method === 'email') {
      console.log(`[Email Integration] Sending invoice ${invoice.invoiceNumber} to client via Email...`);
      // TODO: Connect actual email integration
    } else if (method === 'whatsapp') {
      console.log(`[WhatsApp Integration] Sending invoice ${invoice.invoiceNumber} to client via WhatsApp...`);
      // TODO: Connect actual WhatsApp integration
    } else if (method === 'dashboard') {
      console.log(`[Dashboard Integration] Making invoice ${invoice.invoiceNumber} available on Client Dashboard...`);
      // Simply updating status handles this due to our query filter logic
    } else {
      return res.status(400).json({ success: false, message: 'Invalid delivery method' });
    }

    // Change status from Draft to Sent (or leave as Pending/Paid if already updated)
    if (invoice.invoiceStatus === 'Draft') {
      invoice.invoiceStatus = 'Sent';
      await invoice.save();
    }

    res.status(200).json({ 
      success: true, 
      message: `Invoice successfully sent via ${method}`,
      data: invoice
    });
  } catch (error) {
    next(error);
  }
};
