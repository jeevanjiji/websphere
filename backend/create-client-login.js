const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const createClientUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check if user already exists
    const existingUser = await User.findOne({ email: 'clientlogin@websphere.com' });
    if (existingUser) {
      console.log('⚠️  User already exists!');
      console.log('Email:', existingUser.email);
      console.log('Name:', existingUser.fullName);
      console.log('Role:', existingUser.role);
      console.log('\nDeleting existing user...');
      await User.deleteOne({ email: 'clientlogin@websphere.com' });
      console.log('✅ Existing user deleted\n');
    }

    // Create new client user - DON'T pre-hash the password
    // The pre-save hook in the User model will hash it automatically
    const newClient = new User({
      email: 'clientlogin@websphere.com',
      password: 'Client@123', // Plain text - will be hashed by pre-save hook
      fullName: 'Client Login',
      role: 'client',
      isVerified: true,
      isActive: true,
      profileComplete: true,
      bio: 'Test client account for WebSphere platform',
      phone: '+91 9876543210',
      location: 'Mumbai, India',
      companyName: 'WebSphere Test Co.',
      notificationPreferences: {
        email: true,
        push: true,
        paymentReminders: true,
        deliverableReminders: true,
        dueDateAlerts: true,
        overdueAlerts: true
      }
    });

    await newClient.save();

    console.log('✅ Client user created successfully!\n');
    console.log('═'.repeat(50));
    console.log('📧 Email:', 'clientlogin@websphere.com');
    console.log('🔑 Password:', 'Client@123');
    console.log('👤 Name:', 'Client Login');
    console.log('🎭 Role:', 'client');
    console.log('✓ Verified:', 'Yes');
    console.log('✓ Active:', 'Yes');
    console.log('═'.repeat(50));
    console.log('\n✅ You can now login with these credentials!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

createClientUser();
