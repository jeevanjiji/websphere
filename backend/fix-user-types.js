// Test script to check and fix user types
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function fixUserTypes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all users and their current userType
    const users = await User.find({});
    console.log('\n👥 Current users and their types:');
    
    for (const user of users) {
      console.log(`${user.fullName} (${user.email}): role = "${user.role}"`);
    }

    // Update users to have proper role
    console.log('\n🔧 Updating user roles...');
    
    // Set the main user as client (the one with mca.ajce.in email)
    await User.updateOne(
      { email: 'jeevanjiji2026@mca.ajce.in' },
      { role: 'client' }
    );
    console.log('✅ Updated jeevanjiji2026@mca.ajce.in to client');

    // Set the other user as freelancer
    await User.updateOne(
      { email: 'jeevanjiji2003@gmail.com' },
      { role: 'freelancer' }
    );
    console.log('✅ Updated jeevanjiji2003@gmail.com to freelancer');

    // Set admin user
    await User.updateOne(
      { email: 'admin@admin.com' },
      { role: 'admin' }
    );
    console.log('✅ Updated admin@admin.com to admin');

    // Set other test users as freelancers
    await User.updateMany(
      { 
        email: { $in: [
          'jeevanvettickal@gmail.com',
          'john.low@test.com',
          'jane.below@test.com',
          'bob.good@test.com',
          'alice.none@test.com',
          'mike.marginal@test.com'
        ]}
      },
      { role: 'freelancer' }
    );
    console.log('✅ Updated remaining users to freelancer');

    // Check updated users
    const updatedUsers = await User.find({});
    console.log('\n📊 Updated users:');
    
    for (const user of updatedUsers) {
      console.log(`${user.fullName} (${user.email}): role = "${user.role}"`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

fixUserTypes();
