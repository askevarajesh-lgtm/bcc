const archiver = require('archiver');
const ContentItem = require('./models/ContentItem');

exports.exportApprovedItems = async (req, res) => {
  try {
    const workspaceId = req.companyId || req.workspaceId || (req.user && req.user.workspaceId);

    // Fetch all Approved or Published items for the workspace
    const items = await ContentItem.find({ 
      workspaceId, 
      status: { $in: ['Approved', 'Published'] } 
    }).sort({ createdAt: -1 });

    if (!items || items.length === 0) {
      return res.status(404).json({ success: false, message: 'No approved or published items found to export. Please approve items in QA tab first.' });
    }

    // Set response headers for zip file download
    res.attachment('content-delivery.zip');
    
    const archive = archiver('zip', {
      zlib: { level: 9 } // maximum compression
    });

    archive.on('error', (err) => {
      throw err;
    });

    // Pipe archive data to the response
    archive.pipe(res);

    // Create INDEX.md content
    let indexContent = `# Content Delivery Manifest\n\nGenerated on: ${new Date().toLocaleDateString()}\n\n## Included Assets\n\n`;

    // Loop through items and append them to the archive
    items.forEach((item, index) => {
      const safeTitle = item.title ? item.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() : `asset_${index}`;
      const typeStr = item.type || 'content';
      
      const fileName = `${typeStr}_${safeTitle}.md`;
      indexContent += `- [${item.title || 'Untitled'}](${fileName}) (${item.type})\n`;

      // Construct file content
      let fileContent = `# ${item.title || 'Untitled'}\n\n`;
      fileContent += `**Type:** ${item.type}\n`;
      if (item.platform) fileContent += `**Platform:** ${item.platform}\n`;
      if (item.topic) fileContent += `**Topic:** ${item.topic}\n`;
      fileContent += `**Status:** ${item.status}\n\n`;
      fileContent += `---\n\n`;
      fileContent += `${item.body || ''}\n\n`;
      
      if (item.hashtags && item.hashtags.length > 0) {
        fileContent += `**Hashtags:** ${item.hashtags.join(', ')}\n`;
      }

      archive.append(fileContent, { name: fileName });
    });

    // Add INDEX.md to the archive
    archive.append(indexContent, { name: 'INDEX.md' });

    // Finalize the archive
    await archive.finalize();
  } catch (error) {
    console.error('Export Error:', error);
    res.status(500).json({ success: false, message: 'Failed to export contents.' });
  }
};
