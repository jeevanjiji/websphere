// backend/scripts/createTestFreelancers.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const createTestFreelancers = async () => {
  try {
    // Connect to database using lowercase to match existing data
    const mongoUri = process.env.MONGODB_URI.replace('/WebSphere?', '/websphere?');
    await mongoose.connect(mongoUri);
    
    console.log('Connected to MongoDB');
    
    // Test freelancers with different ratings
    const testFreelancers = [
      {
        fullName: 'John Low Rating',
        email: 'john.low@test.com',
        password: await bcrypt.hash('password123', 10),
        role: 'freelancer',
        rating: { average: 2.1, count: 5 },
        completedProjects: 3,
        skills: ['JavaScript', 'React'],
        bio: 'Frontend developer with low rating'
      },
      {
        fullName: 'Jane Below Average',
        email: 'jane.below@test.com',
        password: await bcrypt.hash('password123', 10),
        role: 'freelancer',
        rating: { average: 2.4, count: 8 },
        completedProjects: 5,
        skills: ['Python', 'Django'],
        bio: 'Backend developer below minimum rating'
      },
      {
        fullName: 'Bob Good Rating',
        email: 'bob.good@test.com',
        password: await bcrypt.hash('password123', 10),
        role: 'freelancer',
        rating: { average: 4.2, count: 12 },
        completedProjects: 8,
        skills: ['Full Stack', 'Node.js'],
        bio: 'Experienced full-stack developer'
      },
      {
        fullName: 'Alice No Rating',
        email: 'alice.none@test.com',
        password: await bcrypt.hash('password123', 10),
        role: 'freelancer',
        rating: { average: 0, count: 0 },
        completedProjects: 0,
        skills: ['Design', 'UI/UX'],
        bio: 'New freelancer with no completed projects'
      },
      {
        fullName: 'Mike Marginal',
        email: 'mike.marginal@test.com',
        password: await bcrypt.hash('password123', 10),
        role: 'freelancer',
        rating: { average: 2.5, count: 4 },
        completedProjects: 2,
        skills: ['Mobile Development', 'React Native'],
        bio: 'Mobile developer at minimum rating threshold'
      }
    ];

    console.log('Creating test freelancers...');
    
    for (const freelancerData of testFreelancers) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: freelancerData.email });
      
      if (existingUser) {
        console.log(`Freelancer ${freelancerData.email} already exists, skipping...`);
        continue;
      }

      const freelancer = new User(freelancerData);
      await freelancer.save();
      
      console.log(`✅ Created freelancer: ${freelancerData.fullName} (${freelancerData.email})`);
      console.log(`   Rating: ${freelancerData.rating.average}/5.0 (${freelancerData.rating.count} reviews)`);
      console.log(`   Projects: ${freelancerData.completedProjects}`);
    }
    
    console.log('\n🎉 Test freelancers created successfully!');
    console.log('\nFreelancers that should be deactivated (rating < 2.5):');
    console.log('- John Low Rating (2.1/5.0)');
    console.log('- Jane Below Average (2.4/5.0)');
    console.log('\nFreelancers with good standing:');
    console.log('- Bob Good Rating (4.2/5.0)');
    console.log('- Mike Marginal (2.5/5.0 - exactly at threshold)');
    console.log('- Alice No Rating (0/5.0 - new user, no projects)');
    
  } catch (error) {
    console.error('❌ Error creating test freelancers:', error);
  } finally {
    process.exit(0);
  }
};

createTestFreelancers();
