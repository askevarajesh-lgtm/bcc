const ContentVersion = require('../models/contentVersion.model');
const ContentPiece = require('../models/contentPiece.model');
const contentEvents = require('../events/contentEvents');

class ContentVersioningService {
  /**
   * Creates a new version of the content, never overwriting.
   */
  async createVersion(contentPieceId, userId, payload, source = 'human_edited') {
    const piece = await ContentPiece.findById(contentPieceId);
    if (!piece) throw new Error('Content Piece not found');

    // Get latest version number
    const latestVersion = await ContentVersion.findOne({ contentPieceId })
      .sort({ versionNumber: -1 })
      .select('versionNumber')
      .lean();
    
    const nextVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;

    const newVersion = new ContentVersion({
      contentPieceId,
      versionNumber: nextVersionNumber,
      createdBy: userId,
      source,
      payload,
      qualityScore: {
        seo: { score: piece.seoScore || 0, findings: [] },
        readability: { score: piece.readabilityScore || 0, findings: [] }
      }
    });

    await newVersion.save();
    
    // Update pointer on the main piece
    piece.currentVersionId = newVersion._id;
    await piece.save();

    contentEvents.emit(contentEvents.EVENTS.VERSION_CREATED, { contentPieceId, versionId: newVersion._id });

    return newVersion;
  }

  /**
   * Restores to a previous version
   */
  async restoreVersion(contentPieceId, userId, targetVersionId) {
    const targetVersion = await ContentVersion.findById(targetVersionId);
    if (!targetVersion) throw new Error('Target version not found');

    // To preserve history, restoration creates a NEW version containing the old payload
    return this.createVersion(contentPieceId, userId, targetVersion.payload, 'restored');
  }
}

module.exports = new ContentVersioningService();
