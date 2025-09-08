// Test script to verify authentication flow
require('dotenv').config();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

async function testAuth() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the client user
    const clientUser = await User.findOne({ email: 'jeevanjiji2026@mca.ajce.in' });
    console.log('\n👤 Client user:', {
      id: clientUser._id,
      name: clientUser.fullName,
      email: clientUser.email,
      role: clientUser.role
    });

    // Generate a fresh JWT token for testing
    const token = jwt.sign(
      { userId: clientUser._id, role: clientUser.role },
      process.env.JWT_SECRET || 'your_jwt_secret_key',
      { expiresIn: '24h' }
    );

    console.log('\n🔑 Generated JWT token for client:');
    console.log('Token (first 50 chars):', token.substring(0, 50) + '...');

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
    console.log('\n🔓 Decoded token:', decoded);

    // Find freelancer user
    const freelancerUser = await User.findOne({ email: 'jeevanjiji2003@gmail.com' });
    console.log('\n👨‍💻 Freelancer user:', {
      id: freelancerUser._id,
      name: freelancerUser.fullName,
      email: freelancerUser.email,
      role: freelancerUser.role
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testAuth();
