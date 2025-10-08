// Check notifications in database
const mongoose = require('mongoose');
const Notification = require('./models/Notification');
const User = require('./models/User');

async function checkNotifications() {
  try {
    await mongoose.connect('mongodb://localhost:27017/websphere');
    console.log('✅ Connected to MongoDB');

    const notifications = await Notification.find({}).populate('userId', 'fullName email role');
    
    console.log(`\n📬 Found ${notifications.length} notifications:`);
    for (const notification of notifications) {
      console.log(`\n📋 Notification:`);
      console.log(`   User: ${notification.userId?.fullName} (${notification.userId?.role})`);
      console.log(`   Type: ${notification.type}`);
      console.log(`   Title: ${notification.title}`);
      console.log(`   Body: ${notification.body}`);
      console.log(`   Read: ${notification.read}`);
      console.log(`   Created: ${notification.createdAt}`);
      console.log(`   ---`);
    }

    // Check notifications by role
    const clientNotifications = await Notification.find({ userRole: 'client' });
    const freelancerNotifications = await Notification.find({ userRole: 'freelancer' });

    const clientCount = clientNotifications.length;
    const freelancerCount = freelancerNotifications.length;

    console.log(`\n📊 Summary:`);
    console.log(`   Client notifications: ${clientCount}`);
    console.log(`   Freelancer notifications: ${freelancerCount}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

checkNotifications();