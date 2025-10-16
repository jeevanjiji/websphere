// backend/test-matching-system.js
const mongoose = require('mongoose');
require('dotenv').config();

const MatchingEngine = require('./services/matchingEngine');
const MatchingService = require('./services/matchingService');
const User = require('./models/User');
const Project = require('./models/Project');

/**
 * Test script for the AI-powered freelancer matching system
 * Run with: node test-matching-system.js
 */

async function testMatchingSystem() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Test 1: Create sample data
    console.log('\n🔧 Creating test data...');
    const { projectId, freelancerIds } = await createTestData();

    // Test 2: Test matching engine directly
    console.log('\n🎯 Testing Neural Retriever...');
    const matches = await MatchingEngine.matchFreelancersToProject(projectId, {
      limit: 5,
      minScore: 0.3
    });
    
    console.log(`Found ${matches.matches.length} matches:`);
    matches.matches.forEach((match, index) => {
      console.log(`${index + 1}. ${match.freelancer.fullName} - Score: ${(match.totalScore * 100).toFixed(1)}%`);
      console.log(`   Skills: ${(match.scores.skill * 100).toFixed(1)}% | Experience: ${(match.scores.experience * 100).toFixed(1)}% | Rate: ${(match.scores.rate * 100).toFixed(1)}%`);
      console.log(`   Reason: ${match.matchReason}\n`);
    });

    // Test 3: Test matching service
    console.log('🔄 Testing Matching Service...');
    const serviceMatches = await MatchingService.getRecommendedFreelancers(projectId, {
      limit: 3
    });
    console.log(`Service found ${serviceMatches.matches.length} matches (filtered)`);

    // Test 4: Test analytics
    console.log('\n📊 Testing Analytics...');
    const analytics = await MatchingService.getMatchingAnalytics(projectId);
    console.log(`Analytics - Qualified: ${analytics.statistics.qualifiedFreelancers}, Applications: ${analytics.statistics.applications}`);
    console.log(`Recommendations: ${analytics.recommendations.length}`);

    // Test 5: Test reverse matching (projects for freelancer)
    console.log('\n🔄 Testing Reverse Matching...');
    if (freelancerIds.length > 0) {
      const projectRecommendations = await MatchingService.getRecommendedProjects(freelancerIds[0], {
        limit: 3
      });
      console.log(`Found ${projectRecommendations.projects.length} project recommendations`);
    }

    // Test 6: Performance test
    console.log('\n⚡ Performance Test...');
    const startTime = Date.now();
    await MatchingEngine.matchFreelancersToProject(projectId, { limit: 10 });
    const endTime = Date.now();
    console.log(`Matching completed in ${endTime - startTime}ms`);

    console.log('\n✅ All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
  }
}

async function createTestData() {
  // Create test freelancers
  const freelancers = [
    {
      fullName: 'Alice React Developer',
      email: 'alice@test.com',
      password: 'hashedpassword',
      role: 'freelancer',
      skills: ['react', 'javascript', 'node.js', 'mongodb'],
      experienceLevel: 'expert',
      hourlyRate: 75,
      bio: 'Expert React developer with 5+ years experience in full-stack development',
      profileComplete: true,
      portfolio: [
        {
          title: 'E-commerce Platform',
          description: 'Built a full-stack React e-commerce platform',
          technologies: ['react', 'node.js', 'mongodb']
        }
      ]
    },
    {
      fullName: 'Bob Backend Specialist',
      email: 'bob@test.com',
      password: 'hashedpassword',
      role: 'freelancer',
      skills: ['python', 'django', 'postgresql', 'aws'],
      experienceLevel: 'intermediate',
      hourlyRate: 60,
      bio: 'Backend specialist focusing on scalable Python applications',
      profileComplete: true,
      portfolio: [
        {
          title: 'API Development',
          description: 'RESTful APIs for fintech applications',
          technologies: ['python', 'django', 'postgresql']
        }
      ]
    },
    {
      fullName: 'Carol Mobile Developer',
      email: 'carol@test.com',
      password: 'hashedpassword',
      role: 'freelancer',
      skills: ['react-native', 'flutter', 'javascript', 'firebase'],
      experienceLevel: 'expert',
      hourlyRate: 80,
      bio: 'Mobile app developer specializing in cross-platform solutions',
      profileComplete: true
    },
    {
      fullName: 'David Design Expert',
      email: 'david@test.com',
      password: 'hashedpassword',
      role: 'freelancer',
      skills: ['ui/ux', 'figma', 'photoshop', 'prototyping'],
      experienceLevel: 'expert',
      hourlyRate: 70,
      bio: 'UI/UX designer with expertise in modern design systems',
      profileComplete: true
    }
  ];

  // Clean up existing test data
  await User.deleteMany({ email: { $in: freelancers.map(f => f.email) } });
  await Project.deleteMany({ title: 'Test React Project' });

  // Insert freelancers
  const createdFreelancers = await User.insertMany(freelancers);
  const freelancerIds = createdFreelancers.map(f => f._id);

  // Create test client
  let testClient = await User.findOne({ email: 'testclient@test.com' });
  if (!testClient) {
    testClient = await User.create({
      fullName: 'Test Client',
      email: 'testclient@test.com',
      password: 'hashedpassword',
      role: 'client'
    });
  }

  // Create test project
  const testProject = await Project.create({
    client: testClient._id,
    title: 'Test React Project',
    description: 'Build a modern React application with Node.js backend. Need expertise in React, state management, API integration, and responsive design. The project involves creating a dashboard with real-time data updates.',
    skills: ['react', 'javascript', 'node.js', 'css'],
    category: 'frontend-development',
    budgetType: 'hourly',
    budgetAmount: 70,
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    status: 'open'
  });

  console.log(`✅ Created ${freelancers.length} test freelancers and 1 test project`);
  
  return {
    projectId: testProject._id,
    freelancerIds,
    clientId: testClient._id
  };
}

// Run the test if this file is executed directly
if (require.main === module) {
  testMatchingSystem().catch(console.error);
}

module.exports = { testMatchingSystem, createTestData };