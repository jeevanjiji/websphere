require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('./models/Project');
const User = require('./models/User');

async function checkProjects() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Check all projects
    const allProjects = await Project.find({}).populate('client', 'fullName email');
    console.log('\n📊 ALL PROJECTS:');
    console.log('Total projects:', allProjects.length);
    
    if (allProjects.length > 0) {
      console.log('\n📋 Project Details:');
      allProjects.forEach((project, index) => {
        console.log(`${index + 1}. ${project.title}`);
        console.log(`   Status: ${project.status}`);
        console.log(`   Budget: ₹${project.budgetAmount} (${project.budgetType})`);
        console.log(`   Skills: ${project.skills?.join(', ') || 'None'}`);
        console.log(`   Client: ${project.client?.fullName || 'Unknown'}`);
        console.log(`   Created: ${project.createdAt}`);
        console.log('');
      });
    }
    
    // Check open projects specifically
    const openProjects = await Project.find({ status: 'open' });
    console.log(`\n🎯 OPEN PROJECTS: ${openProjects.length}`);
    
    // Check project statuses
    const statusCounts = await Project.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    console.log('\n📈 PROJECT STATUS BREAKDOWN:');
    statusCounts.forEach(status => {
      console.log(`${status._id}: ${status.count}`);
    });
    
    // Check freelancers and their skills
    const freelancers = await User.find({ role: 'freelancer' }).select('fullName email profile.skills');
    console.log(`\n👥 FREELANCERS: ${freelancers.length}`);
    if (freelancers.length > 0) {
      console.log('\n🔧 Freelancer Skills:');
      freelancers.forEach((freelancer, index) => {
        console.log(`${index + 1}. ${freelancer.fullName}`);
        console.log(`   Skills: ${freelancer.profile?.skills?.join(', ') || 'No skills set'}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkProjects();