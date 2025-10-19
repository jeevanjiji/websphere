// Debug script to test workspace access issues
const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Workspace = require('./models/Workspace');
const Notification = require('./models/Notification');
const User = require('./models/User');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Test workspace access issues
const debugWorkspaceAccess = async () => {
  await connectDB();
  
  console.log('🔍 Debugging Workspace Access Issues\n');
  
  try {
    // 1. Check recent notifications with workspace IDs
    console.log('1️⃣ Checking recent notifications with workspaceId...');
    const notificationsWithWorkspace = await Notification.find({
      $or: [
        { workspaceId: { $exists: true } },
        { 'data.workspaceId': { $exists: true } }
      ]
    }).limit(5).sort({ createdAt: -1 });
    
    console.log(`Found ${notificationsWithWorkspace.length} notifications with workspace references:`);
    
    for (const notification of notificationsWithWorkspace) {
      console.log(`\n📱 Notification: ${notification.title}`);
      console.log(`   ID: ${notification._id}`);
      console.log(`   Type: ${notification.type}`);
      console.log(`   User ID: ${notification.userId} (${notification.userRole})`);
      
      // Extract workspace ID
      const workspaceId = notification.workspaceId || notification.data?.workspaceId;
      let finalWorkspaceId;
      
      if (typeof workspaceId === 'object' && workspaceId._id) {
        finalWorkspaceId = workspaceId._id;
      } else {
        finalWorkspaceId = workspaceId;
      }
      
      console.log(`   Workspace ID: ${finalWorkspaceId} (type: ${typeof finalWorkspaceId})`);
      
      // 2. Check if workspace exists
      if (finalWorkspaceId) {
        const workspace = await Workspace.findById(finalWorkspaceId);
        if (workspace) {
          console.log(`   ✅ Workspace found: ${workspace._id}`);
          console.log(`   📊 Client: ${workspace.client}`);
          console.log(`   👤 Freelancer: ${workspace.freelancer}`);
          
          // 3. Check if notification recipient has access
          const recipientUser = await User.findById(notification.userId);
          if (recipientUser) {
            const isClient = workspace.client.toString() === notification.userId.toString();
            const isFreelancer = workspace.freelancer.toString() === notification.userId.toString();
            
            console.log(`   🔐 Access check for ${recipientUser.fullName}:`);
            console.log(`      Is Client: ${isClient}`);
            console.log(`      Is Freelancer: ${isFreelancer}`);
            console.log(`      Has Access: ${isClient || isFreelancer ? '✅ YES' : '❌ NO'}`);
            
            if (!isClient && !isFreelancer) {
              console.log(`   ⚠️  ACCESS ISSUE: User ${recipientUser.fullName} cannot access workspace ${workspace._id}`);
            }
          } else {
            console.log(`   ❌ Recipient user not found: ${notification.userId}`);
          }
        } else {
          console.log(`   ❌ Workspace NOT found: ${finalWorkspaceId}`);
        }
      } else {
        console.log(`   ⚠️  No workspace ID found in notification`);
      }
    }
    
    // 4. Check if there are any valid workspaces
    console.log(`\n4️⃣ Checking total workspaces in database...`);
    const totalWorkspaces = await Workspace.countDocuments();
    console.log(`Total workspaces: ${totalWorkspaces}`);
    
    if (totalWorkspaces > 0) {
      const sampleWorkspace = await Workspace.findOne().populate('client', 'fullName email').populate('freelancer', 'fullName email');
      console.log(`\n📊 Sample workspace:`);
      console.log(`   ID: ${sampleWorkspace._id}`);
      console.log(`   Client: ${sampleWorkspace.client?.fullName} (${sampleWorkspace.client?._id})`);
      console.log(`   Freelancer: ${sampleWorkspace.freelancer?.fullName} (${sampleWorkspace.freelancer?._id})`);
    }
    
    // 5. Check users and their roles
    console.log(`\n5️⃣ Checking users...`);
    const totalUsers = await User.countDocuments();
    const clients = await User.countDocuments({ role: 'client' });
    const freelancers = await User.countDocuments({ role: 'freelancer' });
    
    console.log(`Total users: ${totalUsers} (Clients: ${clients}, Freelancers: ${freelancers})`);
    
  } catch (error) {
    console.error('❌ Error during debugging:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔚 Database connection closed');
  }
};

// Run the debug script
debugWorkspaceAccess().catch(console.error);