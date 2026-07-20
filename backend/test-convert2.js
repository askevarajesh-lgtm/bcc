const mongoose = require('mongoose');
const salesPipelineService = require('./src/modules/salesPipeline/salesPipeline.service');
const Deal = require('./src/modules/salesPipeline/deal.model');
const User = require('./src/modules/auth/user.model');
require('dotenv').config({ path: '.env' });

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/misaa_dev');
  console.log("Connected");
  
  let admin = await User.findOne({ role: 'commander_admin' });
  if (!admin) {
    admin = await User.create({ name: 'Admin', email: 'admin_test_123@gmail.com', role: 'commander_admin', password: 'password123' });
  }

  const deal = await Deal.create({
    name: 'New Test',
    stage: 'won',
    value: 5000,
    category: 'Sales',
    companyId: admin._id,
    rep: 'Raj',
    ownerInit: 'RA'
  });
  console.log("Created deal:", deal._id);
  
  try {
    const result = await salesPipelineService.convertDealToClient(
      deal._id,
      "test_" + Date.now() + "@gmail.com",
      "password123",
      admin._id,
      admin.role,
      admin.agencyId || null,
      admin._id
    );
    console.log("Converted:", result.email);
  } catch (err) {
    console.error("SERVICE ERROR:", err.message);
  }

  mongoose.disconnect();
}
run().catch(console.error);
