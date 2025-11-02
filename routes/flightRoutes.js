const express = require('express');
const router = express.Router();
const {
  getFlights,
  getFlight,
  createFlight,
  updateFlight,
  deleteFlight,
  uploadFlights,
  getTodayFlights,
  getFlightsSummary
} = require('../controllers/flightController');
const { requireAuth, requireModule } = require('../middleware/rbac');
const upload = require('../utils/multerConfig');

// All routes require authentication
router.use(requireAuth);

// Routes that require flightManagement module access
router.use(requireModule('flightManagement'));

// Today's flights - accessible to authenticated users with module access
router.get('/today', getTodayFlights);

// Flight summary endpoint (must come before /:id route)
router.get('/summary', getFlightsSummary);

router.route('/')
  .get(getFlights)
  .post(createFlight);

// CSV upload - requires flightManagement module (already protected above)
router.post('/upload', upload.single('file'), uploadFlights);

router.route('/:id')
  .get(getFlight)
  .put(updateFlight)
  .delete(deleteFlight);

module.exports = router;

