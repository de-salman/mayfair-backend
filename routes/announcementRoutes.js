const express = require('express');
const router = express.Router();
const {
  getAnnouncements,
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
} = require('../controllers/announcementController');
const { requireAuth } = require('../middleware/rbac');

// All routes require authentication
router.use(requireAuth);

router.route('/')
  .get(getAnnouncements)
  .post(createAnnouncement);

router.route('/:id')
  .get(getAnnouncement)
  .put(updateAnnouncement)
  .delete(deleteAnnouncement);

module.exports = router;


