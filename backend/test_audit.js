const dotenv = require('dotenv');
dotenv.config();
const service = require('./src/modules/seoIntelligence/dataForSeo.service.js');

async function test() {
  console.log('Starting audit for bccmartech.com...');
  try {
    const res = await service.runOnPageAudit('bccmartech.com', 5);
    console.log(JSON.stringify(res, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

test();
