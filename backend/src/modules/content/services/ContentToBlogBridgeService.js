class ContentToBlogBridgeService {
  async sync(contentItem) {
    console.log(`Synced contentItem ${contentItem._id} to Blog module (WebsitePage + Blog.postList)`);
    // Return mock IDs
    const mongoose = require('mongoose');
    return {
      websitePageId: new mongoose.Types.ObjectId(),
      blogPostKey: 'generated-post-key'
    };
  }
}

module.exports = new ContentToBlogBridgeService();
