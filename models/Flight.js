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
  },
  // Link to return flight for round trips (e.g., MXP-DXB-MXP)
  returnFlightId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Flight',
    default: null
  },
  // Indicates if this is a round trip flight
  isRoundTrip: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Flight', flightSchema);


