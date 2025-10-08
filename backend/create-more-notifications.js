// Generate more test notifications for both roles
const mongoose = require('mongoose');
const Notification = require('./models/Notification');
const User = require('./models/User');

async function createMoreNotifications() {
  await mongoose.connect('mongodb://localhost:27017/websphere');
  
  const client = await User.findOne({ role: 'client' });
  const freelancer = await User.findOne({ role: 'freelancer' });
  
  if (!client || !freelancer) {
    console.log('❌ Users not found');
    return;
  }

  // Clear existing notifications first
  await Notification.deleteMany({});
  console.log('🗑️ Cleared existing notifications');

  // Create client notifications
  await Notification.create([
    {
      userId: client._id,
      userRole: 'client',
      type: 'payment-overdue',
      title: '🚨 Payment Overdue',
      body: 'Payment for milestone "Website Development" is now 3 days overdue!',
      data: { workspaceId: '68e55653946958ebcd509c6b', milestoneId: '68e55687490c0a2a4f980560' }
    },
    {
      userId: client._id,
      userRole: 'client', 
      type: 'deliverable-overdue',
      title: '📊 Project Update: Deliverable Overdue',
      body: 'The deliverable for "Logo Design" from Test Freelancer is now overdue.',
      data: { workspaceId: '68e55653946958ebcd509c6b', milestoneId: '68e55687490c0a2a4f980560' }
    },
    {
      userId: client._id,
      userRole: 'client',
      type: 'payment-reminder', 
      title: '💳 Payment Due Tomorrow',
      body: 'Payment for milestone "Final Testing" is due tomorrow.',
      data: { workspaceId: '68e55653946958ebcd509c6b', milestoneId: '68e55687490c0a2a4f980560' }
    }
  ]);

  // Create freelancer notifications  
  await Notification.create([
    {
      userId: freelancer._id,
      userRole: 'freelancer',
      type: 'deliverable-overdue',
      title: '🚨 Overdue: Deliverable Past Due Date', 
      body: 'Your deliverable for "API Integration" is now overdue! Please submit immediately.',
      data: { workspaceId: '68e55653946958ebcd509c6b', milestoneId: '68e55687490c0a2a4f980560' }
    },
    {
      userId: freelancer._id,
      userRole: 'freelancer',
      type: 'deliverable-reminder',
      title: '📦 Deliverable Due Tomorrow',
      body: 'Your deliverable for "Database Setup" is due tomorrow.',
      data: { workspaceId: '68e55653946958ebcd509c6b', milestoneId: '68e55687490c0a2a4f980560' }
    },
    {
      userId: freelancer._id,
      userRole: 'freelancer', 
      type: 'payment-update',
      title: '💰 Payment Received',
      body: 'Payment of ₹5,000 has been processed for milestone "Frontend Development".',
      data: { workspaceId: '68e55653946958ebcd509c6b', milestoneId: '68e55687490c0a2a4f980560' }
    }
  ]);

  console.log('✅ Created test notifications:');
  console.log('   Client notifications: 3');  
  console.log('   Freelancer notifications: 3');
  
  await mongoose.disconnect();
}

createMoreNotifications().catch(console.error);