const mongoose = require('mongoose');
const crypto = require('crypto');

const AutoIncrement = require('mongoose-sequence')(mongoose);

const taskSchema = new mongoose.Schema({
  taskId: {
    type: Number,
    unique: true
  },
  aircraft: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Aircraft',
    required: [true, 'Aircraft is required'],
    index: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Assignee reference is required'],
    index: true
  },
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  priority: {
    type: Number,
    min: [1, 'Priority must be between 1 and 5'],
    max: [5, 'Priority must be between 1 and 5'],
    required: true,
    validate: {
      validator: Number.isInteger,
      message: 'Priority must be an integer'
    }
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'in_progress', 'completed', 'verified', 'rejected'],
      message: '{VALUE} is not a valid status'
    },
    default: 'pending',
    index: true
  },
  startDate: {
    type: Date,
    validate: {
      validator: function(v) {
        return !this.dueDate || v <= this.dueDate;
      },
      message: 'Start date must be before or equal to due date'
    }
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required'],
    validate: {
      validator: function(v) {
        return v > new Date();
      },
      message: 'Due date must be in the future'
    },
    index: true
  },
  completedAt: Date,
  verificationDetails: {
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verifiedAt: Date,
    hash: String,
    notes: String
  },
  checklist: [{
    item: {
      type: String,
      required: true
    },
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: Date,
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  attachments: [{
    type: {
      type: String,
      enum: ['before', 'after', 'progress'],
      required: true
    },
    filename: String,
    path: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: (doc, ret) => {
      delete ret.__v;
      return ret;
    }
  }
});

// Compound indexes for efficient querying
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ issue: 1, status: 1 });
taskSchema.index({ dueDate: 1, status: 1 });

// Virtual for completion percentage
taskSchema.virtual('completionPercentage').get(function() {
  if (!this.checklist || this.checklist.length === 0) return 0;
  const completed = this.checklist.filter(item => item.completed).length;
  return Math.round((completed / this.checklist.length) * 100);
});

// Method to generate verification hash
taskSchema.methods.generateVerificationHash = function() {
  const data = {
    taskId: this._id,
    issue: this.issue,
    completedAt: this.completedAt,
    checklist: this.checklist,
    timestamp: Date.now()
  };
  
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(data))
    .digest('hex');
};

// Pre-save middleware for status transitions
taskSchema.pre('save', function(next) {
  if (this.isModified('checklist')) {
    const allCompleted = this.checklist.every(item => item.completed);
    if (allCompleted && this.status === 'in_progress') {
      this.status = 'completed';
      this.completedAt = new Date();
    }
  }
  next();
});

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;