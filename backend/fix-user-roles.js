const mongoose = require('mongoose');
require('dotenv').config();

async function fixUserRoles() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const User = require('./models/User');
    
    // Get all users
    const allUsers = await User.find({});
    console.log('Total users:', allUsers.length);
    
    for (const user of allUsers) {
      console.log(`User: ${user.fullName}, Email: ${user.email}, Role: ${user.role || 'undefined'}`);
      
      // If role is undefined/null and user made applications, set as freelancer
      if (!user.role) {
        const Application = require('./models/Application');
        const userApplications = await Application.find({ freelancer: user._id });
        
        if (userApplications.length > 0) {
          console.log(`  - Found ${userApplications.length} applications, setting as freelancer`);
          user.role = 'freelancer';
          await user.save();
        } else if (user.email === 'admin@admin.com') {
          console.log('  - Setting admin user');
          user.role = 'admin';
          await user.save();
        } else {
          console.log('  - No applications found, setting as client');
          user.role = 'client';
          await user.save();
        }
      }
    }
    
    console.log('User roles fixed!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixUserRoles();
