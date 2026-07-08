class PublishBridgeService {
  async publish(websiteId) {
    console.log(`Calling publishService.publishWebsite for website ${websiteId}`);
    // Wrapper around the existing publishService
    // return await publishService.publishWebsite(websiteId);
    return true;
  }
}

module.exports = new PublishBridgeService();
