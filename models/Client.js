const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a client name'],
    trim: true
  },
  company: {
    type: String,
    trim: true
  },
  contact: {
    type: String,
    trim: true
  },
  lastFlightDate: {
    type: Date
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Client', clientSchema);

