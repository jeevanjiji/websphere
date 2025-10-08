const mongoose = require('mongoose');
const Notification = require('./models/Notification');

async function checkNotificationData() {
  await mongoose.connect('mongodb://localhost:27017/websphere');
  const notifications = await Notification.find({});
  console.log('Notification data:');
  notifications.forEach(n => {
    console.log(`  ID: ${n._id}`);
    console.log(`  Type: ${n.type}, Role: ${n.userRole}`);
    console.log(`  Title: ${n.title}`);
    console.log(`  Data:`, JSON.stringify(n.data, null, 4));
    console.log('  ---');
  });
  await mongoose.disconnect();
}

checkNotificationData().catch(console.error);