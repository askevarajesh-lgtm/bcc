const ReportSchedule = require('../reports/reportSchedule.model');
const SentReport = require('../reports/sentReport.model');
const User = require('../auth/user.model');

// Helper to get agency ID based on role
const getAgencyId = (req) => req.user.role === 'agency_super_admin' ? req.user._id : req.user.agencyId;

exports.getReports = async (req, res, next) => {
  try {
    const agencyId = getAgencyId(req);
    if (!agencyId) return res.status(400).json({ success: false, message: 'Agency context not found' });

    // Fetch reports and populate client
    const reportsData = await ReportSchedule.find({ agencyId }).populate('clientId', 'name companyName');

    const formattedReports = reportsData.map(r => {
      // Mock logic for status: if nextSend is today, it's processing, else ready.
      const isToday = r.nextSend && new Date(r.nextSend).toDateString() === new Date().toDateString();
      
      return {
        id: r._id,
        name: r.name,
        client: r.clientId?.companyName || r.clientId?.name || 'Unknown Client',
        clientId: r.clientId?._id,
        type: r.template,
        frequency: r.frequency,
        lastGenerated: r.updatedAt, // Using updatedAt as a proxy for last generated for now
        nextSend: r.nextSend,
        status: isToday ? 'processing' : 'ready',
        format: r.format,
        deliveryMethod: r.deliveryMethod,
        recipients: r.recipients,
        whatsappRecipients: r.whatsappRecipients,
        notes: r.notes
      };
    });

    const stats = {
      total: formattedReports.length,
      automated: formattedReports.filter(r => r.status !== 'paused').length, // Simplification
      processing: formattedReports.filter(r => r.status === 'processing').length
    };

    const clientsData = await User.find({ agencyId, role: { $in: ['brand_super_admin', 'brand_manager', 'agency_client'] } }).select('_id companyName name');
    const clients = clientsData.map(c => ({ id: c._id, name: c.companyName || c.name || 'Unnamed Client' }));

    res.status(200).json({ success: true, data: { reports: formattedReports, stats, clients } });
  } catch (error) {
    next(error);
  }
};

exports.createReport = async (req, res, next) => {
  try {
    const agencyId = getAgencyId(req);
    if (!agencyId) return res.status(400).json({ success: false, message: 'Agency context not found' });

    const newReport = new ReportSchedule({
      ...req.body,
      agencyId,
      createdBy: req.user._id
    });

    await newReport.save();
    res.status(201).json({ success: true, message: 'Report created successfully', data: newReport });
  } catch (error) {
    next(error);
  }
};

exports.updateReport = async (req, res, next) => {
  try {
    const agencyId = getAgencyId(req);
    const reportId = req.params.id;

    const report = await ReportSchedule.findOneAndUpdate(
      { _id: reportId, agencyId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
    res.status(200).json({ success: true, message: 'Report updated successfully', data: report });
  } catch (error) {
    next(error);
  }
};

exports.deleteReport = async (req, res, next) => {
  try {
    const agencyId = getAgencyId(req);
    const reportId = req.params.id;

    const report = await ReportSchedule.findOneAndDelete({ _id: reportId, agencyId });
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

    res.status(200).json({ success: true, message: 'Report deleted successfully' });
  } catch (error) {
    next(error);
  }
};

exports.triggerAction = async (req, res, next) => {
  try {
    const { action } = req.body;
    const reportId = req.params.id;

    // This is a stub for PDF generation / Emailing logic.
    let message = 'Action processed';
    if (action === 'download') message = 'PDF generation queued successfully.';
    else if (action === 'send') message = 'Email dispatched to client successfully.';

    res.status(200).json({ success: true, message });
  } catch (error) {
    next(error);
  }
};
