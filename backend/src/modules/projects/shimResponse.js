
module.exports = {
  sendSuccess: (res, message = 'Success', data = null, statusCode = 200) =>
    res.status(statusCode).json({ success: true, message, data }),
  sendError: (res, arg1 = 'Error', arg2 = 400) => {
    let message = 'Error';
    let statusCode = 400;
    if (typeof arg1 === 'number') {
      statusCode = arg1;
      message = String(arg2);
    } else {
      message = String(arg1);
      statusCode = typeof arg2 === 'number' ? arg2 : 400;
    }
    return res.status(statusCode).json({ success: false, error: message, message: message });
  },
  sendPaginatedSuccess: (res, data, meta, message = 'Success') =>
    res.status(200).json({ success: true, message, data, meta }),
};
