const fs = require('fs');

const errorMiddleware = (err, req, res, next) => {
  console.error(err.stack);
  try {
    fs.appendFileSync('backend_error.log', new Date().toISOString() + '\\n' + err.stack + '\\n\\n');
  } catch(e) {}


  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: message,
  });
};

module.exports = errorMiddleware;
