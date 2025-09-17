const { validationResult } = require('express-validator');
const { sendErrorResponse } = require('../utils/sendResponse');

/**
 * Validate request using express-validator rules
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 * @returns {void}
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.param,
      message: error.msg
    }));
    
    return sendErrorResponse(
      res,
      400,
      'Validation Error',
      formattedErrors
    );
  }
  
  next();
};

module.exports = validate;
