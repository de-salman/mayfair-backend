const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a campaign name'],
    trim: true
  },
  budget: {
    type: Number,
    required: [true, 'Please add a budget'],
    min: [0, 'Budget cannot be negative']
  },
  platform: {
    type: String,
    required: [true, 'Please add a platform'],
    trim: true
  },
  performance: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
    // Can store various performance metrics like impressions, clicks, conversions, etc.
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'completed', 'cancelled'],
    default: 'draft'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Campaign', campaignSchema);


