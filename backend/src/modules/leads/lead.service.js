const mongoose = require("mongoose");
const Lead = require("./lead.model");
const User = require("../auth/user.model");
const {
  parseCsv,
  leadsToCsv,
  buildHeaderIndexMap,
  cellAt,
  normalizeStatus,
} = require("./leadCsv.util");

const buildLeadAccessFilter = (companyId, currentUser) => {
  const baseFilter = { companyId };
  if (!currentUser) return baseFilter;

  const userRole = String(currentUser.role || "").toLowerCase();
  if (userRole === "admin" || userRole === "super_admin") {
    // Default: Admin sees leads NOT created by clients (prospecting leads)
    return { ...baseFilter, isClientLead: { $ne: true } };
  }

  if (userRole === "client") {
    // Client sees only leads belonging to their client company
    return {
      ...baseFilter,
      isClientLead: true,
      clientId: currentUser.clientId,
    };
  }

  if (userRole === "bde") {
    const userName = String(currentUser.name || "").trim();
    // BDEs see assigned leads that are NOT created by clients
    return {
      ...baseFilter,
      isClientLead: { $ne: true },
      $or: [{ assignedTo: userName }],
    };
  }

  return baseFilter;
};

const getLeads = async (companyId, currentUser, query = {}) => {

  const accessFilter = buildLeadAccessFilter(companyId, currentUser);
  if (query.companyId) {
    // If a client is selected, remove the isClientLead restriction to see their leads
    delete accessFilter.isClientLead;
    accessFilter.clientId = query.companyId;
  }
  console.log("getLeads accessFilter:", JSON.stringify(accessFilter), "for user:", currentUser.role, currentUser.name);
  return Lead.find(accessFilter).sort({ createdAt: -1 }).lean();
};

/** Active BDE users in the tenant company (for lead assignment dropdown). */
const getAssignableBdeUsers = async (companyId) => {
  if (!companyId) return [];
  return User.find({ companyId, role: "bde", isActive: true })
    .select("name _id")
    .sort({ name: 1 })
    .lean();
};

const createLead = async (leadData, companyId, userId, currentUser) => {
  const {
    fullName,
    companyName,
    phoneNumber,
    email,
    projectType,
    source,
    status,
    assignedTo,
    notes,
    customData,
  } = leadData;

  const defaultAssignee =
    String(currentUser?.role || "").toLowerCase() === "bde"
      ? String(currentUser?.name || "").trim()
      : "";
  const assignedToValue = String(assignedTo || "").trim() || defaultAssignee;

  const userRole = String(currentUser?.role || "").toLowerCase();
  const isClientLead = leadData.isClientLead || userRole === "client";

  const lead = await Lead.create({
    companyId,
    clientId: leadData.clientId || null,
    createdBy: userId,
    isClientLead,
    fullName: String(fullName || "").trim(),
    companyName: String(companyName || "").trim(),
    phoneNumber: String(phoneNumber || "").trim(),
    email: String(email || "").trim(),
    projectType: String(projectType || "").trim(),
    source: String(source || "").trim(),
    status: status || "new",
    assignedTo: assignedToValue,
    notes: String(notes || "").trim(),
    customData: customData || {},
    activityLogs: [{ message: "Lead created" }],
  });

  return lead;
};

const updateLead = async (leadId, updateData, companyId, currentUser) => {
  const lead = await Lead.findOne({
    _id: leadId,
    ...buildLeadAccessFilter(companyId, currentUser),
  });

  if (!lead) {
    throw new Error("Lead not found");
  }

  const {
    fullName,
    companyName,
    phoneNumber,
    email,
    projectType,
    source,
    status,
    assignedTo,
    notes,
  } = updateData;

  lead.fullName = String(fullName || "").trim();
  lead.companyName = String(companyName || "").trim();
  lead.phoneNumber = String(phoneNumber || "").trim();
  lead.email = String(email || "").trim();
  lead.projectType = String(projectType || "").trim();
  lead.source = String(source || "").trim();
  lead.status = status || lead.status;
  const defaultAssignee =
    String(currentUser?.role || "").toLowerCase() === "bde"
      ? String(currentUser?.name || "").trim()
      : "";
  lead.assignedTo = String(assignedTo || "").trim() || defaultAssignee;
  lead.notes = String(notes || "").trim();
  lead.lastInteractionAt = new Date();

  lead.activityLogs = [
    {
      message: "Lead updated",
      createdAt: new Date(),
    },
    ...(lead.activityLogs || []),
  ];

  await lead.save();
  return lead;
};

