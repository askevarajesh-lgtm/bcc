const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const Account = require('./campaign-scheduled/campaignScheduled.account.model');
const ClientCompany = require('./auth/user.model');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to DB");
  
  // Find agency manager
  const agencyUser = await ClientCompany.findOne({ role: 'agency_manager' });
  console.log("Agency:", agencyUser._id, agencyUser.email);
  
  // Find Test Admin
  const testAdmin = await ClientCompany.findOne({ email: 'test@askeva.io' }) || await ClientCompany.findOne({ role: 'agency_client', name: /test/i });
  console.log("Test Admin:", testAdmin ? testAdmin._id : 'Not found');
  
  // Find new Admin
  const newAdmin = await ClientCompany.findOne({ email: 'new@askeva.io' }) || await ClientCompany.findOne({ role: 'agency_client', name: /new/i });
  console.log("new Admin:", newAdmin ? newAdmin._id : 'Not found');
  
  const allAccounts = await Account.find({}).lean();
  console.log(`Total accounts in DB: ${allAccounts.length}`);
  
  for (const acc of allAccounts) {
    console.log(`Account ${acc.platform} - ${acc.username || acc.page_name}`);
    console.log(`  companyId: ${acc.companyId}`);
    console.log(`  clientCompanyId: ${acc.clientCompanyId}`);
  }
  
  mongoose.disconnect();
}
run().catch(console.error);
