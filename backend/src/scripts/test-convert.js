const mongoose = require('mongoose');
const salesPipelineService = require('./src/modules/salesPipeline/salesPipeline.service');
const Deal = require('./src/modules/salesPipeline/deal.model');
const User = require('./src/modules/auth/user.model');
require('dotenv').config({ path: '.env' });

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/misaa_dev');
  console.log("Connected");

  const deal = await Deal.findOne({ stage: 'won' }).sort({ createdAt: -1 });
  if (!deal) {
    console.log("No won deal found");
    return process.exit(0);
  }
  
  const creator = await User.findOne({ _id: deal.companyId });
  console.log("Creator role:", creator?.role);
  
  try {
    const result = await salesPipelineService.convertDealToClient(
      deal._id,
      "test_" + Date.now() + "@gmail.com",
      "password123",
      deal.companyId,
      creator?.role || 'commander_admin',
      creator?.agencyId || null,
      creator?._id
    );
    console.log("Converted:", result.email);
  } catch (err) {
    console.error("SERVICE ERROR:", err.message);
  }

  mongoose.disconnect();
}
run().catch(console.error);