const deleteLead = async (leadId, companyId, currentUser) => {
  const lead = await Lead.findOneAndDelete({
    _id: leadId,
    ...buildLeadAccessFilter(companyId, currentUser),
  });
  if (!lead) {
    throw new Error("Lead not found");
  }
  return lead;
};

const getLeadNotes = async (leadId, companyId, currentUser) => {
  const lead = await Lead.findOne({
    _id: leadId,
    ...buildLeadAccessFilter(companyId, currentUser),
  })
    .populate("leadNotes.createdBy", "name email")
    .lean();
  if (!lead) {
    throw new Error("Lead not found");
  }
  const notes = (lead.leadNotes || []).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );
  return notes;
};

const addLeadNote = async (
  leadId,
  companyId,
  userId,
  noteData,
  currentUser,
) => {
  const lead = await Lead.findOne({
    _id: leadId,
    ...buildLeadAccessFilter(companyId, currentUser),
  });
  if (!lead) {
    throw new Error("Lead not found");
  }

  const noteType = String(noteData.noteType || "text").toLowerCase();
  const content = String(noteData.content || "").trim();
  const fileUrl = String(noteData.fileUrl || "").trim();
  const fileName = String(noteData.fileName || "").trim();
  const mimeType = String(noteData.mimeType || "").trim();

  if (noteType === "text" && !content) {
    throw new Error("Text note content is required");
  }
  if (noteType !== "text" && !fileUrl) {
    throw new Error("A file is required for this note type");
  }

  lead.leadNotes = [
    {
      noteType,
      content,
      fileUrl,
      fileName,
      mimeType,
      createdBy: userId,
      createdAt: new Date(),
    },
    ...(lead.leadNotes || []),
  ];
  lead.activityLogs = [
    {
      message: `Lead note added (${noteType})`,
      createdAt: new Date(),
    },
    ...(lead.activityLogs || []),
  ];
  lead.lastInteractionAt = new Date();
  await lead.save();

  const updatedLead = await Lead.findById(lead._id)
    .populate("leadNotes.createdBy", "name email")
    .lean();
  return updatedLead?.leadNotes?.[0] || null;
};

const deleteLeadNote = async (leadId, noteId, companyId, currentUser) => {
  const lead = await Lead.findOne({
    _id: leadId,
    ...buildLeadAccessFilter(companyId, currentUser),
  });
  if (!lead) {
    throw new Error("Lead not found");
  }

  const beforeCount = (lead.leadNotes || []).length;
  lead.leadNotes = (lead.leadNotes || []).filter(
    (note) => String(note._id) !== String(noteId),
  );

  if (lead.leadNotes.length === beforeCount) {
    throw new Error("Lead note not found");
  }

  lead.activityLogs = [
    {
      message: "Lead note deleted",
      createdAt: new Date(),
    },
    ...(lead.activityLogs || []),
  ];
  lead.lastInteractionAt = new Date();
  await lead.save();
  return true;
};

const getLeadsForExport = async (
  companyId,
  filter,
  currentUser,
  query = {},
) => {

  const accessFilter = buildLeadAccessFilter(companyId, currentUser);
  if (query.companyId) {
    // If a client is selected, remove the isClientLead restriction to see their leads
    delete accessFilter.isClientLead;
    accessFilter.clientId = query.companyId;
  }
  const leads = await Lead.find(accessFilter).sort({ createdAt: -1 }).lean();
  if (filter === "reminder") {
    return leads.filter((l) => (l.reminders || []).length > 0);
  }
  return leads;
};

const addLeadReminder = async (leadId, companyId, currentUser, payload) => {
  const lead = await Lead.findOne({ _id: leadId, companyId });
  if (!lead) throw new Error("Lead not found");

  lead.reminders.push(payload);
  lead.activityLogs.push({
    actionType: "reminder_added",
    performedBy: currentUser._id,
    details: { description: payload.description, remindAt: payload.remindAt, remindTo: payload.remindTo },
  });
  await lead.save();
  return lead.reminders[lead.reminders.length - 1];
};

