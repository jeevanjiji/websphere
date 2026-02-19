const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Workspace = require('./models/Workspace');
const Escrow = require('./models/Escrow');
const Project = require('./models/Project');

const checkFreelancerStats = async (email) => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/websphere', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`❌ User not found: ${email}`);
      process.exit(0);
    }

    console.log('\n📊 User Details:');
    console.log(`Name: ${user.fullName}`);
    console.log(`Email: ${user.email}`);
    console.log(`Role: ${user.role}`);
    console.log(`ID: ${user._id}`);

    if (user.role !== 'freelancer') {
      console.log('\n⚠️  This user is not a freelancer');
      process.exit(0);
    }

    console.log('\n💰 Calculating Earnings Stats...');

    // Get all escrows for this freelancer
    const allEscrows = await Escrow.find({ freelancer: user._id });
    console.log(`Total escrows: ${allEscrows.length}`);

    // Get completed/released escrows
    const completedEscrows = await Escrow.find({
      freelancer: user._id,
      status: { $in: ['released', 'completed'] }
    });
    console.log(`Completed/Released escrows: ${completedEscrows.length}`);

    const totalEarnings = completedEscrows.reduce((sum, escrow) => {
      return sum + (escrow.amountToFreelancer || 0);
    }, 0);

    console.log('\n💵 Earnings Breakdown:');
    completedEscrows.forEach((escrow, index) => {
      console.log(`  ${index + 1}. Status: ${escrow.status}, Amount: ₹${escrow.amountToFreelancer}`);
    });

    console.log(`\n✅ Total Earnings: ₹${totalEarnings.toLocaleString()}`);

    // Get all workspaces
    const allWorkspaces = await Workspace.find({ freelancer: user._id })
      .populate('project', 'title');
    console.log(`\n📂 Total Workspaces: ${allWorkspaces.length}`);

    // Get completed workspaces
    const completedWorkspaces = await Workspace.find({
      freelancer: user._id,
      status: 'completed'
    }).populate('project', 'title');
    console.log(`✅ Completed Workspaces: ${completedWorkspaces.length}`);

    console.log('\n📋 Workspace Status Breakdown:');
    const statusCounts = {};
    allWorkspaces.forEach(ws => {
      statusCounts[ws.status] = (statusCounts[ws.status] || 0) + 1;
    });
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });

    if (completedWorkspaces.length > 0) {
      console.log('\n📝 Completed Projects:');
      completedWorkspaces.forEach((ws, index) => {
        console.log(`  ${index + 1}. ${ws.project?.title || 'Unknown Project'} (Status: ${ws.status})`);
      });
    }

    console.log('\n📊 FINAL STATS:');
    console.log(`  Total Earnings: ₹${totalEarnings.toLocaleString()}`);
    console.log(`  Completed Projects: ${completedWorkspaces.length}`);
    console.log(`  Hours Worked: 0 (not tracked yet)`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

// Get email from command line or use default
const email = process.argv[2] || 'jeevanjiji2003@gmail.com';
console.log(`\n🔍 Checking stats for: ${email}\n`);
checkFreelancerStats(email);
