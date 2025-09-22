const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { body, validationResult } = require('express-validator');

// Validation middleware
const validate = validationResult.withDefaults({
  formatter: error => {
    return {
      field: error.param,
      message: error.msg
    };
  }
});

// Simple login - NOT FOR PRODUCTION
router.post('/login', [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .escape(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .escape()
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    console.log('Login attempt for:', email);
    
    // Find user by email
    const user = await User.findOne({ email });
    console.log('User found:', user ? 'Yes' : 'No');

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Compare password
    const isValidPassword = await user.comparePassword(password);
    console.log('Password valid:', isValidPassword ? 'Yes' : 'No');

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Return user data
    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        employeeId: user.employeeId,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/register
router.post('/register', [
  // Validation middleware
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['pilot', 'engineer', 'manager', 'admin']).withMessage('Invalid role')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User already exists with this employee ID or email' 
      });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      role
    });

    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      message: 'User registered successfully',
      user: userResponse
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      message: 'Error registering user',
      error: error.message 
    });
  }
});

// GET /api/auth/test
router.get('/test', (req, res) => {
  res.json({ message: 'Auth route is working' });
});

module.exports = router;