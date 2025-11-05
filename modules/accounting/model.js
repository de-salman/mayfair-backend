const mongoose = require('mongoose');

const accountingSchema = new mongoose.Schema({
  invoiceNo: {
    type: String,
    required: [true, 'Please add an invoice number'],
    trim: true,
    unique: true
  },
  client: {
    type: String,
    required: [true, 'Please add a client name'],
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'Please add an amount'],
    min: [0, 'Amount must be positive']
  },
  date: {
    type: Date,
    required: [true, 'Please add a date'],
    default: Date.now
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: [true, 'Please specify type (income or expense)']
  },
  category: {
    type: String,
    trim: true,
    default: 'general'
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'overdue', 'cancelled'],
    default: 'pending'
  },
  description: {
    type: String,
    trim: true
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'bank transfer', 'check', 'other'],
    default: 'bank transfer'
  },
  dueDate: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Accounting', accountingSchema);

