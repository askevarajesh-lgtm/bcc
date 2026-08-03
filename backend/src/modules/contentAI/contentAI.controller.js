const contentGenerationPipeline = require('./services/contentGenerationPipeline.service');
const ContentPiece = require('./models/contentPiece.model');
const ContentVersion = require('./models/contentVersion.model');
const BrandVoice = require('./models/brandVoice.model');
const ContentPromptTemplate = require('./models/contentPromptTemplate.model');
const contentEvents = require('./events/contentEvents');
const { GENERATORS } = require('./generators/registry');
const contentVersioningService = require('./services/contentVersioning.service');

/**
 * Standardized API Response
 */
const sendResponse = (res, statusCode, success, data = null, error = null) => {
  return res.status(statusCode).json({
    success,
    data,
    error
  });
};

exports.getGenerators = async (req, res) => {
  try {
    const generatorList = Object.values(GENERATORS).map(g => ({
       key: g.key,
       displayName: g.displayName,
       targetTypes: g.targetTypes,
       requiredInputFields: g.requiredInputFields
    }));
    return sendResponse(res, 200, true, generatorList);
  } catch (error) {
    console.error('[ContentAIController] Error fetching generators:', error);
    return sendResponse(res, 500, false, null, error.message);
  }
};

exports.getBrandVoices = async (req, res) => {
  try {
    const workspaceId = req.workspaceId || req.user?.workspaceId || req.query.workspaceId;
    const voices = await BrandVoice.find({ workspaceId, isDeleted: false }).lean();
    return sendResponse(res, 200, true, voices);
  } catch (error) {
    console.error('[ContentAIController] Error fetching brand voices:', error);
    return sendResponse(res, 500, false, null, error.message);
  }
};

exports.createBrandVoice = async (req, res) => {
  try {
    const workspaceId = req.workspaceId || req.user?.workspaceId || req.body?.workspaceId;
    const { name, isDefault, audience, tone, language, style } = req.body;
    
    if (!name) return sendResponse(res, 400, false, null, "Name is required");

    if (isDefault) {
      // Unset other defaults if this is set to default
      await BrandVoice.updateMany({ workspaceId }, { isDefault: false });
    }

    const newVoice = new BrandVoice({
      workspaceId,
      name,
      isDefault,
      audience,
      tone,
      language,
      style,
      createdBy: req.user?._id
    });
    
    await newVoice.save();
    return sendResponse(res, 201, true, newVoice);
  } catch (error) {
    console.error('[ContentAIController] Error creating brand voice:', error);
    return sendResponse(res, 500, false, null, error.message);
  }
};

exports.generateContent = async (req, res) => {
  try {
    // Assuming workspaceId and userId are injected by auth middleware
    const workspaceId = req.workspaceId || req.user?.workspaceId || req.body?.workspaceId;
    const userId = req.user?._id || req.body?.userId;
    const { targetType, inputs = {} } = req.body;
    const targetKeyword = req.body.targetKeyword || inputs.topic || inputs.keywords || inputs.productName;

    if (!targetKeyword) {
      return sendResponse(res, 400, false, null, "targetKeyword (or inputs.topic) is required");
    }

    // Execute the full pipeline
    const result = await contentGenerationPipeline.executePipeline(workspaceId, userId, targetKeyword, targetType);

    return sendResponse(res, 201, true, result);
  } catch (error) {
    console.error('[ContentAIController] Error generating content:', error);
    return sendResponse(res, 500, false, null, error.message);
  }
};

exports.getContentPieces = async (req, res) => {
  try {
    const workspaceId = req.workspaceId || req.user?.workspaceId || req.query.workspaceId;
    
    // Pagination & Filtering
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { workspaceId, isDeleted: false };
    if (req.query.status) query.status = req.query.status;

    const pieces = await ContentPiece.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('currentVersionId', 'versionNumber payload qualityScore')
      .lean();

    const formattedPieces = pieces.map(p => ({
      ...p,
      currentVersion: p.currentVersionId,
      currentVersionId: p.currentVersionId?._id || p.currentVersionId
    }));

    const total = await ContentPiece.countDocuments(query);

    return sendResponse(res, 200, true, formattedPieces);
  } catch (error) {
    console.error('[ContentAIController] Error fetching pieces:', error);
    return sendResponse(res, 500, false, null, error.message);
  }
};

exports.getPieceVersions = async (req, res) => {
  try {
    const { pieceId } = req.params;
    
    const versions = await ContentVersion.find({ contentPieceId: pieceId })
      .sort({ versionNumber: -1 })
      .lean();

    return sendResponse(res, 200, true, { versions });
  } catch (error) {
    console.error('[ContentAIController] Error fetching versions:', error);
    return sendResponse(res, 500, false, null, error.message);
  }
};

exports.updateBrandVoice = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    if (updateData.isDefault) {
      await BrandVoice.updateMany({ workspaceId: req.user?.workspaceId || req.body?.workspaceId }, { isDefault: false });
    }
    const updated = await BrandVoice.findByIdAndUpdate(id, updateData, { new: true });
    return sendResponse(res, 200, true, updated);
  } catch (error) {
    return sendResponse(res, 500, false, null, error.message);
  }
};

