const { MongoClient } = require('mongodb');
const cryptoUtils = require('./src/utils/crypto');
const axios = require('axios');
require('dotenv').config();

async function run() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/m1_agency');
  await client.connect();
  const db = client.db();
  const settings = await db.collection('ai_settings').findOne({ anthropicApiKey: { $ne: null } });
  
  if (settings) {
    const key = cryptoUtils.decrypt(settings.anthropicApiKey);
    try {
      const res = await axios.get('https://api.anthropic.com/v1/models', {
        headers: {
          'x-api-key': key,
          'anthropic-version': '2023-06-01'
        }
      });
      console.log(JSON.stringify(res.data, null, 2));
    } catch (err) {
      console.error(err.response ? err.response.data : err.message);
    }
  } else {
    console.log("No anthropic key found");
  }
  await client.close();
}
run();
