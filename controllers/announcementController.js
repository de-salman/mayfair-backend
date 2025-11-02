const Announcement = require('../models/Announcement');

// @desc    Get all announcements
// @route   GET /api/announcements
// @access  Private
const getAnnouncements = async (req, res) => {
  const announcements = await Announcement.find()
    .populate('createdBy', 'name email')
    .sort({ date: -1 });
  
  res.status(200).json({
    success: true,
    count: announcements.length,
    data: announcements
  });
};

// @desc    Get single announcement
// @route   GET /api/announcements/:id
// @access  Private
const getAnnouncement = async (req, res) => {
  const announcement = await Announcement.findById(req.params.id)
    .populate('createdBy', 'name email');
  
  if (!announcement) {
    return res.status(404).json({
      success: false,
      error: 'Announcement not found'
    });
  }

  res.status(200).json({
    success: true,
    data: announcement
  });
};

// @desc    Create announcement
// @route   POST /api/announcements
// @access  Private
const createAnnouncement = async (req, res) => {
  // Set createdBy from authenticated user
  req.body.createdBy = req.user.id;
  
  const announcement = await Announcement.create(req.body);
  
  const populatedAnnouncement = await Announcement.findById(announcement._id)
    .populate('createdBy', 'name email');
  
  res.status(201).json({
    success: true,
    data: populatedAnnouncement
  });
};

// @desc    Update announcement
// @route   PUT /api/announcements/:id
// @access  Private
const updateAnnouncement = async (req, res) => {
  let announcement = await Announcement.findById(req.params.id);

  if (!announcement) {
    return res.status(404).json({
      success: false,
      error: 'Announcement not found'
    });
  }

  announcement = await Announcement.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).populate('createdBy', 'name email');

  res.status(200).json({
    success: true,
    data: announcement
  });
};

// @desc    Delete announcement
// @route   DELETE /api/announcements/:id
// @access  Private
const deleteAnnouncement = async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);

  if (!announcement) {
    return res.status(404).json({
      success: false,
      error: 'Announcement not found'
    });
  }

  await announcement.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
};

module.exports = {
  getAnnouncements,
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
};

