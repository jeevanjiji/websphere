const mongoose = require('mongoose');
const Notification = require('./models/Notification');
const Escrow = require('./models/Escrow');
const Workspace = require('./models/Workspace');
const User = require('./models/User');
require('dotenv').config();

async function updatePaymentNotifications() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all payment notifications that don't have client names
    const paymentNotifications = await Notification.find({
      type: 'payment',
      $or: [
        { title: '💰 Payment Received!' },
        { title: '🎉 Funds Released!' },
        { title: 'Payment Received' }
      ]
    }).populate({
      path: 'data.workspaceId',
      populate: {
        path: 'client',
        select: 'fullName'
      }
    });

    console.log(`📝 Found ${paymentNotifications.length} payment notifications to check`);

    let updatedCount = 0;

    for (const notification of paymentNotifications) {
      let needsUpdate = false;
      let newBody = notification.body;

      // Get client name from workspace
      const clientName = notification.data?.workspaceId?.client?.fullName;
      
      if (!clientName) {
        console.log(`⚠️  No client name found for notification ${notification._id}`);
        continue;
      }

      // Update payment received notifications
      if (notification.title === '💰 Payment Received!' && 
          !notification.body.includes(clientName)) {
        const amountMatch = notification.body.match(/₹(\d+(?:,\d{3})*(?:\.\d{2})?)/);
        const milestoneMatch = notification.body.match(/milestone "([^"]+)"/);
        
        if (amountMatch && milestoneMatch) {
          newBody = `${clientName} has paid ${amountMatch[0]} for milestone "${milestoneMatch[1]}". Funds are held in escrow until deliverable approval.`;
          needsUpdate = true;
        }
      }

      // Update funds released notifications
      if (notification.title === '🎉 Funds Released!' && 
          !notification.body.includes(`from ${clientName}`)) {
        const amountMatch = notification.body.match(/₹(\d+(?:,\d{3})*(?:\.\d{2})?)/);
        const milestoneMatch = notification.body.match(/milestone "([^"]+)"/);
        
        if (amountMatch && milestoneMatch) {
          newBody = `Congratulations! ${amountMatch[0]} from ${clientName} has been released to your account for milestone "${milestoneMatch[1]}".`;
          needsUpdate = true;
        }
      }

      // Update generic payment received notifications
      if (notification.title === 'Payment Received' && 
          !notification.body.includes(`from ${clientName}`)) {
        const amountMatch = notification.body.match(/₹(\d+(?:,\d{3})*(?:\.\d{2})?)/);
        const projectMatch = notification.body.match(/for (.+)$/);
        
        if (amountMatch && projectMatch) {
          newBody = `You received ${amountMatch[0]} from ${clientName} for ${projectMatch[1]}`;
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        await Notification.findByIdAndUpdate(notification._id, { body: newBody });
        console.log(`✅ Updated notification ${notification._id}: "${newBody}"`);
        updatedCount++;
      }
    }

    console.log(`🎉 Successfully updated ${updatedCount} payment notifications`);

  } catch (error) {
    console.error('❌ Error updating payment notifications:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📝 Disconnected from MongoDB');
  }
}

updatePaymentNotifications();