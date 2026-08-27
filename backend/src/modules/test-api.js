const jwt = require('jsonwebtoken');
const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const ClientCompany = require('./auth/user.model');

async function testAPI() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const agencyUser = await ClientCompany.findOne({ role: 'agency_manager' }).lean();
  console.log("Found Agency User:", agencyUser._id, agencyUser.email);
  
  // Sign JWT
  const token = jwt.sign(agencyUser, process.env.JWT_SECRET || 'super_secret_jwt_key_12345');
  
  const clientCompanyId = '6a86b5bae756bca0913436e2'; // Test Admin
  
  try {
    const res = await axios.get('http://127.0.0.1:5500/api/campaign-scheduled/debug-auth', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-selected-client-id': clientCompanyId
      }
    });
    console.log("API Response:", res.data);
  } catch (err) {
    console.error("API Error:", err.response ? err.response.data : err.message);
  }
  
  mongoose.disconnect();
}

testAPI().catch(console.error);
