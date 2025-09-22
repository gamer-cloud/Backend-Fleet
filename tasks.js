const express = require('express');
const Task = require('../models/Task');
const Issue = require('../models/Issue');
const upload = require('../config/upload');
const crypto = require('crypto');
const { body, param, validationResult } = require('express-validator');
const router = express.Router();

// Get all tasks
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate('issue', 'title description')
      .populate('assignedTo', 'name employeeId')
      .sort({ createdAt: -1 })
      .select('-__v');
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch tasks',
      details: error.message 
    });
  }
});

// Create a new task
router.post('/', [
  body('aircraft').isMongoId().withMessage('Valid aircraft ID is required'),
  body('assignedTo').isMongoId().withMessage('Valid assignee ID is required'),
  body('severityLevel').isIn(['low', 'medium', 'high', 'critical']).withMessage('Valid severity level is required'),
  body('dueDate').isISO8601().withMessage('Valid due date is required'),
  body('taskTitle').trim().notEmpty().withMessage('Task title is required'),
  body('taskDetails').trim().notEmpty().withMessage('Task details are required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const task = new Task({
      ...req.body,
      status: 'pending'
    });
    
    await task.save();
    
    const populatedTask = await Task.findById(task._id)
      .populate('issue', 'title description')
      .populate('assignedTo', 'name employeeId');

    res.status(201).json(populatedTask);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to create task',
      details: error.message 
    });
  }
});

// Upload before/after images
router.post('/:id/upload', upload.single('image'), async (req, res) => {
  try {
    const { type } = req.body; // 'before' or 'after'
    const task = await Task.findById(req.params.id);
    
    if (type === 'before') {
      task.beforeImageId = req.file.id;
    } else if (type === 'after') {
      task.afterImageId = req.file.id;
    }
    
    await task.save();
    res.json({ message: 'Image uploaded successfully', fileId: req.file.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify a task (generate hash)
router.post('/:id/verify', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('issue')
      .populate('assignedTo');
    
    // Create hash data
    const hashData = {
      taskId: task._id.toString(),
      issue: task.issue.description,
      assignedTo: task.assignedTo.employeeId,
      completedAt: new Date().toISOString()
    };
    
    // Generate SHA-256 hash
    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify(hashData));
    task.verificationHash = hash.digest('hex');
    task.verifiedAt = new Date();
    task.status = 'verified';
    
    await task.save();
    
    // Update issue status
    await Issue.findByIdAndUpdate(task.issue._id, { status: 'verified' });
    
    res.json({ 
      message: 'Task verified successfully', 
      verificationHash: task.verificationHash 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/tasks/test
router.get('/test', (req, res) => {
  res.json({ message: 'Tasks route is working' });
});

module.exports = router;