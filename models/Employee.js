const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true
  },
  department: {
    type: String,
    required: [true, 'Please add a department'],
    trim: true
  },
  position: {
    type: String,
    required: [true, 'Please add a position'],
    trim: true
  },
  joinDate: {
    type: Date,
    required: [true, 'Please add a join date']
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'terminated', 'on-leave'],
    default: 'active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Employee', employeeSchema);

