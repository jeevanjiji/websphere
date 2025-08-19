// backend/middleware/auth.js
const jwt = require('jsonwebtoken');

/**
 * Authentication and Authorization Middleware
 * 
 * Usage Examples:
 *   auth()                    - Any authenticated user
 *   auth(['client'])          - Only clients
 *   auth(['admin'])           - Only admins  
 *   auth(['client', 'admin']) - Clients or admins
 *   auth(['freelancer'])      - Only freelancers
 */
const auth = (allowedRoles = []) => (req, res, next) => {
  try {
    // Check if authorization header exists
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: No token provided'
      });
    }

    // Extract token from header
    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Token missing'
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your_jwt_secret_key'
    );

    // Check if user has required role (if roles are specified)
    if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access denied. Required role: ${allowedRoles.join(' or ')}`
      });
    }

    // Attach user info to request object
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      iat: decoded.iat,
      exp: decoded.exp
    };

    // Continue to next middleware
    next();

  } catch (error) {
    console.error('Auth middleware error:', error);

    // Handle specific JWT errors
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired. Please login again.' 
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token. Please login again.' 
      });
    }

    if (error.name === 'NotBeforeError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token not active yet.' 
      });
    }

    // Generic error
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication failed' 
    });
  }
};

// Optional: Export individual role-specific middlewares for convenience
const requireAuth = auth();
const requireClient = auth(['client']);
const requireFreelancer = auth(['freelancer']);
const requireAdmin = auth(['admin']);
const requireClientOrAdmin = auth(['client', 'admin']);

module.exports = {
  auth,
  requireAuth,
  requireClient,
  requireFreelancer,
  requireAdmin,
  requireClientOrAdmin
};

// Default export is the main auth function
module.exports.default = auth;
