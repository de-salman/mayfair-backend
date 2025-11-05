const bcrypt = require('bcryptjs');
const User = require('../models/User');

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin/Superadmin)
const getUsers = async (req, res) => {
  const users = await User.find().select('-password');
  res.status(200).json({
    success: true,
    count: users.length,
    data: users
  });
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private (Admin/Superadmin)
const getUser = async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  res.status(200).json({
    success: true,
    data: user
  });
};

// @desc    Create user
// @route   POST /api/users
// @access  Private (Superadmin for admin role, Admin for user role)
const createUser = async (req, res) => {
  const { name, email, password, role, allowedModules } = req.body;

  // Validation
  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Please provide name, email, and password'
    });
  }

  // Check if user exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({
      success: false,
      error: 'User already exists with this email'
    });
  }

  // Only superadmin can create admin role users
  if (role === 'admin' && req.user.role !== 'superadmin') {
    return res.status(403).json({
      success: false,
      error: 'Only superadmin can create admin users'
    });
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create user
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: role || 'user',
    allowedModules: allowedModules || []
  });

  const userResponse = user.toObject();
  delete userResponse.password;

  res.status(201).json({
    success: true,
    data: userResponse
  });
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Superadmin/Admin)
const updateUser = async (req, res) => {
  let user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  // Only superadmin can change role to admin
  if (req.body.role === 'admin' && req.user.role !== 'superadmin') {
    return res.status(403).json({
      success: false,
      error: 'Only superadmin can assign admin role'
    });
  }

  // Hash password if provided
  if (req.body.password) {
    const salt = await bcrypt.genSalt(10);
    req.body.password = await bcrypt.hash(req.body.password, salt);
  }

  user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).select('-password');

  res.status(200).json({
    success: true,
    data: user
  });
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Superadmin)
const deleteUser = async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  // Prevent deleting yourself
  if (user._id.toString() === req.user.id) {
    return res.status(400).json({
      success: false,
      error: 'Cannot delete your own account'
    });
  }

  await user.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
};

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser
};


