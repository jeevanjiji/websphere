/**
 * Test script for escrow notification system
 */

require('dotenv').config();
const mongoose = require('mongoose');
const EscrowService = require('../services/escrowService');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
}

async function testNotifications() {
  try {
    console.log('\n🧪 Testing Escrow Notification System');
    console.log('═'.repeat(50));

    // Get existing escrow for testing
    const Escrow = require('../models/Escrow');
    const escrow = await Escrow.findOne()
      .populate('milestone workspace client freelancer');

    if (!escrow) {
      console.log('❌ No escrow found for testing');
      return;
    }

    console.log(`\n📧 Testing notifications for escrow: ${escrow._id}`);
    console.log(`   Milestone: ${escrow.milestone?.title}`);
    console.log(`   Client: ${escrow.client?.fullName}`);
    console.log(`   Freelancer: ${escrow.freelancer?.fullName}`);

    // Test different notification types
    const notificationTypes = [
      'payment_received',
      'deliverable_submitted', 
      'client_approved',
      'client_rejected',
      'funds_released'
    ];

    for (const type of notificationTypes) {
      console.log(`\n📬 Testing notification: ${type}`);
      try {
        await EscrowService.sendEscrowNotifications(escrow, type);
        console.log(`   ✅ ${type} notification sent successfully`);
      } catch (error) {
        console.log(`   ❌ ${type} notification failed: ${error.message}`);
      }
      
      // Add small delay between notifications
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Check created notifications
    const Notification = require('../models/Notification');
    const recentNotifications = await Notification.find({
      $or: [
        { userId: escrow.freelancer._id },
        { userId: escrow.client._id }
      ],
      createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) } // Last 5 minutes
    }).sort({ createdAt: -1 });

    console.log(`\n📬 Created Notifications (${recentNotifications.length}):`);
    recentNotifications.forEach((notification, index) => {
      console.log(`\n   ${index + 1}. ${notification.title}`);
      console.log(`      To: ${notification.userRole}`);
      console.log(`      Body: ${notification.body}`);
      console.log(`      Created: ${notification.createdAt.toLocaleString()}`);
    });

  } catch (error) {
    console.error('❌ Error testing notifications:', error);
  }
}

async function main() {
  await connectDB();
  
  console.log('🚀 Starting Notification System Test...');
  
  await testNotifications();
  
  console.log('\n✨ Test completed!');
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});