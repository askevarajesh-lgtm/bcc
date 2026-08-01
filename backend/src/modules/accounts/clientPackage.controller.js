const ClientPackage = require('../agencyPackages/clientPackage.model');

// Helper to get agency ID based on role
const getAgencyId = (req) => req.user.role === 'agency_super_admin' ? req.user._id : req.user.agencyId;

exports.getPackages = async (req, res, next) => {
  try {
    const agencyId = getAgencyId(req);
    if (!agencyId) return res.status(400).json({ success: false, message: 'Agency context not found' });

    const packages = await ClientPackage.find({ agencyId });
    res.status(200).json({ success: true, data: packages });
  } catch (error) {
    next(error);
  }
};

exports.createPackage = async (req, res, next) => {
  try {
    const agencyId = getAgencyId(req);
    if (!agencyId) return res.status(400).json({ success: false, message: 'Agency context not found' });

    const newPackage = new ClientPackage({
      ...req.body,
      agencyId
    });

    await newPackage.save();
    res.status(201).json({ success: true, message: 'Package created successfully', data: newPackage });
  } catch (error) {
    next(error);
  }
};

exports.updatePackage = async (req, res, next) => {
  try {
    const agencyId = getAgencyId(req);
    const packageId = req.params.id;

    const updatedPackage = await ClientPackage.findOneAndUpdate(
      { _id: packageId, agencyId },
      req.body,
      { returnDocument: 'after', runValidators: true }
    );

    if (!updatedPackage) return res.status(404).json({ success: false, message: 'Package not found' });
    res.status(200).json({ success: true, message: 'Package updated successfully', data: updatedPackage });
  } catch (error) {
    next(error);
  }
};

exports.deletePackage = async (req, res, next) => {
  try {
    const agencyId = getAgencyId(req);
    const packageId = req.params.id;

    const deletedPackage = await ClientPackage.findOneAndDelete({ _id: packageId, agencyId });
    if (!deletedPackage) return res.status(404).json({ success: false, message: 'Package not found' });

    res.status(200).json({ success: true, message: 'Package deleted successfully' });
  } catch (error) {
    next(error);
  }
};
