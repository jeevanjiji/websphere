// frontend/src/utils/validation.js

/**
 * Comprehensive validation utilities for frontend forms
 * Provides real-time validation with detailed error messages
 */

/**
 * Validation result structure
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - Whether the field is valid
 * @property {string} message - Error message if invalid, success message if valid
 * @property {string} type - 'error', 'warning', or 'success'
 */

/**
 * Validate full name with real-time feedback
 * @param {string} fullName - The full name to validate
 * @returns {ValidationResult}
 */
export const validateFullName = (fullName) => {
  if (!fullName || fullName.trim().length === 0) {
    return {
      isValid: false,
      message: 'Full name is required',
      type: 'error'
    };
  }

  const trimmedName = fullName.trim();
  
  if (trimmedName.length < 2) {
    return {
      isValid: false,
      message: 'Name must be at least 2 characters long',
      type: 'error'
    };
  }

  if (trimmedName.length > 100) {
    return {
      isValid: false,
      message: 'Name cannot exceed 100 characters',
      type: 'error'
    };
  }

  const nameParts = trimmedName.split(/\s+/);
  
  if (nameParts.length < 2) {
    return {
      isValid: false,
      message: 'Please enter your full name (first and last name)',
      type: 'error'
    };
  }

  // Check each part for proper format
  for (let i = 0; i < nameParts.length; i++) {
    const part = nameParts[i];
    
    if (part.length < 1) {
      return {
        isValid: false,
        message: 'Invalid name format',
        type: 'error'
      };
    }

    if (!/^[A-Z]/.test(part)) {
      return {
        isValid: false,
        message: 'Each part of your name must start with an uppercase letter (e.g., "John Smith")',
        type: 'error'
      };
    }

    if (!/^[A-Za-z'-]+$/.test(part)) {
      return {
        isValid: false,
        message: 'Name can only contain letters, hyphens, and apostrophes',
        type: 'error'
      };
    }
  }

  return {
    isValid: true,
    message: 'Valid full name',
    type: 'success'
  };
};

/**
 * Validate email with real-time feedback
 * @param {string} email - The email to validate
 * @returns {ValidationResult}
 */
export const validateEmail = (email) => {
  if (!email || email.trim().length === 0) {
    return {
      isValid: false,
      message: 'Email address is required',
      type: 'error'
    };
  }

  const trimmedEmail = email.trim().toLowerCase();
  
  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(trimmedEmail)) {
    return {
      isValid: false,
      message: 'Please enter a valid email address',
      type: 'error'
    };
  }

  if (trimmedEmail.length > 254) {
    return {
      isValid: false,
      message: 'Email address is too long',
      type: 'error'
    };
  }

  // Check for common email providers for better UX
  const commonProviders = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'];
  const domain = trimmedEmail.split('@')[1];
  
  if (commonProviders.includes(domain)) {
    return {
      isValid: true,
      message: 'Valid email address',
      type: 'success'
    };
  }

  return {
    isValid: true,
    message: 'Email format is valid',
    type: 'success'
  };
};

/**
 * Validate password with real-time strength feedback
 * @param {string} password - The password to validate
 * @returns {ValidationResult}
 */
export const validatePassword = (password) => {
  if (!password || password.length === 0) {
    return {
      isValid: false,
      message: 'Password is required',
      type: 'error'
    };
  }

  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };

  const passedChecks = Object.values(checks).filter(Boolean).length;

  if (password.length < 8) {
    return {
      isValid: false,
      message: 'Password must be at least 8 characters long',
      type: 'error'
    };
  }

  if (!checks.uppercase) {
    return {
      isValid: false,
      message: 'Password must contain at least one uppercase letter',
      type: 'error'
    };
  }

  if (!checks.lowercase) {
    return {
      isValid: false,
      message: 'Password must contain at least one lowercase letter',
      type: 'error'
    };
  }

  if (!checks.number) {
    return {
      isValid: false,
      message: 'Password must contain at least one number',
      type: 'error'
    };
  }

  if (password.length > 128) {
    return {
      isValid: false,
      message: 'Password cannot exceed 128 characters',
      type: 'error'
    };
  }

  // Password strength feedback
  if (passedChecks >= 4) {
    if (checks.special) {
      return {
        isValid: true,
        message: 'Very strong password',
        type: 'success'
      };
    }
    return {
      isValid: true,
      message: 'Strong password',
      type: 'success'
    };
  }

  return {
    isValid: true,
    message: 'Good password',
    type: 'success'
  };
};

