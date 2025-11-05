const Accounting = require('../models/Accounting');

// @desc    Get all accounting records
// @route   GET /api/accounting
// @access  Private
const getAccountingRecords = async (req, res) => {
  const accountingRecords = await Accounting.find().sort({ date: -1 });
  res.status(200).json({
    success: true,
    count: accountingRecords.length,
    data: accountingRecords
  });
};

// @desc    Get single accounting record
// @route   GET /api/accounting/:id
// @access  Private
const getAccountingRecord = async (req, res) => {
  const accountingRecord = await Accounting.findById(req.params.id);
  
  if (!accountingRecord) {
    return res.status(404).json({
      success: false,
      error: 'Accounting record not found'
    });
  }

  res.status(200).json({
    success: true,
    data: accountingRecord
  });
};

// @desc    Create accounting record
// @route   POST /api/accounting
// @access  Private
const createAccountingRecord = async (req, res) => {
  const accountingRecord = await Accounting.create({
    ...req.body,
    createdBy: req.user.id
  });
  
  res.status(201).json({
    success: true,
    data: accountingRecord
  });
};

// @desc    Update accounting record
// @route   PUT /api/accounting/:id
// @access  Private
const updateAccountingRecord = async (req, res) => {
  let accountingRecord = await Accounting.findById(req.params.id);

  if (!accountingRecord) {
    return res.status(404).json({
      success: false,
      error: 'Accounting record not found'
    });
  }

  accountingRecord = await Accounting.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: accountingRecord
  });
};

// @desc    Delete accounting record
// @route   DELETE /api/accounting/:id
// @access  Private
const deleteAccountingRecord = async (req, res) => {
  const accountingRecord = await Accounting.findById(req.params.id);

  if (!accountingRecord) {
    return res.status(404).json({
      success: false,
      error: 'Accounting record not found'
    });
  }

  await accountingRecord.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
};

module.exports = {
  getAccountingRecords,
  getAccountingRecord,
  createAccountingRecord,
  updateAccountingRecord,
  deleteAccountingRecord
};

