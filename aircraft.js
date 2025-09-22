const express = require('express');
const router = express.Router();
const Aircraft = require('../models/Aircraft');
const { body, param, validationResult } = require('express-validator');

// GET /api/aircraft/test
router.get('/test', (req, res) => {
  res.json({ message: 'Aircraft route is working' });
});

// Get all aircraft
router.get('/', async (req, res) => {
  try {
    const aircraft = await Aircraft.find()
      .select('-__v')
      .sort({ createdAt: -1 });
    res.json(aircraft);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch aircraft',
      details: error.message 
    });
  }
});

// Get aircraft by ID
router.get('/:id', [
  param('id').isMongoId().withMessage('Invalid aircraft ID')
], async (req, res) => {
  try {
    const aircraft = await Aircraft.findById(req.params.id)
      .select('-__v');
      
    if (!aircraft) {
      return res.status(404).json({ error: 'Aircraft not found' });
    }
    
    res.json(aircraft);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch aircraft',
      details: error.message 
    });
  }
});

// Create new aircraft
router.post('/', [
  body('tailNumber').trim().notEmpty().withMessage('Tail number is required'),
  body('model').trim().notEmpty().withMessage('Model is required'),
  body('manufacturer').trim().notEmpty().withMessage('Manufacturer is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const aircraft = new Aircraft(req.body);
    await aircraft.save();
    res.status(201).json(aircraft);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ 
        error: 'Aircraft with this tail number already exists' 
      });
    }
    res.status(500).json({ 
      error: 'Failed to create aircraft',
      details: error.message 
    });
  }
});

// Update aircraft health
router.patch('/:id/health', async (req, res) => {
  try {
    const { healthScore } = req.body;
    const aircraft = await Aircraft.findByIdAndUpdate(
      req.params.id,
      { currentHealth: healthScore },
      { new: true }
    );
    res.json(aircraft);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;