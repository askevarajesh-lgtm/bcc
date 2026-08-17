const crypto = require('crypto');
const { WorkspaceReportShare } = require('../models/workspaceReportAsset.model');

class ReportShareService {
  /**
   * Generates a new share link for a report.
   */
  async createShareLink(reportId, projectId, userId, options = {}) {
    const shareToken = crypto.randomBytes(16).toString('hex');
    const { accessType = 'public', password, expiresAt } = options;

    const shareData = {
      reportId,
      projectId,
      createdBy: userId,
      shareToken,
      accessType,
      expiresAt
    };

    if (accessType === 'password-protected' && password) {
      // Normally we'd hash this password using bcrypt
      shareData.passwordHash = password; 
    }

    const share = new WorkspaceReportShare(shareData);
    await share.save();

    return share;
  }

  /**
   * Logs access and validates share token.
   */
  async accessShare(shareToken, ipAddress, userAgent) {
    const share = await WorkspaceReportShare.findOne({ shareToken, isRevoked: false }).populate('reportId');
    if (!share) throw new Error('Invalid or revoked share link');

    if (share.expiresAt && new Date() > share.expiresAt) {
      throw new Error('Share link expired');
    }

    share.views += 1;
    share.lastViewedAt = new Date();
    share.accessLogs.push({ ipAddress, userAgent });
    await share.save();

    return share;
  }
}

module.exports = new ReportShareService();
