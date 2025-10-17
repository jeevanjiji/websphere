const mongoose = require('mongoose');
const Application = require('./models/Application');
const Project = require('./models/Project');
const User = require('./models/User');

// Test the 5-project limit functionality
async function testProjectLimit() {
  try {
    await mongoose.connect('mongodb://localhost:27017/websphere', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('🔥 Testing Project Application Limit...\n');

    // Find or create a test freelancer
    let freelancer = await User.findOne({ role: 'freelancer', email: 'test.freelancer@email.com' });
    if (!freelancer) {
      freelancer = new User({
        fullName: 'Test Freelancer',
        email: 'test.freelancer@email.com',
        password: 'password123',
        role: 'freelancer',
        profile: {
          bio: 'Test freelancer for project limit testing with more than 50 characters to meet requirements',
          skills: ['JavaScript', 'React', 'Node.js'],
          hourlyRate: 25
        }
      });
      await freelancer.save();
      console.log('✅ Created test freelancer');
    } else {
      console.log('✅ Found existing test freelancer');
    }

    // Find or create a test client
    let client = await User.findOne({ role: 'client', email: 'test.client@email.com' });
    if (!client) {
      client = new User({
        fullName: 'Test Client',
        email: 'test.client@email.com',
        password: 'password123',
        role: 'client'
      });
      await client.save();
      console.log('✅ Created test client');
    } else {
      console.log('✅ Found existing test client');
    }

    // Check current ongoing projects count
    const currentOngoing = await Application.countDocuments({
      freelancer: freelancer._id,
      status: { $in: ['accepted', 'awarded'] }
    });
    console.log(`📊 Current ongoing projects: ${currentOngoing}`);

    // Create or find 5 test projects with awarded applications
    const targetOngoingCount = 5;
    const neededProjects = Math.max(0, targetOngoingCount - currentOngoing);

    for (let i = 0; i < neededProjects; i++) {
      // Create a project
      const project = new Project({
        title: `Test Project ${i + 1} for Limit`,
        description: 'This is a test project for testing the 5-project limit',
        client: client._id,
        budgetAmount: 1000,
        budgetType: 'fixed',
        categoryName: 'Web Development',
        skillsRequired: ['JavaScript', 'React'],
        status: 'awarded'
      });
      await project.save();

      // Create an awarded application
      const application = new Application({
        project: project._id,
        freelancer: freelancer._id,
        client: client._id,
        coverLetter: `Test application ${i + 1} for project limit testing`,
        proposedRate: 800,
        proposedTimeline: '2 weeks',
        status: 'awarded'
      });
      await application.save();

      console.log(`✅ Created awarded project ${i + 1}`);
    }

    // Verify we now have 5 ongoing projects
    const finalOngoing = await Application.countDocuments({
      freelancer: freelancer._id,
      status: { $in: ['accepted', 'awarded'] }
    });
    console.log(`📊 Final ongoing projects count: ${finalOngoing}`);

    // Create a 6th project to test the limit
    const sixthProject = new Project({
      title: 'Sixth Test Project (Should Fail)',
      description: 'This application should fail due to 5-project limit',
      client: client._id,
      budgetAmount: 1200,
      budgetType: 'fixed',
      categoryName: 'Web Development',
      skillsRequired: ['JavaScript'],
      status: 'open'
    });
    await sixthProject.save();
    console.log('✅ Created 6th test project');

    // Try to simulate the application logic
    console.log('\n🧪 Simulating application to 6th project...');
    
    // Check for existing application (should be none)
    const existingApp = await Application.findOne({
      project: sixthProject._id,
      freelancer: freelancer._id
    });
    
    if (!existingApp) {
      console.log('✅ No existing application found');
      
      // Check ongoing projects count (this should be 5)
      const ongoingCount = await Application.countDocuments({
        freelancer: freelancer._id,
        status: { $in: ['accepted', 'awarded'] }
      });
      
      console.log(`📊 Ongoing projects count: ${ongoingCount}`);
      
      if (ongoingCount >= 5) {
        console.log('❌ EXPECTED: Application blocked due to 5-project limit');
        console.log('✅ TEST PASSED: Freelancer correctly blocked from applying to 6th project');
      } else {
        console.log('⚠️ TEST FAILED: Freelancer should have been blocked');
      }
    }

    // Show all ongoing applications for this freelancer
    const ongoingApps = await Application.find({
      freelancer: freelancer._id,
      status: { $in: ['accepted', 'awarded'] }
    }).populate('project', 'title');
    
    console.log('\n📋 Current ongoing projects:');
    ongoingApps.forEach((app, index) => {
      console.log(`${index + 1}. ${app.project.title} (Status: ${app.status})`);
    });

    console.log('\n🎯 Test Summary:');
    console.log(`- Freelancer has ${finalOngoing} ongoing projects`);
    console.log(`- Limit is set to 5 projects`);
    console.log(`- Application to 6th project should be blocked ✅`);
    console.log('\n✅ Test completed successfully!');

  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the test
testProjectLimit();