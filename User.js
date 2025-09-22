const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const userSchema = new mongoose.Schema({
  employeeId: { 
    type: String, 
    required: [true, 'Employee ID is required'],
    unique: true,
    trim: true,
    index: true 
  },
  name: { 
    type: String, 
    required: [true, 'Name is required'],
    trim: true 
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    index: true
  },
  role: { 
    type: String, 
    required: true, 
    enum: {
      values: ['pilot', 'engineer', 'manager', 'admin'],
      message: '{VALUE} is not a valid role'
    },
    default: 'engineer'
  },
  password: { 
    type: String, 
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  }
});

// Auto-increment plugin configuration
userSchema.plugin(AutoIncrement, {
  inc_field: 'employeeNumber',
  start_seq: 1000,
  prefix: 'EMP'
});

// Pre-save middleware to set employeeId
userSchema.pre('save', async function(next) {
  if (!this.employeeId && this.employeeNumber) {
    this.employeeId = `${this.employeeNumber}`;
  }
  next();
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Add indexes for frequently queried fields
userSchema.index({ employeeId: 1, email: 1 });

const User = mongoose.model('User', userSchema);

module.exports = User;