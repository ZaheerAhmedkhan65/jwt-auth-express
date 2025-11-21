//src/middleware/validation.js
const { validationResult } = require('express-validator');

// Custom validation rules
const customValidators = {
  isStrongPassword: (value) => {
    if (!value) return false;
    
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return strongRegex.test(value);
  },

  isPhoneNumber: (value) => {
    if (!value) return true; // Optional field
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(value);
  },

  isAllowedDomain: (domains = []) => {
    return (value) => {
      if (!value) return false;
      const domain = value.split('@')[1];
      return domains.includes(domain);
    };
  },

  isFutureDate: (value) => {
    if (!value) return true;
    return new Date(value) > new Date();
  }
};

// Validation error formatter
const formatValidationErrors = (errors) => {
  return errors.array().map(error => ({
    field: error.path,
    message: error.msg,
    value: error.value
  }));
};

// Main validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = formatValidationErrors(errors);
    
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors
    });
  }
  
  next();
};

// Sanitization middleware
const sanitizeData = (req, res, next) => {
  // Sanitize request body
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
        
        // Remove potentially dangerous characters
        if (key !== 'password' && key !== 'token') {
          req.body[key] = req.body[key].replace(/[<>]/g, '');
        }
      }
    });
  }
  
  // Sanitize query parameters
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = req.query[key].trim().replace(/[<>]/g, '');
      }
    });
  }
  
  next();
};

// Rate limiting configuration validator
const validateRateLimitConfig = (config) => {
  const errors = [];
  
  if (!config || typeof config !== 'object') {
    return ['Rate limit configuration must be an object'];
  }
  
  if (config.windowMs && (typeof config.windowMs !== 'number' || config.windowMs <= 0)) {
    errors.push('windowMs must be a positive number');
  }
  
  if (config.max && (typeof config.max !== 'number' || config.max <= 0)) {
    errors.push('max must be a positive number');
  }
  
  return errors;
};

// JWT configuration validator
const validateJWTConfig = (config) => {
  const errors = [];
  
  if (!config) {
    return ['JWT configuration is required'];
  }
  
  if (!config.secret || typeof config.secret !== 'string') {
    errors.push('JWT secret is required and must be a string');
  }
  
  if (!config.refreshSecret || typeof config.refreshSecret !== 'string') {
    errors.push('JWT refresh secret is required and must be a string');
  }
  
  if (config.expiresIn && typeof config.expiresIn !== 'string') {
    errors.push('JWT expiresIn must be a string');
  }
  
  return errors;
};

// Email configuration validator
const validateEmailConfig = (config) => {
  const errors = [];
  
  if (!config) {
    return ['Email configuration is required'];
  }
  
  if (!config.service || typeof config.service !== 'string') {
    errors.push('Email service is required and must be a string');
  }
  
  if (!config.auth || typeof config.auth !== 'object') {
    errors.push('Email auth configuration is required');
  } else {
    if (!config.auth.user || typeof config.auth.user !== 'string') {
      errors.push('Email auth user is required');
    }
    if (!config.auth.pass || typeof config.auth.pass !== 'string') {
      errors.push('Email auth password is required');
    }
  }
  
  return errors;
};

// Common validation chains
const commonValidations = {
  email: () => [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address')
      .isLength({ max: 255 })
      .withMessage('Email must be less than 255 characters')
  ],

  password: (fieldName = 'password') => [
    body(fieldName)
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
      .isLength({ max: 128 })
      .withMessage('Password must be less than 128 characters')
      .matches(/[A-Za-z]/)
      .withMessage('Password must contain at least one letter')
      .matches(/\d/)
      .withMessage('Password must contain at least one number')
  ],

  name: (fieldName = 'name') => [
    body(fieldName)
      .trim()
      .isLength({ min: 2 })
      .withMessage('Name must be at least 2 characters long')
      .isLength({ max: 100 })
      .withMessage('Name must be less than 100 characters')
      .matches(/^[a-zA-Z\s\-']+$/)
      .withMessage('Name can only contain letters, spaces, hyphens, and apostrophes')
  ],

  token: (fieldName = 'token') => [
    body(fieldName)
      .notEmpty()
      .withMessage('Token is required')
      .isLength({ min: 10 })
      .withMessage('Token must be at least 10 characters long')
  ],

  userId: (fieldName = 'userId') => [
    body(fieldName)
      .notEmpty()
      .withMessage('User ID is required')
      .isMongoId()
      .withMessage('User ID must be a valid MongoDB ID')
  ]
};

module.exports = {
  validateRequest,
  sanitizeData,
  customValidators,
  validateRateLimitConfig,
  validateJWTConfig,
  validateEmailConfig,
  commonValidations
};