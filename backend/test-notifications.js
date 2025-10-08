// Test script to manually run notification checks
const mongoose = require('mongoose');
const DueDateNotificationJob = require('./jobs/dueDateNotifications');
const Milestone = require('./models/Milestone');
const Workspace = require('./models/Workspace');

async function testNotifications() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/websphere');
    console.log('✅ Connected to MongoDB');
    
    // Get current date for comparison
    const now = new Date();
    console.log('📅 Current date:', now.toISOString());
    
    // Find all milestones with their workspaces
    const milestones = await Milestone.find({})
      .populate({
        path: 'workspace',
        populate: [
          { path: 'client', model: 'User' },
          { path: 'freelancer', model: 'User' },
          { path: 'project', model: 'Project' }
        ]
      });
    
    console.log(`\n📋 Found ${milestones.length} milestones:`);
    
    for (const milestone of milestones) {
      if (!milestone.workspace) {
        console.log(`❌ Milestone ${milestone._id} has no workspace`);
        continue;
      }
      
      const dueDate = new Date(milestone.dueDate);
      const paymentDueDate = new Date(milestone.paymentDueDate);
      const isOverdue = dueDate < now;
      const isPaymentOverdue = paymentDueDate < now;
      
      console.log(`\n🎯 Milestone: ${milestone.title}`);
      console.log(`   Status: ${milestone.status}`);
      console.log(`   Due Date: ${dueDate.toLocaleDateString()} (${isOverdue ? 'OVERDUE' : 'upcoming'})`);
      console.log(`   Payment Due: ${paymentDueDate.toLocaleDateString()} (${isPaymentOverdue ? 'OVERDUE' : 'upcoming'})`);
      console.log(`   Overdue Notification Sent: ${milestone.overdueNotificationSent || false}`);
      console.log(`   Payment Overdue Notification Sent: ${milestone.paymentOverdueNotificationSent || false}`);
      console.log(`   Client: ${milestone.workspace.client?.fullName || 'Unknown'}`);
      console.log(`   Freelancer: ${milestone.workspace.freelancer?.fullName || 'Unknown'}`);
    }
    
    console.log('\n🔔 Running notification check...');
    const result = await DueDateNotificationJob.checkAndNotify();
    console.log('✅ Notification check result:', result);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

testNotifications();