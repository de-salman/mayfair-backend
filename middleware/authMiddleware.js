const { verifyToken } = require('../utils/jwtHelper');
const User = require('../models/User');

// Middleware to verify JWT token
const authMiddleware = async (req, res, next) => {
  // Get token from header
  const token = req.header('Authorization')?.replace('Bearer ', '') || req.header('x-auth-token');

  // Check if no token
  if (!token) {
    return res.status(401).json({ 
      success: false,
      error: 'No token, authorization denied' 
    });
  }

  try {
    // Verify token
    const decoded = verifyToken(token);
    
    // Get full user data
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: 'User not found' 
      });
    }
    
    req.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      allowedModules: user.allowedModules
    };
    
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false,
      error: 'Token is not valid' 
    });
  }
};

// Middleware to check user role
const checkRole = (...requiredRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (requiredRoles.length === 0 || requiredRoles.includes(req.user.role)) {
      return next();
    }

    res.status(403).json({
      success: false,
      error: `Access denied. Required role: ${requiredRoles.join(' or ')}`
    });
  };
};

// Middleware to check module access
const checkModuleAccess = (moduleName) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Superadmin has access to all modules
    if (req.user.role === 'superadmin') {
      return next();
    }

    // Check if user has access to the module
    if (req.user.allowedModules && req.user.allowedModules.includes(moduleName)) {
      return next();
    }

    res.status(403).json({
      success: false,
      error: `Access denied. You do not have access to the ${moduleName} module`
    });
  };
};

module.exports = {
  authMiddleware,
  checkRole,
  checkModuleAccess
};

