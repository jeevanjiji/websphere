// Test calling the notification trigger endpoint
const axios = require('axios');

async function testNotificationTrigger() {
  try {
    console.log('🧪 Testing notification trigger endpoint...');
    
    // First, let's log in as the test client to get a token
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'client@test.com',
      password: 'password123'
    });

    if (!loginResponse.data.success) {
      console.log('❌ Login failed:', loginResponse.data.message);
      return;
    }

    const token = loginResponse.data.token;
    console.log('✅ Logged in successfully');

    // Now trigger the notification check
    const triggerResponse = await axios.post(
      'http://localhost:5000/api/notifications/trigger-due-date-check',
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    console.log('📬 Notification trigger response:', triggerResponse.data);

    // Get notifications for the client
    const notificationsResponse = await axios.get(
      'http://localhost:5000/api/notifications',
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    console.log('📋 Client notifications:', notificationsResponse.data);

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testNotificationTrigger();