const { sendError, sendSuccess } = require("../../utils/response");
const leadService = require("./lead.service");
const { uploadAnyFileToCloudinary } = require("../../utils/cloudinary");
const { validatePhoneNumber } = require("../../utils/phoneValidation");

const getLeads = async (req, res) => {
  try {
    const leads = await leadService.getLeads(
      req.companyId,
      req.user,
      req.query,
    );
    return sendSuccess(res, "Leads retrieved successfully", { leads });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const getAssignableBdeUsers = async (req, res) => {
  try {
    const users = await leadService.getAssignableBdeUsers(req.companyId);
    return sendSuccess(res, "Assignable BDE users retrieved successfully", {
      users,
    });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const createLead = async (req, res) => {
  try {
    const {
      fullName,
      companyName,
      phoneNumber,
      projectType,
      source,
      status,
      assignedTo,
    } = req.body;
    if (
      !String(fullName || "").trim() ||
      !String(companyName || "").trim() ||
      !String(phoneNumber || "").trim() ||
      !String(projectType || "").trim() ||
      !String(source || "").trim() ||
      !String(status || "").trim()
    ) {
      return sendError(
        res,
        400,
        "fullName, companyName, phoneNumber, projectType, source and status are required",
      );
    }

    const leadData = { ...req.body };
    if (req.user.role === "client") {
      leadData.clientId = req.user.clientId;
    }

    // Validate Phone Number
    if (leadData.phoneNumber) {
      const validation = validatePhoneNumber(leadData.phoneNumber, leadData.countryCode);
      if (!validation.isValid) {
        return sendError(res, 400, validation.message);
      }
    }

    const lead = await leadService.createLead(
      leadData,
      req.companyId,
      req.user._id,
      req.user,
    );
    return sendSuccess(res, "Lead added successfully", { lead });
  } catch (error) {
    return sendError(res, 400, error.message);
  }
};

const updateLead = async (req, res) => {
  try {
    const {
      fullName,
      companyName,
      phoneNumber,
      projectType,
      source,
      status,
      assignedTo,
    } = req.body;

    if (
      !String(fullName || "").trim() ||
      !String(companyName || "").trim() ||
      !String(phoneNumber || "").trim() ||
      !String(projectType || "").trim() ||
      !String(source || "").trim() ||
      !String(status || "").trim()
    ) {
      return sendError(
        res,
        400,
        "fullName, companyName, phoneNumber, projectType, source and status are required",
      );
    }

    const leadData = { ...req.body };
    if (req.user.role === "client") {
      leadData.clientId = req.user.clientId;
    }

    // Validate Phone Number
    if (leadData.phoneNumber) {
      let cCode = leadData.countryCode;
      if (!cCode) {
        const Lead = require('./lead.model');
        const existingLead = await Lead.findById(req.params.id).select('countryCode');
        cCode = existingLead?.countryCode;
      }
      const validation = validatePhoneNumber(leadData.phoneNumber, cCode);
      if (!validation.isValid) {
        return sendError(res, 400, validation.message);
      }
    }

    const lead = await leadService.updateLead(
      req.params.id,
      leadData,
      req.companyId,
      req.user,
    );
    return sendSuccess(res, "Lead updated successfully", { lead });
  } catch (error) {
    if (error.message === "Lead not found") {
      return sendError(res, 404, error.message);
    }
    return sendError(res, 400, error.message);
  }
};

const deleteLead = async (req, res) => {
  try {
    await leadService.deleteLead(req.params.id, req.companyId, req.user);
    return sendSuccess(res, "Lead deleted successfully");
  } catch (error) {
    if (error.message === "Lead not found") {
      return sendError(res, 404, error.message);
    }
    return sendError(res, 400, error.message);
  }
};

const getLeadNotes = async (req, res) => {
  try {
    const notes = await leadService.getLeadNotes(
      req.params.id,
      req.companyId,
      req.user,
    );
    return sendSuccess(res, "Lead notes retrieved successfully", { notes });
  } catch (error) {
    if (error.message === "Lead not found") {
      return sendError(res, 404, error.message);
    }
    return sendError(res, 400, error.message);
  }
};

const addLeadNote = async (req, res) => {
  try {
    const noteType = String(req.body.noteType || "text").toLowerCase();
    let fileUrl = "";
    let fileName = "";
    let mimeType = "";

    if (req.file?.buffer) {
      const folder = `lead-notes/${noteType}`;
      const publicId = `lead-note-${req.params.id}-${Date.now()}`;
      const uploadResult = await uploadAnyFileToCloudinary(
        req.file.buffer,
        folder,
        publicId,
      );
      fileUrl = uploadResult?.secure_url || "";
      fileName = req.file.originalname || "";
      mimeType = req.file.mimetype || "";
    }

    const note = await leadService.addLeadNote(
      req.params.id,
      req.companyId,
      req.user._id,
      {
        noteType,
        content: req.body.content,
        fileUrl,
        fileName,
        mimeType,
      },
      req.user,
    );
    return sendSuccess(res, "Lead note added successfully", { note });
  } catch (error) {
    if (error.message === "Lead not found") {
      return sendError(res, 404, error.message);
    }
    return sendError(res, 400, error.message);
  }
};

const deleteLeadNote = async (req, res) => {
  try {
    await leadService.deleteLeadNote(
      req.params.id,
      req.params.noteId,
      req.companyId,
      req.user,
    );
    return sendSuccess(res, "Lead note deleted successfully");
  } catch (error) {
    if (
      error.message === "Lead not found" ||
      error.message === "Lead note not found"
    ) {
      return sendError(res, 404, error.message);
    }
    return sendError(res, 400, error.message);
  }
};

const addLeadReminder = async (req, res) => {
  try {
    const reminder = await leadService.addLeadReminder(
      req.params.id,
      req.companyId,
      req.user,
      {
        description: req.body.description,
        remindAt: req.body.remindAt,
        remindTo: req.body.remindTo,
      }
    );
    return sendSuccess(res, "Reminder added successfully", { reminder });
  } catch (error) {
    if (error.message === "Lead not found") return sendError(res, 404, error.message);
    return sendError(res, 400, error.message);
  }
};

const exportLeadsCsv = async (req, res) => {
  try {
    const filter = req.query.filter === "reminder" ? "reminder" : "all";
    const idsParam = req.query.ids;
    const selectedIds =
      idsParam && String(idsParam).trim()
        ? String(idsParam)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];
    const { filename, csv } = await leadService.buildLeadsCsvExport(
      req.companyId,
      filter,
      selectedIds,
      req.user,
      req.query,
    );
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename.replace(/"/g, "")}"`,
    );
    return res.status(200).send(`\uFEFF${csv}`);
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const importLeadsCsv = async (req, res) => {
  try {
    if (!req.file?.buffer) {
      return sendError(
        res,
        400,
        'Upload a CSV file using the form field name "file".',
      );
    }
    const result = await leadService.importLeadsFromCsvBuffer(
      req.file.buffer,
      req.companyId,
      req.user._id,
      req.user,
    );
    return sendSuccess(res, "Import completed", result);
  } catch (error) {
    return sendError(res, 400, error.message);
  }
};

const bulkDeleteLeads = async (req, res) => {
  try {
    const { leadIds } = req.body;
    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return sendError(res, 400, "leadIds array is required");
    }
    const result = await leadService.bulkDeleteLeads(
      leadIds,
      req.companyId,
      req.user,
    );
    return sendSuccess(
      res,
      `${result.deletedCount} leads deleted successfully`,
    );
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

module.exports = {
  getLeads,
  getAssignableBdeUsers,
  createLead,
  updateLead,
  deleteLead,
  getLeadNotes,
  addLeadNote,
  deleteLeadNote,
  addLeadReminder,
  exportLeadsCsv,
  importLeadsCsv,
  bulkDeleteLeads,
};