const buildLeadsCsvExport = async (
  companyId,
  filter,
  selectedIds = [],
  currentUser,
  query = {},
) => {
  let leads;
  let filename;

  if (selectedIds && selectedIds.length) {
    const objectIds = [...new Set(selectedIds)]
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));
    if (!objectIds.length) {
      throw new Error("No valid lead ids provided for export");
    }
    const accessFilter = buildLeadAccessFilter(companyId, currentUser);
    if (query.companyId) {
      // If a client is selected, remove the isClientLead restriction to see their leads
      delete accessFilter.isClientLead;
      accessFilter.clientId = query.companyId;
    }
    leads = await Lead.find({
      ...accessFilter,
      _id: { $in: objectIds },
    }).lean();
    if (!leads.length) {
      throw new Error("No matching leads to export for the selected ids");
    }
    const orderIndex = new Map(objectIds.map((id, i) => [String(id), i]));
    leads.sort(
      (a, b) =>
        (orderIndex.get(String(a._id)) ?? 0) -
        (orderIndex.get(String(b._id)) ?? 0),
    );
    filename = `leads-export-selected-${new Date().toISOString().slice(0, 10)}.csv`;
  } else {
    leads = await getLeadsForExport(companyId, filter, currentUser, query);
    const safeFilter = filter === "reminder" ? "reminder" : "all";
    filename = `leads-export-${safeFilter}-${new Date().toISOString().slice(0, 10)}.csv`;
  }

  const csv = leadsToCsv(leads);
  return { filename, csv };
};

const bulkDeleteLeads = async (leadIds, companyId, currentUser) => {
  if (!Array.isArray(leadIds) || leadIds.length === 0) {
    throw new Error("No lead IDs provided");
  }

  const objectIds = leadIds
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  if (objectIds.length === 0) {
    throw new Error("No valid lead IDs provided");
  }

  const accessFilter = buildLeadAccessFilter(companyId, currentUser);

  const result = await Lead.deleteMany({
    _id: { $in: objectIds },
    ...accessFilter,
  });

  return { deletedCount: result.deletedCount };
};

const importLeadsFromCsvBuffer = async (buffer, companyId, userId) => {
  const text = buffer.toString("utf8");
  const rows = parseCsv(text);
  if (!rows.length) {
    throw new Error("CSV file is empty");
  }
  const headerMap = buildHeaderIndexMap(rows[0]);
  const requiredCols = [
    "fullName",
    "companyName",
    "phoneNumber",
    "projectType",
    "assignedTo",
  ];
  const missing = requiredCols.filter((k) => headerMap[k] === undefined);
  if (missing.length) {
    throw new Error(
      `Missing required column(s): ${missing.join(", ")}. Expected headers like Name, Company Name, Phone Number, Project Type, Assigned To (Lead Source column is optional; imports use source "Import"). Optional: Email, Status, Notes.`,
    );
  }

  const created = [];
  const failed = [];
  const dataRows = rows.slice(1);

  for (let i = 0; i < dataRows.length; i += 1) {
    const row = dataRows[i];
    const rowNum = i + 2;
    if (!row || !row.some((c) => String(c || "").trim())) {
      continue;
    }

    const fullName = cellAt(row, headerMap, "fullName", true);
    const companyName = cellAt(row, headerMap, "companyName", true);
    const phoneNumber = cellAt(row, headerMap, "phoneNumber", true);
    const email = cellAt(row, headerMap, "email", false) || "";
    const projectType = cellAt(row, headerMap, "projectType", true);
    const assignedTo = cellAt(row, headerMap, "assignedTo", true);
    const notes = cellAt(row, headerMap, "notes", false) || "";
    const statusRaw = cellAt(row, headerMap, "status", false);
    const status = normalizeStatus(statusRaw) || "new";

    if (
      !fullName ||
      !companyName ||
      !phoneNumber ||
      !projectType ||
      !assignedTo
    ) {
      failed.push({
        row: rowNum,
        message:
          "Missing required value (name, company, phone, project type, and assigned to are required)",
      });
      continue;
    }

    try {
      const lead = await createLead(
        {
          fullName,
          companyName,
          phoneNumber,
          email,
          projectType,
          source: "Import",
          status,
          assignedTo,
          notes,
        },
        companyId,
        userId,
      );
      created.push(lead._id.toString());
    } catch (err) {
      failed.push({
        row: rowNum,
        message: err.message || "Failed to create lead",
      });
    }
  }

  return {
    createdCount: created.length,
    failedCount: failed.length,
    failed,
  };
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
  buildLeadsCsvExport,
  importLeadsFromCsvBuffer,
  bulkDeleteLeads,
};
