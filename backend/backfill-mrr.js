const mongoose = require('mongoose');
const User = require('./src/modules/auth/user.model');
const AgencyPackage = require('./src/modules/agencyPackages/agencyPackage.model');
require('dotenv').config();

async function backfillMrr() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bcc-seo');
    
    // Find clients that have a packageName but mrr is 0 or null
    const clients = await User.find({ role: 'agency_client', packageName: { $exists: true, $ne: null } });
    
    let count = 0;
    for (const client of clients) {
      const pkg = await AgencyPackage.findOne({ name: client.packageName });
      if (pkg && pkg.price) {
        client.mrr = pkg.price;
        await client.save();
        count++;
        console.log(`Updated client ${client.name} with MRR ₹${pkg.price}`);
      }
    }
    
    console.log(`Backfill complete. Updated ${count} clients.`);
    process.exit(0);
  } catch (error) {
    console.error('Backfill error:', error);
    process.exit(1);
  }
}

backfillMrr();
