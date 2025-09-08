// Test script to check applications in the database
require('dotenv').config();
const mongoose = require('mongoose');
const Application = require('./models/Application');
const Project = require('./models/Project');
const User = require('./models/User');

async function checkApplications() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all applications
    const applications = await Application.find()
      .populate('project', 'title')
      .populate('freelancer', 'fullName email')
      .populate('client', 'fullName email');

    console.log('\n📊 Applications in database:');
    console.log('Total applications:', applications.length);

    applications.forEach((app, index) => {
      console.log(`\n${index + 1}. Application ID: ${app._id}`);
      console.log(`   Project: ${app.project?.title || 'Unknown'}`);
      console.log(`   Freelancer: ${app.freelancer?.fullName || 'Unknown'} (${app.freelancer?.email})`);
      console.log(`   Client: ${app.client?.fullName || 'Unknown'} (${app.client?.email})`);
      console.log(`   Status: ${app.status}`);
      console.log(`   Proposed Rate: Rs.${app.proposedRate}`);
      console.log(`   Created: ${app.createdAt}`);
    });

    // Get all projects
    const projects = await Project.find().populate('client', 'fullName email');
    console.log('\n📋 Projects in database:');
    console.log('Total projects:', projects.length);

    projects.forEach((project, index) => {
      console.log(`\n${index + 1}. Project ID: ${project._id}`);
      console.log(`   Title: ${project.title}`);
      console.log(`   Client: ${project.client?.fullName || 'Unknown'} (${project.client?.email})`);
      console.log(`   Status: ${project.status}`);
      console.log(`   Budget: Rs.${project.budgetAmount} (${project.budgetType})`);
    });

    // Get all users
    const users = await User.find({}, 'fullName email userType');
    console.log('\n👥 Users in database:');
    console.log('Total users:', users.length);

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.fullName} (${user.email}) - ${user.userType}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkApplications();
