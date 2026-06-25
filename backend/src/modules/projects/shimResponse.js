
module.exports = {
  sendSuccess: (res, data, message = 'Success', statusCode = 200) =>
    res.status(statusCode).json({ success: true, message, data }),
  sendError: (res, message = 'Error', statusCode = 400) =>
    res.status(statusCode).json({ success: false, message }),
  sendPaginatedSuccess: (res, data, meta, message = 'Success') =>
    res.status(200).json({ success: true, message, data, meta }),
};
