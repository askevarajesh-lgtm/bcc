const QRLink = require('./qr-link.model');

// Create QR Link
exports.createQR = async (req, res, next) => {
  try {
    const { name, type, customUrl, foreground, background, shape } = req.body;
    const workspaceId = req.workspaceId;

    if (!name || !type) {
      return res.status(400).json({ success: false, error: 'QR Code name and type are required' });
    }

    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const slugExists = await QRLink.findOne({ workspaceId, slug, isDeleted: false });
    if (slugExists) {
      return res.status(400).json({ success: false, error: 'A QR Code with that slug/name already exists' });
    }

    // Default destination link
    const scanLink = customUrl || `https://bcc.askeva.io/q/${slug}`;

    const qrLink = new QRLink({
      workspaceId,
      name,
      slug,
      type,
      scanLink,
      foreground: foreground || 'var(--accent-primary)',
      background: background || '#ffffff',
      shape: shape || 'Square',
      createdBy: req.user?._id,
      updatedBy: req.user?._id
    });

    const saved = await qrLink.save();
    res.status(201).json({ success: true, data: saved });
  } catch (error) {
    next(error);
  }
};

// List QR Links
exports.getQRs = async (req, res, next) => {
  try {
    const workspaceId = req.workspaceId;
    const { search } = req.query;

    const query = { workspaceId, isDeleted: false };
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const qrs = await QRLink.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: qrs });
  } catch (error) {
    next(error);
  }
};

// Get Details
exports.getQRDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const qr = await QRLink.findOne({ _id: id, workspaceId: req.workspaceId, isDeleted: false });
    if (!qr) {
      return res.status(404).json({ success: false, error: 'QR code not found' });
    }
    res.json({ success: true, data: qr });
  } catch (error) {
    next(error);
  }
};

// Delete QR
exports.deleteQR = async (req, res, next) => {
  try {
    const { id } = req.params;
    const qr = await QRLink.findOne({ _id: id, workspaceId: req.workspaceId, isDeleted: false });
    if (!qr) {
      return res.status(404).json({ success: false, error: 'QR code not found' });
    }

    qr.isDeleted = true;
    qr.updatedBy = req.user?._id;
    await qr.save();

    res.json({ success: true, message: 'QR code deleted' });
  } catch (error) {
    next(error);
  }
};

// Public QR Details
exports.getPublicQR = async (req, res, next) => {
  try {
    const { id } = req.params;
    const qr = await QRLink.findOne({ _id: id, isDeleted: false });
    if (!qr) {
      return res.status(404).json({ success: false, error: 'QR code not found' });
    }
    res.json({ success: true, data: qr });
  } catch (error) {
    next(error);
  }
};

// Public QR Redirection Handler
exports.redirectScan = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const qr = await QRLink.findOne({ slug, isDeleted: false });
    
    if (!qr) {
      return res.status(404).send('QR code target not found');
    }

    // Increment scans counter
    qr.scans += 1;
    await qr.save();

    // Verify scanLink prefix and redirect
    let destination = qr.scanLink;
    if (!/^[a-z0-9+.-]+:/i.test(destination)) {
      destination = 'https://' + destination;
    }

    res.redirect(302, destination);
  } catch (error) {
    next(error);
  }
};
