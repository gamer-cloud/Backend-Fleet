const express = require('express');
const router = express.Router();
const Issue = require('../models/Issue');
const { body, param, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');

// Get all issues
router.get('/', async (req, res) => {
  try {
    const issues = await Issue.find()
      .populate('reportedBy', 'name employeeId')
      .sort({ createdAt: -1 })
      .select('-__v');
    res.json(issues);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch issues',
      details: error.message 
    });
  }
});

// Create new issue
router.post('/', [
  body('tailNumber')
    .trim()
    .notEmpty().withMessage('Tail number is required')
    .toUpperCase(),
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ min: 200, max: 1200 }).withMessage('Description must be between 200 and 1200 characters'),
  body('severity')
    .isIn(['low', 'medium', 'high'])
    .withMessage('Please select a valid severity level (low, medium, high)'),
  body('status')
    .optional()
    .isIn(['reported', 'in_review', 'assigned', 'in_progress', 'resolved'])
    .withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Get token from header or cookie
    const token = req.header('Authorization')?.replace('Bearer ', '') || req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Verify token and get user info
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Create issue with frontend data and user details
    const issue = new Issue({
      tailNumber: req.body.tailNumber,
      description: req.body.description,
      severity: req.body.severity,
      status: 'reported',
      reportedBy: decoded.id,  // Store just the user ID as per model
      reportedAt: new Date()
    });
    
    await issue.save();
    
    // No need to populate since we're storing user details directly
    const savedIssue = await Issue.findById(issue._id)
      .populate('reportedBy', 'name employeeId');  // Populate user details for response

    res.status(201).json(savedIssue);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to create issue',
      details: error.message 
    });
  }
});

module.exports = router;