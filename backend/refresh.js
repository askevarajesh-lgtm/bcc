const mongoose = require('mongoose');
require('dotenv').config();
const semrushService = require('./src/modules/semrush/semrush.service.js');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const db = mongoose.connection.db;
    const p = await db.collection('semrushprojects').findOne({ domain: 'askeva.io' });
    const siteHealth = await semrushService.getSiteHealth(p.domain);
    await db.collection('semrushprojectdatas').updateOne({ projectId: p._id }, { $set: { 'data.siteHealth': siteHealth }});
    console.log('Successfully updated DB with Site Health');
    process.exit(0);
});
