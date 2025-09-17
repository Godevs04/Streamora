/**
 * Send a success response
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {object|array} data - Response data
 * @param {object} meta - Metadata (pagination, etc.)
 * @returns {object} JSON response
 */
const sendSuccessResponse = (res, statusCode = 200, data = {}, meta = {}) => {
  return res.status(statusCode).json({
    success: true,
    data,
    meta
  });
};

/**
 * Send an error response
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {array} errors - Validation errors
 * @returns {object} JSON response
 */
const sendErrorResponse = (res, statusCode = 500, message = 'Server Error', errors = []) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors: errors.length > 0 ? errors : undefined
  });
};

module.exports = {
  sendSuccessResponse,
  sendErrorResponse
};
