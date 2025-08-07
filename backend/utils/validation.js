// backend/utils/validation.js

/**
 * Validation utilities for user registration and profile data
 */

/**
 * Validate full name format
 * @param {string} fullName - The full name to validate
 * @returns {Object} - Validation result with isValid and message
 */
function validateFullName(fullName) {
  if (!fullName || typeof fullName !== 'string') {
    return {
      isValid: false,
      message: 'Full name is required'
    };
  }

  const trimmedName = fullName.trim();
  
  // Check minimum length
  if (trimmedName.length < 2) {
    return {
      isValid: false,
      message: 'Full name must be at least 2 characters long'
    };
  }

  // Check maximum length
  if (trimmedName.length > 100) {
    return {
      isValid: false,
      message: 'Full name cannot exceed 100 characters'
    };
  }

  // Split into words
  const nameParts = trimmedName.split(/\s+/);
  
  // Must have at least 2 parts (first name and last name)
  if (nameParts.length < 2) {
    return {
      isValid: false,
      message: 'Please enter your full name (first and last name)'
    };
  }

  // Check each part
  for (let i = 0; i < nameParts.length; i++) {
    const part = nameParts[i];
    
    // Each part must be at least 1 character
    if (part.length < 1) {
      return {
        isValid: false,
        message: 'Invalid name format'
      };
    }

    // Each part must start with uppercase letter
    if (!/^[A-Z]/.test(part)) {
      return {
        isValid: false,
        message: 'Each part of your name must start with an uppercase letter (e.g., "John Smith")'
      };
    }

    // Each part should only contain letters, hyphens, and apostrophes
    if (!/^[A-Za-z'-]+$/.test(part)) {
      return {
        isValid: false,
        message: 'Name can only contain letters, hyphens, and apostrophes'
      };
    }
  }

  return {
    isValid: true,
    message: 'Valid full name'
  };
}

/**
 * Validate email format
 * @param {string} email - The email to validate
 * @returns {Object} - Validation result with isValid and message
 */
function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return {
      isValid: false,
      message: 'Email is required'
    };
  }

  const trimmedEmail = email.trim().toLowerCase();
  
  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(trimmedEmail)) {
    return {
      isValid: false,
      message: 'Please enter a valid email address'
    };
  }

  // Check length
  if (trimmedEmail.length > 254) {
    return {
      isValid: false,
      message: 'Email address is too long'
    };
  }

  return {
    isValid: true,
    message: 'Valid email'
  };
}

/**
 * Validate password strength
 * @param {string} password - The password to validate
 * @returns {Object} - Validation result with isValid and message
 */
function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      message: 'Password is required'
    };
  }

  // Minimum length
  if (password.length < 8) {
    return {
      isValid: false,
      message: 'Password must be at least 8 characters long'
    };
  }

  // Maximum length
  if (password.length > 128) {
    return {
      isValid: false,
      message: 'Password cannot exceed 128 characters'
    };
  }

  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one uppercase letter'
    };
  }

  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one lowercase letter'
    };
  }

  // Check for at least one number
  if (!/\d/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one number'
    };
  }

  return {
    isValid: true,
    message: 'Strong password'
  };
}

/**
 * Validate user role
 * @param {string} role - The role to validate
 * @returns {Object} - Validation result with isValid and message
 */
function validateRole(role) {
  const validRoles = ['client', 'freelancer'];
  
  if (!role || typeof role !== 'string') {
    return {
      isValid: false,
      message: 'Role is required'
    };
  }

  if (!validRoles.includes(role.toLowerCase())) {
    return {
      isValid: false,
      message: 'Invalid role. Must be either "client" or "freelancer"'
    };
  }

  return {
    isValid: true,
    message: 'Valid role'
  };
}

/**
 * Validate freelancer bio
 * @param {string} bio - The bio to validate
 * @returns {Object} - Validation result with isValid and message
 */
function validateBio(bio) {
  if (!bio || typeof bio !== 'string') {
    return {
      isValid: false,
      message: 'Bio is required'
    };
  }

  const trimmedBio = bio.trim();
  
  // Minimum length
  if (trimmedBio.length < 50) {
    return {
      isValid: false,
      message: 'Bio must be at least 50 characters long'
    };
  }

  // Maximum length
  if (trimmedBio.length > 2000) {
    return {
      isValid: false,
      message: 'Bio cannot exceed 2000 characters'
    };
  }

  return {
    isValid: true,
    message: 'Valid bio'
  };
}

/**
 * Validate complete registration data
 * @param {Object} data - Registration data
 * @returns {Object} - Validation result with isValid, errors array, and message
 */
function validateRegistrationData(data) {
  const errors = [];
  
  // Validate full name
  const nameValidation = validateFullName(data.fullName);
  if (!nameValidation.isValid) {
    errors.push({ field: 'fullName', message: nameValidation.message });
  }

  // Validate email
  const emailValidation = validateEmail(data.email);
  if (!emailValidation.isValid) {
    errors.push({ field: 'email', message: emailValidation.message });
  }

  // Validate password
  const passwordValidation = validatePassword(data.password);
  if (!passwordValidation.isValid) {
    errors.push({ field: 'password', message: passwordValidation.message });
  }

  // Validate role
  const roleValidation = validateRole(data.role);
  if (!roleValidation.isValid) {
    errors.push({ field: 'role', message: roleValidation.message });
  }

  // Validate bio for freelancers
  if (data.role === 'freelancer' && data.bio) {
    const bioValidation = validateBio(data.bio);
    if (!bioValidation.isValid) {
      errors.push({ field: 'bio', message: bioValidation.message });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    message: errors.length === 0 ? 'All validation passed' : `${errors.length} validation error(s) found`
  };
}

/**
 * Format name to proper case
 * @param {string} name - Name to format
 * @returns {string} - Properly formatted name
 */
function formatName(name) {
  if (!name || typeof name !== 'string') {
    return '';
  }

  return name.trim()
    .split(/\s+/)
    .map(part => {
      if (part.length === 0) return '';
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join(' ');
}

module.exports = {
  validateFullName,
  validateEmail,
  validatePassword,
  validateRole,
  validateBio,
  validateRegistrationData,
  formatName
};
