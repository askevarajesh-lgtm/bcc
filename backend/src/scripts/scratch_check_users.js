const mongoose = require('mongoose');
const User = require('./src/modules/auth/user.model');
mongoose.connect('mongodb://127.0.0.1:27017/bcc').then(async () => {
  const brands = await User.find({ isDirect: true });
  for (const b of brands) {
    const count = await User.countDocuments({ brandId: b._id, role: { $in: ['user', 'brand_manager'] } });
    console.log(`Brand: ${b.email} (Role: ${b.role}), Users Count for brandId: ${count}`);
    const users = await User.find({ brandId: b._id });
    console.log('All Users for brand:', users.map(u => ({ email: u.email, role: u.role, brandId: u.brandId, id: u._id })));
  }
  process.exit();
});
