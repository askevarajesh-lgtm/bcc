const { validationResult } = require('express-validator');
const meetingService = require('./meeting.service');
const { sendSuccess, sendError, sendValidationError } = require('../tasks/shimResponse');

const createMeeting = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendValidationError(res, errors.array());
    }

    const meeting = await meetingService.createMeeting(req.body, req.companyId, req.user._id);
    return sendSuccess(res, 'Meeting created successfully', { meeting });
  } catch (error) {
    return sendError(res, 400, error.message);
  }
};

const getAllMeetings = async (req, res) => {
  try {
    const result = await meetingService.getAllMeetings(
      req.companyId,
      req.query,
      req.user?.role,
      req.user?._id
    );
    return sendSuccess(res, 'Meetings retrieved successfully', result);
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const getMeetingById = async (req, res) => {
  try {
    const result = await meetingService.getMeetingById(
      req.params.id,
      req.companyId,
      req.user?.role,
      req.user?._id
    );
    return sendSuccess(res, 'Meeting retrieved successfully', result);
  } catch (error) {
    return sendError(res, 404, error.message);
  }
};

const updateMeeting = async (req, res) => {
  try {
    const result = await meetingService.updateMeeting(
      req.params.id,
      req.body,
      req.companyId,
      req.user?._id
    );
    return sendSuccess(res, 'Meeting updated successfully', result);
  } catch (error) {
    return sendError(res, 400, error.message);
  }
};

const deleteMeeting = async (req, res) => {
  try {
    await meetingService.deleteMeeting(req.params.id, req.companyId);
    return sendSuccess(res, 'Meeting deleted successfully');
  } catch (error) {
    return sendError(res, 400, error.message);
  }
};

const updateMeetingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return sendError(res, 400, 'Status is required');
    }
    const meeting = await meetingService.updateMeetingStatus(
      req.params.id,
      status,
      req.companyId,
      req.user?._id
    );
    return sendSuccess(res, 'Meeting status updated successfully', { meeting });
  } catch (error) {
    return sendError(res, 400, error.message);
  }
};

const addMeetingNote = async (req, res) => {
  try {
    const note = await meetingService.addMeetingNote(
      req.params.id,
      req.body,
      req.companyId,
      req.user?._id
    );
    return sendSuccess(res, 'Note added successfully', { note });
  } catch (error) {
    return sendError(res, 400, error.message);
  }
};

const addMeetingAttachment = async (req, res) => {
  try {
    const attachment = await meetingService.addMeetingAttachment(
      req.params.id,
      req.body,
      req.companyId,
      req.user?._id
    );
    return sendSuccess(res, 'Attachment added successfully', { attachment });
  } catch (error) {
    return sendError(res, 400, error.message);
  }
};

const createFollowUp = async (req, res) => {
  try {
    const followUp = await meetingService.createFollowUp(
      req.params.id,
      req.body,
      req.companyId,
      req.user?._id
    );
    return sendSuccess(res, 'Follow-up created successfully', { followUp });
  } catch (error) {
    return sendError(res, 400, error.message);
  }
};

const getMeetingAnalytics = async (req, res) => {
  try {
    const analytics = await meetingService.getMeetingAnalytics(
      req.companyId,
      req.user?.role,
      req.user?._id
    );
    return sendSuccess(res, 'Analytics retrieved successfully', { analytics });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

module.exports = {
  createMeeting,
  getAllMeetings,
  getMeetingById,
  updateMeeting,
  deleteMeeting,
  updateMeetingStatus,
  addMeetingNote,
  addMeetingAttachment,
  createFollowUp,
  getMeetingAnalytics
};
