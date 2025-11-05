const Employee = require('../models/Employee');

// @desc    Get all employees
// @route   GET /api/employees
// @access  Private
const getEmployees = async (req, res) => {
  const employees = await Employee.find();
  res.status(200).json({
    success: true,
    count: employees.length,
    data: employees
  });
};

// @desc    Get single employee
// @route   GET /api/employees/:id
// @access  Private
const getEmployee = async (req, res) => {
  const employee = await Employee.findById(req.params.id);
  
  if (!employee) {
    return res.status(404).json({
      success: false,
      error: 'Employee not found'
    });
  }

  res.status(200).json({
    success: true,
    data: employee
  });
};

// @desc    Create employee
// @route   POST /api/employees
// @access  Private
const createEmployee = async (req, res) => {
  const employee = await Employee.create(req.body);
  
  res.status(201).json({
    success: true,
    data: employee
  });
};

// @desc    Update employee
// @route   PUT /api/employees/:id
// @access  Private
const updateEmployee = async (req, res) => {
  let employee = await Employee.findById(req.params.id);

  if (!employee) {
    return res.status(404).json({
      success: false,
      error: 'Employee not found'
    });
  }

  employee = await Employee.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: employee
  });
};

// @desc    Delete employee
// @route   DELETE /api/employees/:id
// @access  Private
const deleteEmployee = async (req, res) => {
  const employee = await Employee.findById(req.params.id);

  if (!employee) {
    return res.status(404).json({
      success: false,
      error: 'Employee not found'
    });
  }

  await employee.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
};

module.exports = {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee
};


