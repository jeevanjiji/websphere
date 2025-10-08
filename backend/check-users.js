// Check existing users
const mongoose = require('mongoose');
const User = require('./models/User');

async function checkUsers() {
  try {
    await mongoose.connect('mongodb://localhost:27017/websphere');
    console.log('✅ Connected to MongoDB');

    const users = await User.find({});
    console.log(`\n👤 Found ${users.length} users:`);
    
    for (const user of users) {
      console.log(`   ${user.fullName} (${user.email}) - Role: ${user.role}`);
    }

    if (users.length === 0) {
      console.log('\n🔧 Creating test users...');
      
      const client = await User.create({
        fullName: 'Test Client',
        email: 'client@test.com',
        password: 'password123',
        role: 'client',
        isVerified: true,
        notificationPreferences: {
          email: true,
          push: true,
          paymentReminders: true,
          deliverableReminders: true,
          dueDateAlerts: true,
          overdueAlerts: true
        }
      });

      const freelancer = await User.create({
        fullName: 'Test Freelancer',
        email: 'freelancer@test.com',
        password: 'password123',
        role: 'freelancer',
        isVerified: true,
        notificationPreferences: {
          email: true,
          push: true,
          paymentReminders: true,
          deliverableReminders: true,
          dueDateAlerts: true,
          overdueAlerts: true
        }
      });

      console.log('✅ Created test client and freelancer');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

checkUsers();