exports.deleteBrandVoice = async (req, res) => {
  try {
    const { id } = req.params;
    await BrandVoice.findByIdAndUpdate(id, { isDeleted: true });
    return sendResponse(res, 200, true, { success: true });
  } catch (error) {
    return sendResponse(res, 500, false, null, error.message);
  }
};

exports.getTemplates = async (req, res) => {
  try {
    const workspaceId = req.workspaceId || req.user?.workspaceId || req.query.workspaceId;
    const query = { workspaceId, isDeleted: false };
    if (req.query.generatorType) query.generatorType = req.query.generatorType;
    const templates = await ContentPromptTemplate.find(query).lean();
    return sendResponse(res, 200, true, templates);
  } catch (error) {
    return sendResponse(res, 500, false, null, error.message);
  }
};

exports.createTemplate = async (req, res) => {
  try {
    const workspaceId = req.workspaceId || req.user?.workspaceId || req.body?.workspaceId;
    const newTemplate = new ContentPromptTemplate({ ...req.body, workspaceId, createdBy: req.user?._id });
    await newTemplate.save();
    return sendResponse(res, 201, true, newTemplate);
  } catch (error) {
    return sendResponse(res, 500, false, null, error.message);
  }
};

exports.updateTemplate = async (req, res) => {
  try {
    const updated = await ContentPromptTemplate.findByIdAndUpdate(req.params.id, req.body, { new: true });
    return sendResponse(res, 200, true, updated);
  } catch (error) {
    return sendResponse(res, 500, false, null, error.message);
  }
};

exports.deleteTemplate = async (req, res) => {
  try {
    await ContentPromptTemplate.findByIdAndUpdate(req.params.id, { isDeleted: true });
    return sendResponse(res, 200, true, { success: true });
  } catch (error) {
    return sendResponse(res, 500, false, null, error.message);
  }
};

exports.getPieceById = async (req, res) => {
  try {
    const piece = await ContentPiece.findById(req.params.id).populate('currentVersionId').lean();
    if (!piece) return sendResponse(res, 404, false, null, 'Piece not found');
    
    piece.currentVersion = piece.currentVersionId;
    piece.currentVersionId = piece.currentVersion?._id || piece.currentVersionId;
    
    return sendResponse(res, 200, true, piece);
  } catch (error) {
    return sendResponse(res, 500, false, null, error.message);
  }
};

exports.regenerateContent = async (req, res) => {
  try {
    const { id } = req.params;
    const piece = await ContentPiece.findById(id);
    if (!piece) return sendResponse(res, 404, false, null, 'Piece not found');
    const result = await contentGenerationPipeline.executePipeline(piece.workspaceId, req.user?._id, piece.targetKeyword, piece.targetType, req.body.inputs);
    return sendResponse(res, 200, true, result);
  } catch (error) {
    return sendResponse(res, 500, false, null, error.message);
  }
};

exports.restoreVersion = async (req, res) => {
  try {
    const { id, versionId } = req.params;
    const newVersion = await contentVersioningService.restoreVersion(id, versionId, req.user?._id);
    return sendResponse(res, 200, true, newVersion);
  } catch (error) {
    return sendResponse(res, 500, false, null, error.message);
  }
};

exports.submitForReview = async (req, res) => {
  try {
    const updated = await ContentPiece.findByIdAndUpdate(req.params.id, { status: 'In Review' }, { new: true });
    return sendResponse(res, 200, true, updated);
  } catch (error) {
    return sendResponse(res, 500, false, null, error.message);
  }
};

exports.approveContent = async (req, res) => {
  try {
    const updated = await ContentPiece.findByIdAndUpdate(req.params.id, { status: 'Approved' }, { new: true });
    return sendResponse(res, 200, true, updated);
  } catch (error) {
    return sendResponse(res, 500, false, null, error.message);
  }
};

exports.rejectContent = async (req, res) => {
  try {
    const { reason } = req.body;
    const updated = await ContentPiece.findByIdAndUpdate(req.params.id, { status: 'Draft', rejectionReason: reason }, { new: true });
    return sendResponse(res, 200, true, updated);
  } catch (error) {
    return sendResponse(res, 500, false, null, error.message);
  }
};

exports.publishContent = async (req, res) => {
  try {
    const updated = await ContentPiece.findByIdAndUpdate(req.params.id, { status: 'Published' }, { new: true });
    return sendResponse(res, 200, true, updated);
  } catch (error) {
    return sendResponse(res, 500, false, null, error.message);
  }
};

exports.getQualityScore = async (req, res) => {
  try {
    const piece = await ContentPiece.findById(req.params.id).populate('currentVersionId');
    return sendResponse(res, 200, true, { qualityScore: piece?.currentVersionId?.qualityScore || 0 });
  } catch (error) {
    return sendResponse(res, 500, false, null, error.message);
  }
};

exports.getQualityReport = async (req, res) => {
  try {
    return sendResponse(res, 200, true, { report: 'WIP' });
  } catch (error) {
    return sendResponse(res, 500, false, null, error.message);
  }
};
