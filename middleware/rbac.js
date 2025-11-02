const { verifyToken } = require('../utils/jwtHelper');
const User = require('../models/User');

// @desc    Require authentication - verify JWT token and attach user
// @usage   requireAuth
const requireAuth = async (req, res, next) => {
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
    
    // Attach user to request
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

// @desc    Require specific role(s)
// @usage   requireRole('admin', 'superadmin') or requireRole('superadmin')
// @param   ...roles - One or more roles that are allowed
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Check if user's role is in the allowed roles
    if (roles.includes(req.user.role)) {
      return next();
    }

    res.status(403).json({
      success: false,
      error: `Access denied. Required role: ${roles.join(' or ')}`
    });
  };
};

// @desc    Require access to specific module
// @usage   requireModule('hrms') or requireModule('flightManagement')
// @param   moduleName - Name of the module to check access for
const requireModule = (moduleName) => {
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
  requireAuth,
  requireRole,
  requireModule
};

