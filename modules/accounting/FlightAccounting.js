const mongoose = require('mongoose');

const flightAccountingSchema = new mongoose.Schema({
  flightId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Flight',
    required: [true, 'Please add a flight ID'],
    unique: true // One accounting record per flight
  },
  budget: {
    type: Number,
    min: [0, 'Budget must be positive'],
    default: 0
  },
  budgetPerFlight: {
    type: Number,
    min: [0, 'Budget per flight must be positive'],
    default: 0
  },
  capacity: {
    type: Number,
    min: [0, 'Capacity must be positive'],
    default: 0
  },
  bookingLoad: {
    type: Number,
    min: [0, 'Booking load must be between 0 and 1'],
    max: [1, 'Booking load must be between 0 and 1'],
    default: 0
  },
  baseFare: {
    type: Number,
    min: [0, 'Base fare must be positive'],
    default: 0
  },
  sectorTaxes: {
    type: Number,
    min: [0, 'Sector taxes must be positive'],
    default: 0
  },
  fuelSurcharge: {
    type: Number,
    min: [0, 'Fuel surcharge must be positive'],
    default: 0
  },
  serviceCharges: {
    type: Number,
    min: [0, 'Service charges must be positive'],
    default: 0
  },
  totalRevenue: {
    type: Number,
    min: [0, 'Total revenue must be positive'],
    default: 0
  },
  operatingCosts: {
    type: Number,
    min: [0, 'Operating costs must be positive'],
    default: 0
  },
  crewCosts: {
    type: Number,
    min: [0, 'Crew costs must be positive'],
    default: 0
  },
  fuelCosts: {
    type: Number,
    min: [0, 'Fuel costs must be positive'],
    default: 0
  },
  maintenanceCosts: {
    type: Number,
    min: [0, 'Maintenance costs must be positive'],
    default: 0
  },
  totalCosts: {
    type: Number,
    min: [0, 'Total costs must be positive'],
    default: 0
  },
  netProfit: {
    type: Number,
    default: 0
  },
  profitMargin: {
    type: Number,
    min: [0, 'Profit margin must be between 0 and 100'],
    max: [100, 'Profit margin must be between 0 and 100'],
    default: 0
  },
  currency: {
    type: String,
    enum: ['USD', 'EUR', 'GBP', 'AED', 'INR', 'PKR', 'SGD', 'AUD'],
    default: 'USD'
  },
  notes: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Pre-save middleware to calculate totalRevenue, totalCosts, netProfit, and profitMargin
flightAccountingSchema.pre('save', function(next) {
  // Calculate total revenue
  this.totalRevenue = (this.baseFare || 0) + 
                      (this.sectorTaxes || 0) + 
                      (this.fuelSurcharge || 0) + 
                      (this.serviceCharges || 0);

  // Calculate total costs
  this.totalCosts = (this.operatingCosts || 0) + 
                    (this.crewCosts || 0) + 
                    (this.fuelCosts || 0) + 
                    (this.maintenanceCosts || 0);

  // Calculate net profit
  this.netProfit = this.totalRevenue - this.totalCosts;

  // Calculate profit margin (percentage)
  if (this.totalRevenue > 0) {
    this.profitMargin = ((this.netProfit / this.totalRevenue) * 100);
  } else {
    this.profitMargin = 0;
  }

  next();
});

// Index for faster queries
flightAccountingSchema.index({ flightId: 1 });
flightAccountingSchema.index({ createdAt: -1 });

module.exports = mongoose.model('FlightAccounting', flightAccountingSchema);

