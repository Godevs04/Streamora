const { sendErrorResponse } = require('../utils/sendResponse');

/**
 * Global error handler middleware
 * @param {object} err - Error object
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 * @returns {void}
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Server Error';
  let errors = [];

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    
    // Extract validation errors
    Object.values(err.errors).forEach((error) => {
      errors.push({
        field: error.path,
        message: error.message
      });
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 400;
    message = 'Duplicate field value entered';
    
    // Extract duplicate field
    const field = Object.keys(err.keyValue)[0];
    errors.push({
      field,
      message: `${field} already exists`
    });
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}`;
    
    errors.push({
      field: err.path,
      message: `Invalid ${err.path}: ${err.value}`
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Send error response
  sendErrorResponse(res, statusCode, message, errors);
};

module.exports = errorHandler;
