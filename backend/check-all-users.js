const mongoose = require('mongoose');
const User = require('./models/User');

async function checkUsers() {
  await mongoose.connect('mongodb://localhost:27017/websphere');
  const users = await User.find({}, 'fullName email role createdAt');
  console.log('Users in database:');
  users.forEach(u => console.log(`  ${u.fullName} (${u.email}) - ${u.role}`));
  
  // Check notifications for each user
  const Notification = require('./models/Notification');
  for (const user of users) {
    const notifications = await Notification.find({ userId: user._id });
    console.log(`  Notifications for ${user.email}: ${notifications.length}`);
  }
  
  await mongoose.disconnect();
}

checkUsers().catch(console.error);