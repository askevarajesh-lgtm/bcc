const ContentPiece = require('./models/contentPiece.model');
const ContentQualityScore = require('./models/contentQualityScore.model');

const contentGeneration = require('./services/contentGeneration.service');
const brandVoiceService = require('./services/brandVoice.service');
const contentTemplateService = require('./services/contentTemplate.service');
const contentVersioning = require('./services/contentVersioning.service');
const contentApprovalGate = require('./services/contentApprovalGate.service');
const publishBridge = require('./services/publishBridge');
const { GENERATORS, GENERATOR_KEYS } = require('./generators/registry');

// Same helper as seoWorkspace.controller.js#getWorkspaceId — duplicated
// deliberately, matching that file's own pattern, since it isn't exported
// from any shared location today.
const getWorkspaceId = (req) => {
  const user = req.user;
  if (!user) return req.companyId || req.workspaceId;
  const clientRoles = ['agency_client', 'brand_super_admin', 'brand_manager', 'brand_team_user', 'client'];
  if (clientRoles.includes(user.role)) {
    return user.brandId || user._id;
  }
  return user.agencyId || user._id;
};

const handle = (res, promise) => promise
  .then((data) => res.status(200).json({ success: true, data }))
  .catch((error) => res.status(400).json({ success: false, error: error.message }));

// --- Generator registry (read-only, for the frontend's Generate tab) ---
exports.listGenerators = (req, res) => {
  const generators = GENERATOR_KEYS.map((key) => ({
    key,
    displayName: GENERATORS[key].displayName,
    targetTypes: GENERATORS[key].targetTypes,
    requiredInputFields: GENERATORS[key].requiredInputFields,
    qualityAxes: GENERATORS[key].qualityAxes
  }));
  res.status(200).json({ success: true, data: generators });
};

// --- Brand Voice ---
exports.listBrandVoices = (req, res) => handle(res, brandVoiceService.list(getWorkspaceId(req)));
exports.createBrandVoice = (req, res) => handle(res, brandVoiceService.create(getWorkspaceId(req), req.body, req.user?._id));
exports.updateBrandVoice = (req, res) => handle(res, brandVoiceService.update(getWorkspaceId(req), req.params.id, req.body, req.user?._id));
exports.deleteBrandVoice = (req, res) => handle(res, brandVoiceService.remove(getWorkspaceId(req), req.params.id));

// --- Content Prompt Templates ---
exports.listTemplates = (req, res) => handle(res, contentTemplateService.list(getWorkspaceId(req), req.query.generatorType));
exports.createTemplate = (req, res) => handle(res, contentTemplateService.create(getWorkspaceId(req), req.body, req.user?._id));
exports.updateTemplate = (req, res) => handle(res, contentTemplateService.update(getWorkspaceId(req), req.params.id, req.body));
exports.deleteTemplate = (req, res) => handle(res, contentTemplateService.remove(getWorkspaceId(req), req.params.id));

// --- Content Pieces / Generation ---
exports.generateContent = (req, res) => handle(res, contentGeneration.generate({
  workspaceId: getWorkspaceId(req),
  userId: req.user?._id,
  agencyIdForMemory: req.user?.agencyId || req.user?._id,
  generatorType: req.body.generatorType,
  targetType: req.body.targetType,
  targetId: req.body.targetId || null,
  inputs: req.body.inputs || {},
  brandVoiceId: req.body.brandVoiceId || null,
  promptTemplateId: req.body.promptTemplateId || null
}));

exports.regenerateContent = (req, res) => handle(res, contentGeneration.regenerate({
  workspaceId: getWorkspaceId(req),
  userId: req.user?._id,
  agencyIdForMemory: req.user?.agencyId || req.user?._id,
  contentPieceId: req.params.id,
  generatorType: req.body.generatorType || null,
  inputs: req.body.inputs || null,
  brandVoiceId: req.body.brandVoiceId || null,
  promptTemplateId: req.body.promptTemplateId || null
}));

exports.listContentPieces = async (req, res) => {
  try {
    const workspaceId = getWorkspaceId(req);
    const query = { workspaceId, isDeleted: false };
    if (req.query.status) query.status = req.query.status;
    if (req.query.generatorType) query.generatorType = req.query.generatorType;
    if (req.query.targetType) query.targetType = req.query.targetType;

    const pieces = await ContentPiece.find(query).sort({ updatedAt: -1 }).limit(200).lean();
    res.status(200).json({ success: true, data: pieces });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getContentPiece = async (req, res) => {
  try {
    const workspaceId = getWorkspaceId(req);
    const piece = await ContentPiece.findOne({ _id: req.params.id, workspaceId, isDeleted: false }).lean();
    if (!piece) return res.status(404).json({ success: false, error: 'Content piece not found' });

    const currentVersion = piece.currentVersionId
      ? await contentVersioning.getVersion(piece._id, piece.currentVersionId)
      : null;

    res.status(200).json({ success: true, data: { ...piece, currentVersion } });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.listVersions = (req, res) => handle(res, contentVersioning.listVersions(req.params.id));

exports.restoreVersion = (req, res) => handle(res, contentVersioning.restoreVersion(req.params.id, req.params.versionId, req.user?._id));

// --- Workflow: Draft -> In Review -> Approved -> Published ---
exports.submitForReview = (req, res) => handle(res, contentApprovalGate.submitForReview(getWorkspaceId(req), req.params.id, req.user?._id));
exports.approveContent = (req, res) => handle(res, contentApprovalGate.approve(getWorkspaceId(req), req.params.id, req.user?._id));
exports.rejectContent = (req, res) => handle(res, contentApprovalGate.reject(getWorkspaceId(req), req.params.id, req.user?._id, req.body.reason));

exports.publishContent = async (req, res) => {
  try {
    const workspaceId = getWorkspaceId(req);
    const piece = await contentApprovalGate.markPublished(workspaceId, req.params.id);
    const version = await contentVersioning.getVersion(piece._id, piece.currentVersionId);
    const published = await publishBridge.publish(piece, version);
    res.status(200).json({ success: true, data: { contentPiece: piece, published } });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// --- Quality ---
exports.getQualityScore = async (req, res) => {
  try {
    const score = await ContentQualityScore.findOne({ contentPieceId: req.params.id }).sort({ createdAt: -1 }).lean();
    res.status(200).json({ success: true, data: score });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getQualityReport = async (req, res) => {
  try {
    const workspaceId = getWorkspaceId(req);
    const query = { workspaceId };
    if (req.query.axis && req.query.below) {
      query[`${req.query.axis}.score`] = { $lt: Number(req.query.below) };
    }
    const scores = await ContentQualityScore.find(query).sort({ createdAt: -1 }).limit(200).lean();
    res.status(200).json({ success: true, data: scores });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
