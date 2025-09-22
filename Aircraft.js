const mongoose = require('mongoose');

const aircraftSchema = new mongoose.Schema({
  tailNumber: { 
    type: String, 
    required: [true, 'Tail number is required'],
    unique: true,
    trim: true,
    uppercase: true,
    index: true
  },
  model: { 
    type: String, 
    required: [true, 'Aircraft model is required'],
    trim: true
  },
  manufacturer: {
    type: String,
    required: [true, 'Manufacturer is required'],
    trim: true
  },
  currentHealth: { 
    type: Number, 
    min: [0, 'Health cannot be negative'],
    max: [100, 'Health cannot exceed 100'],
    default: 100,
    validate: {
      validator: Number.isInteger,
      message: 'Health must be an integer'
    }
  },
  status: {
    type: String,
    enum: {
      values: ['active', 'maintenance', 'grounded'],
      message: '{VALUE} is not a valid status'
    },
    default: 'active',
    index: true
  },
  maintenanceHistory: [{
    type: {
      type: String,
      required: true,
      enum: ['scheduled', 'unscheduled', 'emergency']
    },
    description: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    date: {
      type: Date,
      default: Date.now
    }
  }],
  nextInspectionDue: {
    type: Date,
    required: true,
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

// Virtual for days until next inspection
aircraftSchema.virtual('daysUntilInspection').get(function() {
  if (!this.nextInspectionDue) return null;
  const now = new Date();
  const diff = this.nextInspectionDue.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// Compound index for efficient querying
aircraftSchema.index({ status: 1, currentHealth: -1 });

// Pre-save middleware to validate health changes
aircraftSchema.pre('save', function(next) {
  if (this.isModified('currentHealth')) {
    this.status = this.currentHealth < 50 ? 'maintenance' : 
                  this.currentHealth < 20 ? 'grounded' : 'active';
  }
  next();
});

const Aircraft = mongoose.model('Aircraft', aircraftSchema);

module.exports = Aircraft;