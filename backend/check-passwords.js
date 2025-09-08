// Check user passwords and create test login
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function checkPasswords() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the client user
    const user = await User.findOne({ email: 'jeevanjiji2026@mca.ajce.in' });
    
    if (user) {
      console.log('👤 User found:', {
        id: user._id,
        name: user.fullName,
        email: user.email,
        role: user.role,
        hasPassword: !!user.password,
        passwordHash: user.password?.substring(0, 20) + '...'
      });

      // Test common passwords
      const testPasswords = ['password123', '123456', 'password', 'test123', 'admin123'];
      
      for (const pwd of testPasswords) {
        const isMatch = await bcrypt.compare(pwd, user.password);
        console.log(`🔑 Password "${pwd}": ${isMatch ? '✅ MATCH' : '❌ No match'}`);
        if (isMatch) break;
      }
    } else {
      console.log('❌ User not found');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkPasswords();
