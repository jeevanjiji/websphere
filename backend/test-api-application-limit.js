const mongoose = require('mongoose');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('./server');
const User = require('./models/User');
const Project = require('./models/Project');
const Application = require('./models/Application');

// Test the API endpoint directly
async function testApplicationAPI() {
  try {
    await mongoose.connect('mongodb://localhost:27017/websphere', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('🔥 Testing Application API Endpoint...\n');

    // Find the test freelancer we created earlier
    const freelancer = await User.findOne({ role: 'freelancer', email: 'test.freelancer@email.com' });
    if (!freelancer) {
      console.log('❌ Test freelancer not found. Run the previous test first.');
      return;
    }

    // Generate a token for the freelancer
    const token = jwt.sign(
      { 
        userId: freelancer._id, 
        role: freelancer.role 
      }, 
      process.env.JWT_SECRET || 'default_secret_key',
      { expiresIn: '24h' }
    );

    // Find an open project to apply to
    const openProject = await Project.findOne({ status: 'open' });
    if (!openProject) {
      console.log('❌ No open project found. Creating one...');
      
      const client = await User.findOne({ role: 'client', email: 'test.client@email.com' });
      const newProject = new Project({
        title: 'API Test Project',
        description: 'Project for testing API endpoint',
        client: client._id,
        budgetAmount: 1500,
        budgetType: 'fixed',
        categoryName: 'Web Development',
        skillsRequired: ['JavaScript'],
        status: 'open'
      });
      await newProject.save();
      console.log('✅ Created open test project');
      projectToApplyTo = newProject;
    } else {
      projectToApplyTo = openProject;
    }

    // Check current ongoing projects
    const currentOngoing = await Application.countDocuments({
      freelancer: freelancer._id,
      status: { $in: ['accepted', 'awarded'] }
    });
    
    console.log(`📊 Current ongoing projects: ${currentOngoing}`);
    console.log(`📋 Attempting to apply to project: ${projectToApplyTo.title}`);

    // Make the API request
    const response = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${token}`)
      .send({
        projectId: projectToApplyTo._id,
        coverLetter: 'This application should fail due to 5-project limit',
        proposedRate: 1200,
        proposedTimeline: '3 weeks',
        experience: 'Test experience'
      });

    console.log(`\n🌐 API Response Status: ${response.status}`);
    console.log(`📝 API Response Body:`, response.body);

    if (response.status === 400 && response.body.message.includes('cannot apply to more than 5 projects')) {
      console.log('✅ TEST PASSED: API correctly blocked the 6th application');
      console.log('✅ Error message is appropriate and informative');
    } else if (response.status === 201) {
      console.log('⚠️  TEST FAILED: API allowed the 6th application (should have been blocked)');
    } else {
      console.log('⚠️  Unexpected response - check the details above');
    }

    console.log('\n🎯 API Test Summary:');
    console.log(`- Freelancer has ${currentOngoing} ongoing projects`);
    console.log(`- API endpoint: POST /api/applications`);
    console.log(`- Expected result: 400 Bad Request with limit message ✅`);

  } catch (error) {
    console.error('❌ Error during API test:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the test
testApplicationAPI();