const mongoose = require('mongoose');

// Connect locally if possible, but let's just use the process.env.MONGO_URI from a real script run via bash where we inject it
require('dotenv').config({path: '../../.env'});

if (!process.env.MONGO_URI) {
  console.log("No MONGO_URI");
  process.exit(1);
}

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  
  const testingAdmin = await User.findOne({ name: /Testing Name Admin/i });
  console.log("Testing Admin:", testingAdmin);
  
  const bccAdmin = await User.findOne({ name: /Bcc Admin/i });
  console.log("Bcc Admin:", bccAdmin);

  const allActiveClients = await User.find({ role: { $in: ['agency_super_admin', 'brand_super_admin'] }, status: 'active' });
  console.log("All Active Clients:", allActiveClients.length);
  allActiveClients.forEach(c => {
    console.log(c.name, c.role, "createdBy:", c.createdBy, "adminId:", c.adminId);
  });

  process.exit(0);
}).catch(console.error);
