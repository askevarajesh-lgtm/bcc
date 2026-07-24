const mongoose = require('mongoose');
require('dotenv').config({path: './.env'});

console.log('URI:', process.env.MONGODB_URI);

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  const res = await db.collection('aisettings').updateMany({}, { $set: { anthropicApiKey: null } });
  console.log('Cleared anthropic keys:', res);
  process.exit(0);
}).catch(e => {
  console.error('MongoDB error:', e.message);
  process.exit(1);
});
