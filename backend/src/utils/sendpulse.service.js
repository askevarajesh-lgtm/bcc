class SendPulseService {
  async sendEmail(to, subject, html) {
    console.log(`[Mock SendPulse] Sending to ${to}: ${subject}`);
    return { success: true };
  }
}

module.exports = new SendPulseService();
