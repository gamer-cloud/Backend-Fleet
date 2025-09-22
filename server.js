const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const aircraftRoutes = require('./routes/aircraft');
const issueRoutes = require('./routes/issues');
const taskRoutes = require('./routes/tasks');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('ERROR: MONGODB_URI ');
  process.exit(1);
}

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4
    });
    
    console.log('✅ Successfully connected to MongoDB Atlas');
    
    // Test the connection
    await mongoose.connection.db.admin().ping();
    console.log('🔄 Database ping successful');
    
  } catch (error) {
    console.error(' MongoDB Atlas connection error:', error.message);
    console.log('Please check:');
    console.log('1. Your IP is whitelisted in MongoDB Atlas');
    console.log('2. Username and password are correct');
    console.log('3. Network connection is stable');
    process.exit(1);
  }
};

connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/aircraft', aircraftRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/tasks', taskRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(` Server is running on port ${PORT}`);
});