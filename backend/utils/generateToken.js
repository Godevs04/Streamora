const jwt = require('jsonwebtoken');

/**
 * Generate JWT token for user authentication
 * @param {string} userId - User ID to include in token payload
 * @param {object} additionalData - Additional data to include in token payload
 * @returns {string} JWT token
 */
const generateToken = (userId, additionalData = {}) => {
  const payload = {
    userId,
    ...additionalData
  };

  return jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

module.exports = generateToken;
