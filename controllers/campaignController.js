const Campaign = require('../models/Campaign');

// @desc    Get all campaigns
// @route   GET /api/campaigns
// @access  Private
const getCampaigns = async (req, res) => {
  const campaigns = await Campaign.find();
  res.status(200).json({
    success: true,
    count: campaigns.length,
    data: campaigns
  });
};

// @desc    Get single campaign
// @route   GET /api/campaigns/:id
// @access  Private
const getCampaign = async (req, res) => {
  const campaign = await Campaign.findById(req.params.id);
  
  if (!campaign) {
    return res.status(404).json({
      success: false,
      error: 'Campaign not found'
    });
  }

  res.status(200).json({
    success: true,
    data: campaign
  });
};

// @desc    Create campaign
// @route   POST /api/campaigns
// @access  Private
const createCampaign = async (req, res) => {
  const campaign = await Campaign.create(req.body);
  
  res.status(201).json({
    success: true,
    data: campaign
  });
};

// @desc    Update campaign
// @route   PUT /api/campaigns/:id
// @access  Private
const updateCampaign = async (req, res) => {
  let campaign = await Campaign.findById(req.params.id);

  if (!campaign) {
    return res.status(404).json({
      success: false,
      error: 'Campaign not found'
    });
  }

  campaign = await Campaign.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: campaign
  });
};

// @desc    Delete campaign
// @route   DELETE /api/campaigns/:id
// @access  Private
const deleteCampaign = async (req, res) => {
  const campaign = await Campaign.findById(req.params.id);

  if (!campaign) {
    return res.status(404).json({
      success: false,
      error: 'Campaign not found'
    });
  }

  await campaign.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
};

module.exports = {
  getCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign
};


