// Test script to create sample overdue milestones
const mongoose = require('mongoose');
const User = require('./models/User');
const Project = require('./models/Project');
const Workspace = require('./models/Workspace');
const Milestone = require('./models/Milestone');
const DueDateNotificationJob = require('./jobs/dueDateNotifications');

async function createTestData() {
  try {
    await mongoose.connect('mongodb://localhost:27017/websphere');
    console.log('✅ Connected to MongoDB');

    // Find existing users
    const client = await User.findOne({ role: 'client' });
    const freelancer = await User.findOne({ role: 'freelancer' });

    if (!client || !freelancer) {
      console.log('❌ Need at least one client and one freelancer in the database');
      return;
    }

    console.log(`👤 Client: ${client.fullName} (${client.email})`);
    console.log(`👤 Freelancer: ${freelancer.fullName} (${freelancer.email})`);

    // Find or create a project
    let project = await Project.findOne({ client: client._id });
    if (!project) {
      project = await Project.create({
        title: 'Test Overdue Project',
        description: 'A test project to check overdue notifications',
        budgetAmount: 5000,
        timeframe: 'within 1 month',
        client: client._id,
        status: 'open',
        skillsRequired: ['JavaScript', 'React']
      });
      console.log('✅ Created test project');
    }

    // Create an application first
    const Application = require('./models/Application');
    let application = await Application.findOne({ 
      project: project._id, 
      freelancer: freelancer._id 
    });
    
    if (!application) {
      application = await Application.create({
        project: project._id,
        client: client._id,
        freelancer: freelancer._id,
        proposal: 'Test application for overdue notifications',
        coverLetter: 'Test cover letter for overdue notifications test case',
        proposedRate: 5000,
        proposedTimeline: 'within 1 month',
        status: 'accepted'
      });
      console.log('✅ Created test application');
    }

    // Find or create a workspace
    let workspace = await Workspace.findOne({ project: project._id });
    if (!workspace) {
      workspace = await Workspace.create({
        project: project._id,
        client: client._id,
        freelancer: freelancer._id,
        application: application._id
      });
      console.log('✅ Created test workspace');
    }

    // Create overdue milestone
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1); // 1 day ago

    const paymentOverdue = new Date();
    paymentOverdue.setDate(paymentOverdue.getDate() - 2); // 2 days ago

    let milestone = await Milestone.findOne({ workspace: workspace._id });
    if (!milestone) {
      milestone = await Milestone.create({
        workspace: workspace._id,
        title: 'Test Overdue Milestone',
        description: 'A milestone that is overdue for testing',
        order: 1,
        amount: 2500,
        dueDate: yesterday,
        paymentDueDate: paymentOverdue,
        status: 'in-progress',
        createdBy: client._id,
        overdueNotificationSent: false,
        paymentOverdueNotificationSent: false
      });
      console.log('✅ Created overdue milestone');
    } else {
      // Update existing milestone to be overdue
      milestone.dueDate = yesterday;
      milestone.paymentDueDate = paymentOverdue;
      milestone.status = 'in-progress';
      milestone.overdueNotificationSent = false;
      milestone.paymentOverdueNotificationSent = false;
      await milestone.save();
      console.log('✅ Updated milestone to be overdue');
    }

    console.log('\n📋 Test data ready:');
    console.log(`   Milestone: ${milestone.title}`);
    console.log(`   Due Date: ${milestone.dueDate.toLocaleDateString()} (OVERDUE)`);
    console.log(`   Payment Due: ${milestone.paymentDueDate.toLocaleDateString()} (OVERDUE)`);
    console.log(`   Status: ${milestone.status}`);

    // Now run the notification check
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

createTestData();