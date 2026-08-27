const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const ClientCompany = require('./auth/user.model');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const agencyUser = await ClientCompany.findOne({ role: 'agency_manager' });
  console.log("Agency User:", agencyUser._id);
  console.log("Agency User companyId:", agencyUser.companyId);
  console.log("Agency User agencyId:", agencyUser.agencyId);
  
  const testAdmin = await ClientCompany.findOne({ email: 'test@askeva.io' }) || await ClientCompany.findOne({ role: 'agency_client', name: /test/i });
  console.log("Test Admin agencyId:", testAdmin.agencyId);
  
  mongoose.disconnect();
}
run().catch(console.error);
