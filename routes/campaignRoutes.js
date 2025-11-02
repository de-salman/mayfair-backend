const express = require('express');
const router = express.Router();
const {
  getCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign
} = require('../controllers/campaignController');
const { requireAuth, requireModule } = require('../middleware/rbac');

// All routes require authentication and campaign module access
router.use(requireAuth);
router.use(requireModule('campaigns'));

router.route('/')
  .get(getCampaigns)
  .post(createCampaign);

router.route('/:id')
  .get(getCampaign)
  .put(updateCampaign)
  .delete(deleteCampaign);

module.exports = router;

