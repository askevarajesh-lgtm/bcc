const fs = require('fs');

const errorMiddleware = (err, req, res, next) => {
  console.error(err.stack);
  try {
    fs.appendFileSync('backend_error.log', new Date().toISOString() + '\\n' + err.stack + '\\n\\n');
  } catch(e) {}


  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `An account with that ${field} already exists.`;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map(val => val.message).join(', ');
  }

  res.status(statusCode).json({
    success: false,
    error: message,
  });
};

module.exports = errorMiddleware;
