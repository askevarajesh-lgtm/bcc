require('dotenv').config();
const mongoose = require('mongoose');
const Template = require('./src/models/Template');
const os = require('os');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const unzipper = require('unzipper');
const cloudinary = require('./src/config/cloudinary');

async function debugExtraction() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://developerraja:aevb9S1eYQfA30y1@cluster0.hhhks6y.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');
  const templateRecord = await Template.findOne({ isDeleted: false }).sort({ createdAt: -1 });
  if (!templateRecord) return console.log("No templates found");
  
  console.log("Testing template:", templateRecord.name);
  console.log("ZIP URL:", templateRecord.zipUrl);

  const tempBaseDir = path.join(os.tmpdir(), 'extracted_templates');
  if (!fs.existsSync(tempBaseDir)) fs.mkdirSync(tempBaseDir, { recursive: true });
  
  const extractSessionId = templateRecord._id.toString() + '-' + Date.now();
  const extractedDir = path.join(tempBaseDir, extractSessionId);
  const zipPath = path.join(tempBaseDir, `${extractSessionId}.zip`);

  try {
    const isCloudinary = templateRecord.zipUrl.startsWith('http');
    if (isCloudinary) {
      let publicId = templateRecord.zipUrl;
      const regex = /\/(?:upload|authenticated)(?:\/s--[a-zA-Z0-9_-]+--)?(?:\/v\d+)?\/(.+)$/;
      const match = templateRecord.zipUrl.match(regex);
      if (match && match[1]) {
        publicId = match[1];
      }

      console.log("Public ID:", publicId);
      const downloadUrl = cloudinary.utils.private_download_url(publicId, '', {
        resource_type: 'raw',
        type: 'authenticated'
      });
      console.log("Download URL generated");

      const response = await axios({
        method: 'GET',
        url: downloadUrl,
        responseType: 'stream'
      });
      
      await new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(zipPath);
        response.data.pipe(writer);
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
      console.log("Downloaded successfully to temp file");
    } else {
      console.log("Local file path");
    }

    fs.mkdirSync(extractedDir, { recursive: true });
    await fs.createReadStream(zipPath)
      .pipe(unzipper.Extract({ path: extractedDir }))
      .promise();

    console.log("Extracted successfully!");

    const findFiles = (dir, fileList = []) => {
      if (!fs.existsSync(dir)) return fileList;
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
          findFiles(filePath, fileList);
        } else {
          fileList.push(filePath);
        }
      }
      return fileList;
    };

    const allFiles = findFiles(extractedDir);
    console.log("Found files:", allFiles.length);
    const htmlFiles = allFiles.filter(f => f.toLowerCase().endsWith('.html'));
    console.log("HTML files:", htmlFiles.map(f => path.basename(f)));
    
  } catch (err) {
    console.error("DEBUG ERROR:", err.response ? err.response.status : err.message);
  } finally {
    process.exit(0);
  }
}

debugExtraction();
