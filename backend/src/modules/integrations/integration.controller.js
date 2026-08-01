const { validationResult } = require("express-validator");
const integrationService = require("./integration.service");
const EventConfig = require("./eventConfig.model");
const {
  sendSuccess,
  sendError,
  sendValidationError,
} = require("../../utils/response");

const getAllIntegrations = async (req, res) => {
  try {
    const integrations = await integrationService.getAllIntegrations(
      req.companyId,
      req.user.role,
    );
    return sendSuccess(res, "Integrations retrieved successfully", {
      integrations,
    });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const createIntegration = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendValidationError(res, errors.array());
    }
    const integration = await integrationService.createIntegration(
      req.body,
      req.companyId,
      req.user.role,
    );
    return sendSuccess(res, "Integration created successfully", {
      integration,
    });
  } catch (error) {
    return sendError(res, 400, error.stack || error.message);
  }
};

const updateIntegration = async (req, res) => {
  try {
    const integration = await integrationService.updateIntegration(
      req.params.id,
      req.body,
      req.companyId,
      req.user.role,
    );
    return sendSuccess(res, "Integration updated successfully", {
      integration,
    });
  } catch (error) {
    return sendError(res, 400, error.message);
  }
};

const sendMessage = async (req, res) => {
  try {
    const result = await integrationService.sendMessage(
      req.params.id,
      req.body,
      req.companyId,
    );
    return sendSuccess(res, result.message, {
      integrationType: result.integrationType,
      messageId: result.messageId,
    });
  } catch (error) {
    return sendError(res, 400, error.message);
  }
};

const fetchWhatsAppTemplates = async (req, res) => {
  try {
    const templates = await integrationService.fetchWhatsAppTemplates(
      req.params.id,
      req.companyId,
      req.user.role,
    );

    // If no templates were found but no error was thrown, return empty array with info message
    if (!templates || templates.length === 0) {
      return sendSuccess(
        res,
        "No templates found. Your backend may not have a templates API endpoint. You can configure templates manually.",
        { templates: [] },
      );
    }

    return sendSuccess(res, "WhatsApp templates fetched successfully", {
      templates,
    });
  } catch (error) {
    // Return the error message as-is so frontend can handle it appropriately
    return sendError(res, 400, error.message);
  }
};

const validateEktaApi = async (req, res) => {
  try {
    const integration = await integrationService.validateEktaApi(
      req.body,
      req.companyId,
      req.user.role,
    );
    return sendSuccess(res, "Ekta API validated successfully", { integration });
  } catch (error) {
    return sendError(res, 400, error.message);
  }
};

const syncEktaStaff = async (req, res) => {
  try {
    const result = await integrationService.syncEktaStaff(
      req.params.id,
      req.body,
      req.companyId,
      req.user.role,
    );
    return sendSuccess(res, "Ekta Staff sync started", result);
  } catch (error) {
    return sendError(res, 400, error.message);
  }
};

const syncEktaAttendance = async (req, res) => {
  try {
    const result = await integrationService.syncEktaAttendance(
      req.params.id,
      req.body,
      req.companyId,
      req.user.role,
    );
    return sendSuccess(res, "Ekta Attendance sync started", result);
  } catch (error) {
    return sendError(res, 400, error.message);
  }
};

const submitWebsiteLead = async (req, res) => {
  try {
    const { apiKey, ...leadData } = req.body;
    const lead = await integrationService.submitWebsiteLead(apiKey, leadData);
    return sendSuccess(res, "Lead submitted successfully", {
      leadId: lead._id,
    });
  } catch (error) {
    return sendError(res, 400, error.message);
  }
};

const fetchWhatsAppLeads = async (req, res) => {
  try {
    const result = await integrationService.fetchWhatsAppLeads(
      req.params.id,
      req.companyId,
      req.user.role,
    );
    return sendSuccess(res, result.message, result);
  } catch (error) {
    return sendError(res, 400, error.message);
  }
};

const syncAllWhatsAppLeads = async (req, res) => {
  try {
    await integrationService.syncAllWhatsAppLeads(req.companyId);
    return sendSuccess(res, "Sync started successfully", { success: true });
  } catch (error) {
    return sendError(res, 400, error.message);
  }
};

const getPaymentIntegration = async (req, res) => {
  try {
    const integration = await integrationService.getPaymentIntegration(req.params.companyId);
    return sendSuccess(res, "Payment integration retrieved successfully", { integration });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const getEventConfigs = async (req, res) => {
  try {
    const { id } = req.params;
    const configs = await EventConfig.find({ integrationId: id, companyId: req.companyId });
    return sendSuccess(res, "Event configurations retrieved", { configs });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const upsertEventConfig = async (req, res) => {
  try {
    const { id } = req.params;
    const { eventType, ...configData } = req.body;

    const query = { integrationId: id, eventType, companyId: req.companyId };
    const update = { ...configData, eventType };

    const config = await EventConfig.findOneAndUpdate(
      query,
      { $set: update },
      { new: true, upsert: true }
    );

    return sendSuccess(res, "Event configuration saved", { config });
  } catch (error) {
    return sendError(res, 400, error.message);
  }
};

module.exports = {
  getAllIntegrations,
  createIntegration,
  updateIntegration,
  sendMessage,
  fetchWhatsAppTemplates,
  validateEktaApi,
  syncEktaStaff,
  syncEktaAttendance,
  submitWebsiteLead,
  fetchWhatsAppLeads,
  syncAllWhatsAppLeads,
  getPaymentIntegration,
  getEventConfigs,
  upsertEventConfig,
};
