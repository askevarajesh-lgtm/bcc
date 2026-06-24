const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const FormTemplate = require('../modules/forms/form-template.model');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/m1growth_db";

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const templatesDir = path.join(__dirname, 'data', 'form-templates');
    if (!fs.existsSync(templatesDir)) {
      console.log('No form-templates directory found. Please ensure JSON files are present.');
      return;
    }

    const files = fs.readdirSync(templatesDir).filter(file => file.endsWith('.json'));
    console.log(`Found ${files.length} template JSON files. Starting seed process...`);

    let insertedCount = 0;
    let skippedCount = 0;

    for (const file of files) {
      const filePath = path.join(templatesDir, file);
      const templateData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

      // Check if template already exists
      const existingTemplate = await FormTemplate.findOne({ templateName: templateData.templateName });

      if (existingTemplate) {
        console.log(`[SKIPPED] Template already exists: "${templateData.templateName}"`);
        skippedCount++;
      } else {
        await FormTemplate.create(templateData);
        console.log(`[INSERTED] New template added: "${templateData.templateName}"`);
        insertedCount++;
      }
    }

    console.log('-------------------------------------------');
    console.log('Seed Process Completed.');
    console.log(`Total Templates Inserted: ${insertedCount}`);
    console.log(`Total Templates Skipped: ${skippedCount}`);
    console.log('-------------------------------------------');

  } catch (error) {
    console.error('Error seeding form templates:', error);
  } finally {
    mongoose.connection.close();
  }
}

seed();
