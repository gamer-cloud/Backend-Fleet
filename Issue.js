const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
  tailNumber: {
    type: String,
    required: [true, 'Tail number is required'],
    uppercase: true,
    trim: true,
    index: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    minlength: [200, 'Description must be at least 400 characters'],
    maxlength: [1200, 'Description cannot exceed 500 characters']
  },
  severity: {
    type: String,
    required: [true, 'Severity level is required'],
    enum: {
      values: ['low', 'medium', 'high'],
      message: '{VALUE} is not a valid severity level'
    },
    index: true
  },
  status: {
    type: String,
    enum: ['reported', 'in_review', 'assigned', 'in_progress', 'resolved'],
    default: 'reported',
    index: true
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  reportedAt: {
    type: Date,
    default: Date.now,
    index: true
  }
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
issueSchema.index({ tailNumber: 1, status: 1 });
issueSchema.index({ severity: 1, status: 1 });

const Issue = mongoose.model('Issue', issueSchema);

module.exports = Issue;