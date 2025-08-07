// backend/scripts/createAdmin.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const createAdminUser = async () => {
  try {
    // Connect to database using lowercase to match existing data
    const mongoUri = process.env.MONGODB_URI.replace('/WebSphere?', '/websphere?');
    await mongoose.connect(mongoUri);
    
    console.log('Connected to MongoDB');
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@admin.com' });
    
    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Create admin user with password that meets validation (6+ characters)
    const admin = new User({
      fullName: 'System Administrator',
      email: 'admin@admin.com',
      password: 'admin123', // Changed from 'admin' to 'admin123' (6+ characters)
      role: 'admin'
    });

    await admin.save();
    console.log('✅ Admin user created successfully');
    console.log('Email: admin@admin.com');
    console.log('Password: admin123'); // Updated password
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    process.exit(0);
  }
};

createAdminUser();
