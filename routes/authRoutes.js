const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { requireAuth } = require('../middleware/rbac');

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public (will restrict to superadmin later)
router.post('/register', register);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', login);

// @route   GET /api/auth/me
// @desc    Get current logged in user
// @access  Private
router.get('/me', requireAuth, getMe);

module.exports = router;

