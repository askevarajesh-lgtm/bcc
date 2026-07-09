require('dotenv').config({path: '../../.env'});
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI).then(async () => {
  const User = mongoose.model('User', new mongoose.Schema({ name: String, email: String, role: String, adminId: mongoose.Schema.Types.ObjectId, createdBy: mongoose.Schema.Types.ObjectId }, { strict: false }));
  const users = await User.find({ role: { $in: ['agency_super_admin', 'brand_super_admin'] } });
  console.log('TOTAL CLIENTS:', users.length);
  users.forEach(u => console.log(u.name, 'role:', u.role, 'adminId:', u.adminId, 'createdBy:', u.createdBy));
  
  const commanderUsers = await User.find({ role: 'commander_admin' });
  console.log('COMMANDERS:', commanderUsers.length);
  commanderUsers.forEach(u => console.log(u._id, u.name, 'role:', u.role, 'adminId:', u.adminId, 'createdBy:', u.createdBy));

  process.exit(0);
}).catch(err => { console.error(err); process.exit(1); });
