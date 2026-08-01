const mongoose = require('mongoose');
const User = require('./src/modules/auth/user.model');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bcc-seo').then(async () => {
  const agency = await User.findOne({ role: 'agency_super_admin' });
  
  // Find a user who works FOR the agency (no brandId)
  const user = await User.findOne({ 
    agencyId: agency?._id, 
    _id: { $ne: agency?._id },
    brandId: null
  }).populate('agencyId').populate('brandId');
  
  console.log('Sub-User Role:', user?.role);
  console.log('Sub-User Theme:', user?.theme);
  console.log('Sub-User Agency Theme:', user?.agencyId?.theme);
  
  const getEffectiveTheme = async (user) => {
    let effectiveTheme = { primaryColor: '#034EA1', secondaryColor: '#0ea5e9' };
    if (user.agencyId && user.agencyId.theme && user.agencyId.theme.primaryColor) {
      effectiveTheme = user.agencyId.theme;
    }
    if (user.brandId && user.brandId.theme && user.brandId.theme.primaryColor) {
      effectiveTheme = user.brandId.theme;
    }
    if (user.theme && user.theme.primaryColor) {
      effectiveTheme = user.theme;
    }
    return effectiveTheme;
  };
  
  if (user) {
    console.log('Effective Theme:', await getEffectiveTheme(user));
  } else {
    console.log('No agency sub-user found');
  }
  
  process.exit(0);
});
