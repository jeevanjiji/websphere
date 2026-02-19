const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const verifyClientLogin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const email = process.env.VERIFY_CLIENT_EMAIL;
    const password = process.env.VERIFY_CLIENT_PASSWORD;

    if (!email || !password) {
      console.error('❌ Missing VERIFY_CLIENT_EMAIL and/or VERIFY_CLIENT_PASSWORD in environment');
      console.error('   Example: VERIFY_CLIENT_EMAIL="client@example.com" VERIFY_CLIENT_PASSWORD="<password>" node backend/verify-client-login.js');
      process.exit(1);
    }

    // Find user
    const user = await User.findOne({ email: email });
    
    if (!user) {
      console.log('❌ User NOT found in database!');
      process.exit(1);
    }

    console.log('✅ User found in database');
    console.log('━'.repeat(60));
    console.log('User Details:');
    console.log('  Email:', user.email);
    console.log('  Full Name:', user.fullName);
    console.log('  Role:', user.role);
    console.log('  Is Verified:', user.isVerified);
    console.log('  Is Active:', user.isActive);
    console.log('  Has Password:', user.password ? 'Yes' : 'No');
    console.log('  Password Hash Length:', user.password ? user.password.length : 0);
    console.log('━'.repeat(60));

    // Test password comparison
    console.log('\nTesting password comparison...');
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (isMatch) {
      console.log('✅ Password matches! Login should work.');
    } else {
      console.log('❌ Password does NOT match!');
      console.log('\nTrying to hash the password and compare:');
      const testHash = await bcrypt.hash(password, 10);
      console.log('Test hash created:', testHash.substring(0, 20) + '...');
      
      // Check if stored password is actually hashed
      if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
        console.log('✓ Stored password is properly bcrypt hashed');
      } else {
        console.log('✗ Stored password does NOT look like bcrypt hash!');
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

verifyClientLogin();
