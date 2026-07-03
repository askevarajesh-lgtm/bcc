class WhatsAppService {
  async sendMessage(to, message) {
    console.log(`[Mock WhatsApp] Sending to ${to}: ${message}`);
    return { success: true };
  }
}

module.exports = new WhatsAppService();
