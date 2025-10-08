const mongoose = require('mongoose');
const Notification = require('./models/Notification');

async function checkTypes() {
  await mongoose.connect('mongodb://localhost:27017/websphere');
  const notifications = await Notification.find({}, 'type userRole title body');
  console.log('Notifications in database:');
  notifications.forEach(n => console.log(`  Type: ${n.type}, Role: ${n.userRole}, Title: ${n.title}`));
  await mongoose.disconnect();
}

checkTypes().catch(console.error);