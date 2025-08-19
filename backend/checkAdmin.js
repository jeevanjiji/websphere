// Check admin user in database
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function checkAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI.replace('/WebSphere?', '/websphere?'));
    console.log('Connected to database');
    
    const admin = await User.findOne({ email: 'admin@admin.com' });
    
    if (admin) {
      console.log('✅ Admin user found:');
      console.log('   Email:', admin.email);
      console.log('   Role:', admin.role);
      console.log('   ID:', admin._id);
      console.log('   Active:', admin.isActive);
    } else {
      console.log('❌ Admin user not found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAdmin();
