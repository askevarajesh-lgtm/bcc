const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/bcc-martech').then(async () => {
  const User = require('./src/modules/auth/user.model');
  const user = await User.findOne({ role: 'agency_manager' });
  console.log('Manager:', user?.name, user?.email, user?.agencyId);
  const brands = await User.find({ agencyId: user?.agencyId, role: { $in: ['brand_super_admin', 'brand_manager', 'agency_client'] } });
  console.log('Brands length by agencyId:', brands.length);
  console.log(brands.map(b => ({ name: b.name, status: b.status })));
  
  const allBrands = await User.find({ role: { $in: ['brand_super_admin', 'brand_manager', 'agency_client'] } });
  console.log('All Brands length:', allBrands.length);
  console.log(allBrands.map(b => ({ name: b.name, status: b.status, agencyId: b.agencyId, createdBy: b.createdBy })));
  
  process.exit(0);
}).catch(console.error);
