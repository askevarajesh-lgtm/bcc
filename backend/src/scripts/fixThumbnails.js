const mongoose = require('mongoose');
require('dotenv').config({ path: '../../.env' });
const FormTemplate = require('../modules/forms/form-template.model');

async function fixThumbnails() {
  try {
    // Determine mongo URI (fallback to default local)
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bcc_seo';
    await mongoose.connect(uri);

    const templates = await FormTemplate.find({});
    console.log(`Found ${templates.length} templates. Updating thumbnails...`);

    for(let tpl of templates) {
      const text = encodeURIComponent(tpl.templateName || tpl.name || 'Template');
      // Using placehold.co to generate clean, dynamic text-based thumbnails matching the UI aesthetic
      tpl.thumbnail = `https://placehold.co/600x400/F1F5F9/0F172A?font=inter&text=${text}`;
      await tpl.save();
    }
    
    console.log('Successfully updated thumbnails for ' + templates.length + ' templates.');
    process.exit(0);
  } catch (err) {
    console.error('Error fixing thumbnails:', err);
    process.exit(1);
  }
}

fixThumbnails();
