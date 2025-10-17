// Manual Test for Project Application Limit
// Run this after starting the backend server (npm run dev)

const axios = require('axios');

async function manualAPITest() {
  const baseURL = 'http://localhost:5000';
  
  try {
    console.log('🔥 Manual API Test for Project Application Limit\n');
    
    // First, login as the test freelancer
    const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
      email: 'test.freelancer@email.com',
      password: 'password123'
    });

    if (loginResponse.data.success) {
      console.log('✅ Login successful');
      const token = loginResponse.data.token;
      
      // Get available projects
      const projectsResponse = await axios.get(`${baseURL}/api/projects/browse`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (projectsResponse.data.success && projectsResponse.data.projects.length > 0) {
        const project = projectsResponse.data.projects[0];
        console.log(`📋 Found project to apply to: ${project.title}`);
        
        // Try to apply to the project (this should fail if freelancer has 5 ongoing projects)
        try {
          const applicationResponse = await axios.post(`${baseURL}/api/applications`, {
            projectId: project._id,
            coverLetter: 'Testing the 5-project limit feature',
            proposedRate: 1000,
            proposedTimeline: '2 weeks',
            experience: 'Test experience'
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (applicationResponse.data.success) {
            console.log('⚠️  Application was accepted - this might mean freelancer has < 5 projects');
            console.log('📝 Response:', applicationResponse.data.message);
          }
          
        } catch (error) {
          if (error.response && error.response.status === 400) {
            console.log('✅ Application was blocked as expected');
            console.log('📝 Error message:', error.response.data.message);
            if (error.response.data.message.includes('cannot apply to more than 5 projects')) {
              console.log('✅ ERROR MESSAGE IS CORRECT');
            }
            if (error.response.data.ongoingProjectsCount) {
              console.log(`📊 Ongoing projects count: ${error.response.data.ongoingProjectsCount}`);
            }
          } else {
            console.log('❌ Unexpected error:', error.message);
          }
        }
        
      } else {
        console.log('❌ No projects available for testing');
      }
      
    } else {
      console.log('❌ Login failed - make sure test data exists');
      console.log('💡 Run the test-project-limit.js script first to create test data');
    }
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Cannot connect to server. Make sure backend is running on port 5000');
      console.log('💡 Run: npm run dev in backend directory');
    } else {
      console.log('❌ Error:', error.message);
    }
  }
}

// Instructions
console.log('📋 INSTRUCTIONS:');
console.log('1. Make sure backend server is running (npm run dev)');
console.log('2. Make sure test data exists (run test-project-limit.js first)');
console.log('3. Run this test\n');

manualAPITest();