/**
 * Validate password confirmation
 * @param {string} password - Original password
 * @param {string} confirmPassword - Confirmation password
 * @returns {ValidationResult}
 */
export const validatePasswordConfirmation = (password, confirmPassword) => {
  if (!confirmPassword || confirmPassword.length === 0) {
    return {
      isValid: false,
      message: 'Please confirm your password',
      type: 'error'
    };
  }

  if (password !== confirmPassword) {
    return {
      isValid: false,
      message: 'Passwords do not match',
      type: 'error'
    };
  }

  return {
    isValid: true,
    message: 'Passwords match',
    type: 'success'
  };
};

/**
 * Validate freelancer bio
 * @param {string} bio - The bio to validate
 * @returns {ValidationResult}
 */
export const validateBio = (bio) => {
  if (!bio || bio.trim().length === 0) {
    return {
      isValid: false,
      message: 'Bio is required for freelancer registration',
      type: 'error'
    };
  }

  const trimmedBio = bio.trim();
  const wordCount = trimmedBio.split(/\s+/).length;
  
  if (trimmedBio.length < 20) {
    return {
      isValid: false,
      message: `Bio must be at least 20 characters long (currently ${trimmedBio.length})`,
      type: 'error'
    };
  }

  if (trimmedBio.length > 2000) {
    return {
      isValid: false,
      message: 'Bio cannot exceed 2000 characters',
      type: 'error'
    };
  }

  if (wordCount < 10) {
    return {
      isValid: false,
      message: 'Bio should contain at least 10 words to describe your skills and experience',
      type: 'warning'
    };
  }

  if (trimmedBio.length >= 100 && wordCount >= 15) {
    return {
      isValid: true,
      message: 'Great bio! This will help clients understand your expertise',
      type: 'success'
    };
  }

  return {
    isValid: true,
    message: 'Bio looks good',
    type: 'success'
  };
};

/**
 * Get password strength indicator
 * @param {string} password - The password to analyze
 * @returns {Object} - Strength information
 */
export const getPasswordStrength = (password) => {
  if (!password) {
    return { strength: 0, label: 'No password', color: 'gray' };
  }

  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    longLength: password.length >= 12
  };

  const score = Object.values(checks).filter(Boolean).length;

  if (score <= 2) {
    return { strength: 1, label: 'Weak', color: 'red' };
  } else if (score <= 4) {
    return { strength: 2, label: 'Fair', color: 'yellow' };
  } else if (score <= 5) {
    return { strength: 3, label: 'Good', color: 'blue' };
  } else {
    return { strength: 4, label: 'Strong', color: 'green' };
  }
};

/**
 * Validate all registration fields at once
 * @param {Object} formData - Form data object
 * @param {string} userType - 'client' or 'freelancer'
 * @returns {Object} - Validation results for all fields
 */
export const validateRegistrationForm = (formData, userType = 'client') => {
  const results = {
    fullName: validateFullName(formData.fullName),
    email: validateEmail(formData.email),
    password: validatePassword(formData.password),
    confirmPassword: validatePasswordConfirmation(formData.password, formData.confirmPassword)
  };

  if (userType === 'freelancer' && formData.bio !== undefined) {
    results.bio = validateBio(formData.bio);
  }

  const isValid = Object.values(results).every(result => result.isValid);
  const errors = Object.entries(results)
    .filter(([_, result]) => !result.isValid)
    .map(([field, result]) => ({ field, message: result.message }));

  return {
    isValid,
    errors,
    results
  };
};
