// backend/middlewares/rateLimiter.js
const rateLimit = require('express-rate-limit');
const MongoStore = require('rate-limit-mongo');
const logger = require('../utils/logger');

/**
 * Create rate limiter with MongoDB store for distributed scaling
 */
const createRateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // limit each IP to 100 requests per windowMs
    message = 'Too many requests from this IP, please try again later.',
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    ...customOptions
  } = options;

  return rateLimit({
    store: new MongoStore({
      uri: process.env.MONGODB_URI,
      collectionName: 'rate_limits',
      expireTimeMs: windowMs,
    }),
    windowMs,
    max,
    message: {
      success: false,
      error: {
        message,
        code: 'RATE_LIMIT_EXCEEDED'
      }
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skipSuccessfulRequests,
    skipFailedRequests,
    handler: (req, res) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        url: req.originalUrl,
        method: req.method,
        userAgent: req.get('User-Agent')
      });
      
      res.status(429).json({
        success: false,
        error: {
          message,
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.round(windowMs / 1000)
        }
      });
    },
    ...customOptions
  });
};

// Different rate limits for different endpoints
const rateLimiters = {
  // Strict rate limiting for auth endpoints
  auth: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per 15 minutes
    message: 'Too many authentication attempts, please try again in 15 minutes.',
    skipSuccessfulRequests: true
  }),

  // Moderate rate limiting for API endpoints
  api: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 minutes
    message: 'Too many API requests, please try again later.'
  }),

  // Strict rate limiting for file uploads
  upload: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // 50 uploads per hour
    message: 'Upload limit exceeded, please try again in an hour.'
  }),

  // Very strict for password reset
  passwordReset: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 attempts per hour
    message: 'Too many password reset attempts, please try again in an hour.'
  }),

  // Moderate for chat messages
  chat: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 messages per minute
    message: 'Too many messages, please slow down.'
  })
};

module.exports = rateLimiters;