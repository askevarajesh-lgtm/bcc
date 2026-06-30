
module.exports = {
  sendSuccess: (res, arg1, arg2, statusCode = 200) => {
    let message = 'Success';
    let data = null;
    if (typeof arg1 === 'string') {
      message = arg1;
      data = arg2;
    } else {
      data = arg1;
      message = typeof arg2 === 'string' ? arg2 : 'Success';
    }
    return res.status(statusCode).json({ success: true, message, data });
  },
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
  sendValidationError: (res, errors) => {
    return res.status(422).json({ success: false, message: 'Validation Error', errors });
  },
  sendPaginatedSuccess: (res, data, meta, message = 'Success') =>
    res.status(200).json({ success: true, message, data, meta }),
};
