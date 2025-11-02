const mongoose = require('mongoose');

const flightSchema = new mongoose.Schema({
  flightNo: {
    type: String,
    required: [true, 'Please add a flight number'],
    trim: true,
    uppercase: true
  },
  origin: {
    type: String,
    required: [true, 'Please add an origin'],
    trim: true
  },
  destination: {
    type: String,
    required: [true, 'Please add a destination'],
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'Please add a flight date']
  },
  time: {
    type: String,
    required: [true, 'Please add a flight time'],
    trim: true
  },
  aircraft: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'delayed', 'cancelled', 'completed', 'in-progress'],
    default: 'scheduled'
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please specify who uploaded this flight']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Flight', flightSchema);

