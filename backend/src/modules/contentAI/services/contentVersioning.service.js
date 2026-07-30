const ContentVersion = require('../models/contentVersion.model');
const ContentPiece = require('../models/contentPiece.model');

async function createVersion({ contentPieceId, source, payload, qualityScore, createdBy, restoredFromVersionId = null }) {
  const lastVersion = await ContentVersion.findOne({ contentPieceId }).sort({ versionNumber: -1 }).lean();
  const versionNumber = lastVersion ? lastVersion.versionNumber + 1 : 1;

  const version = await ContentVersion.create({
    contentPieceId,
    versionNumber,
    createdBy: createdBy || null,
    source,
    payload,
    qualityScore: qualityScore || {},
    restoredFromVersionId
  });

  await ContentPiece.findByIdAndUpdate(contentPieceId, { currentVersionId: version._id });

  return version;
}

async function listVersions(contentPieceId) {
  return ContentVersion.find({ contentPieceId }).sort({ versionNumber: -1 }).lean();
}

async function getVersion(contentPieceId, versionId) {
  const version = await ContentVersion.findOne({ _id: versionId, contentPieceId }).lean();
  if (!version) throw new Error('Content version not found');
  return version;
}

/**
 * Restoring never rewrites history — it creates a NEW version whose payload
 * is copied from the target past version, and points `currentVersionId` at
 * it. `restoredFromVersionId` keeps the provenance visible in the version list.
 */
async function restoreVersion(contentPieceId, versionId, userId) {
  const target = await getVersion(contentPieceId, versionId);
  return createVersion({
    contentPieceId,
    source: 'restored',
    payload: target.payload,
    qualityScore: target.qualityScore,
    createdBy: userId,
    restoredFromVersionId: target._id
  });
}

module.exports = { createVersion, listVersions, getVersion, restoreVersion };
