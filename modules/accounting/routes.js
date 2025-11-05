const express = require('express');
const router = express.Router();
const {
  getAccountingRecords,
  getAccountingRecord,
  createAccountingRecord,
  updateAccountingRecord,
  deleteAccountingRecord,
  getAccountingSummary,
  uploadAccountingRecords,
  // Flight Accounting
  getFlightAccountingRecords,
  getFlightAccountingRecord,
  getFlightAccountingByFlightId,
  createFlightAccountingRecord,
  updateFlightAccountingRecord,
  upsertFlightAccountingByFlightId,
  deleteFlightAccountingRecord
} = require('./controller');
const { requireAuth, requireRole } = require('../../middleware/rbac');
const upload = require('../../utils/multerConfig');

// Middleware to allow Superadmin or Ops Admin (admin with operations/flightManagement access)
const requireAccountingAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  // Superadmin has access
  if (req.user.role === 'superadmin') {
    return next();
  }

  // Admin with operations or flightManagement module access (Ops Admin)
  if (req.user.role === 'admin' && 
      req.user.allowedModules && 
      (req.user.allowedModules.includes('operations') || 
       req.user.allowedModules.includes('flightManagement'))) {
    return next();
  }

  // Admin with accounting module access (Finance Admin - optional for future)
  if (req.user.role === 'admin' && 
      req.user.allowedModules && 
      req.user.allowedModules.includes('accounting')) {
    return next();
  }

  res.status(403).json({
    success: false,
    error: 'Access denied. Required: Superadmin or Ops Admin (admin with operations/flightManagement access)'
  });
};

// All routes require authentication
router.use(requireAuth);

// Summary endpoint (must come before /:id route)
router.get('/summary', requireAccountingAccess, getAccountingSummary);

// Upload endpoint (must come before /:id route)
router.post('/upload', requireAccountingAccess, upload.single('file'), uploadAccountingRecords);

// ==================== FLIGHT ACCOUNTING ROUTES ====================
// All flight accounting routes must come before /:id route to avoid conflicts

// Get flight accounting by flightId (must come before /:id)
router.get('/flights/by-flight/:flightId', requireAccountingAccess, getFlightAccountingByFlightId);

// Upsert flight accounting by flightId (must come before /:id)
router.put('/flights/by-flight/:flightId', requireAccountingAccess, upsertFlightAccountingByFlightId);

// Flight accounting CRUD routes
router.route('/flights')
  .get(requireAccountingAccess, getFlightAccountingRecords)
  .post(requireAccountingAccess, createFlightAccountingRecord);

router.route('/flights/:id')
  .get(requireAccountingAccess, getFlightAccountingRecord)
  .put(requireAccountingAccess, updateFlightAccountingRecord)
  .delete(requireAccountingAccess, deleteFlightAccountingRecord);

// Main routes with accounting access control
router.route('/')
  .get(requireAccountingAccess, getAccountingRecords)
  .post(requireAccountingAccess, createAccountingRecord);

router.route('/:id')
  .get(requireAccountingAccess, getAccountingRecord)
  .put(requireAccountingAccess, updateAccountingRecord)
  .delete(requireAccountingAccess, deleteAccountingRecord);

module.exports = router;

