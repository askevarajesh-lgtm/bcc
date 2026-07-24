const mongoose = require('mongoose');
const AIService = require('./src/modules/content/services/AIService');
const AiSettings = require('./src/modules/aiStudio/models/aiSettings.model');
require('dotenv').config();

async function test() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/m1-labs');
    const settings = await AiSettings.findOne({});
    if (!settings) {
      console.log('No settings found');
      process.exit(1);
    }
    
    console.log('Testing with workspaceId:', settings.workspaceId);
    
    const result = await AIService.generateJSON(
      'Write a 2 sentence paragraph about AI.',
      'You are a helpful assistant. Provide output in JSON like {"title": "...", "body": "..."}',
      settings.workspaceId,
      'claude-3-sonnet-20240229'
    );
    
    console.log('Result:', result);
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    mongoose.disconnect();
  }
}

test();
