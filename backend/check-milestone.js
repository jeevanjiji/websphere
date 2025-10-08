// Check the actual milestone created
const mongoose = require('mongoose');
const Milestone = require('./models/Milestone');
const Workspace = require('./models/Workspace');
const User = require('./models/User');
const Project = require('./models/Project');

async function checkMilestone() {
  try {
    await mongoose.connect('mongodb://localhost:27017/websphere');
    console.log('✅ Connected to MongoDB');

    const milestones = await Milestone.find({}).populate({
      path: 'workspace',
      populate: [
        { path: 'client', model: 'User' },
        { path: 'freelancer', model: 'User' },
        { path: 'project', model: 'Project' }
      ]
    });

    console.log(`\n📋 Found ${milestones.length} milestones:`);
    for (const milestone of milestones) {
      console.log(`   Title: ${milestone.title}`);
      console.log(`   Status: "${milestone.status}"`);
      console.log(`   Due Date: ${milestone.dueDate}`);
      console.log(`   Workspace: ${milestone.workspace ? 'EXISTS' : 'MISSING'}`);
      if (milestone.workspace) {
        console.log(`   Client: ${milestone.workspace.client?.fullName || 'MISSING'}`);
        console.log(`   Freelancer: ${milestone.workspace.freelancer?.fullName || 'MISSING'}`);
      }
      console.log('   ---');
    }

    // Test the query used in notification job
    const queryResult = await Milestone.find({
      status: { $in: ['pending', 'in_progress', 'approved'] }
    }).populate({
      path: 'workspace',
      populate: [
        { path: 'client', model: 'User' },
        { path: 'freelancer', model: 'User' },
        { path: 'project', model: 'Project' }
      ]
    });

    console.log(`\n🔍 Query result: ${queryResult.length} milestones match the notification criteria`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

checkMilestone();