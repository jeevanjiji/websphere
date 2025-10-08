// Test freelancer notifications API
const axios = require('axios');

async function testFreelancerNotifications() {
  try {
    console.log('🧪 Testing freelancer notifications...');
    
    // Login as freelancer
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'freelancer@test.com',
      password: 'password123'
    });

    if (!loginResponse.data.success) {
      console.log('❌ Freelancer login failed. Let\'s try to create the user...');
      
      // Register freelancer
      try {
        const registerResponse = await axios.post('http://localhost:5000/api/auth/register', {
          fullName: 'Test Freelancer',
          email: 'freelancer@test.com',
          password: 'password123',
          role: 'freelancer'
        });
        console.log('✅ Freelancer registered:', registerResponse.data);
      } catch (regError) {
        console.log('Registration response:', regError.response?.data);
      }
      return;
    }

    const token = loginResponse.data.token;
    console.log('✅ Freelancer logged in successfully');
    console.log('User info:', loginResponse.data.user);

    // Get notifications
    const notificationsResponse = await axios.get(
      'http://localhost:5000/api/notifications/list',
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    console.log('📋 Freelancer notifications response:', JSON.stringify(notificationsResponse.data, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testFreelancerNotifications();