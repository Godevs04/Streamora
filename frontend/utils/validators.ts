/**
 * Validate email format
 * @param email - Email to validate
 * @returns Boolean indicating if email is valid
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * @param password - Password to validate
 * @returns Boolean indicating if password is valid
 */
export const isValidPassword = (password: string): boolean => {
  return password.length >= 6;
};

/**
 * Validate username format
 * @param username - Username to validate
 * @returns Boolean indicating if username is valid
 */
export const isValidUsername = (username: string): boolean => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};

/**
 * Get validation error message for email
 * @param email - Email to validate
 * @returns Error message or empty string if valid
 */
export const getEmailError = (email: string): string => {
  if (!email) return 'Email is required';
  if (!isValidEmail(email)) return 'Please enter a valid email address';
  return '';
};

/**
 * Get validation error message for password
 * @param password - Password to validate
 * @returns Error message or empty string if valid
 */
export const getPasswordError = (password: string): string => {
  if (!password) return 'Password is required';
  if (!isValidPassword(password)) return 'Password must be at least 6 characters';
  return '';
};

/**
 * Get validation error message for username
 * @param username - Username to validate
 * @returns Error message or empty string if valid
 */
export const getUsernameError = (username: string): string => {
  if (!username) return '';
  if (!isValidUsername(username)) return 'Username must be 3-20 characters and can only contain letters, numbers, and underscores';
  return '';
};

/**
 * Get validation error message for name
 * @param name - Name to validate
 * @returns Error message or empty string if valid
 */
export const getNameError = (name: string): string => {
  if (!name) return 'Name is required';
  if (name.length < 2) return 'Name must be at least 2 characters';
  return '';
};
