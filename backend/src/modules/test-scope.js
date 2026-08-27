const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const Account = require('./campaign-scheduled/campaignScheduled.account.model');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const companyId = '6a868ed040f17bb4cea55373'; // Agency ID
  const clientCompanyId = '6a86b5bae756bca0913436e2'; // Test Admin ID
  
  const query = {
    $or: [{ companyId, clientCompanyId }, { companyId: clientCompanyId }],
  };
  
  const accounts = await Account.find(query).lean();
  console.log("Accounts matching scope query:", accounts.length);
  for (const acc of accounts) {
    console.log(`- ${acc.platform}: ${acc.username || acc.page_name}`);
  }
  
  // also check if we just query by clientCompanyId
  const exact = await Account.find({ clientCompanyId }).lean();
  console.log("Accounts exactly matching clientCompanyId:", exact.length);

  // what about the objectId types?
  // wait, companyId in DB is stored as string or ObjectId?
  const first = await Account.findOne({});
  console.log("Type of companyId in DB:", typeof first.companyId, first.companyId instanceof mongoose.Types.ObjectId);
  
  mongoose.disconnect();
}
run().catch(console.error);
