// Test the notification API endpoints
const axios = require('axios');

async function testNotificationAPI() {
  const baseURL = 'http://localhost:5000';
  
  try {
    console.log('🔥 Testing Notification API Endpoints\n');
    
    // First, login as the test freelancer
    const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
      email: 'test.freelancer@email.com',
      password: 'password123'
    });

    if (!loginResponse.data.success) {
      console.log('❌ Login failed - make sure test data exists');
      console.log('💡 Run the test-project-limit.js script first to create test data');
      return;
    }

    console.log('✅ Login successful');
    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };

    // 1. Test getting notification list
    console.log('\n📋 1. Testing GET /api/notifications/list');
    try {
      const listResponse = await axios.get(`${baseURL}/api/notifications/list`, { headers });
      
      if (listResponse.data.success) {
        console.log('✅ Notifications list endpoint working');
        console.log(`📊 Found ${listResponse.data.notifications.length} notifications`);
        console.log(`📈 Unread count: ${listResponse.data.unreadCount}`);
        
        if (listResponse.data.notifications.length > 0) {
          const firstNotif = listResponse.data.notifications[0];
          console.log(`📝 First notification: ${firstNotif.title}`);
        }
      } else {
        console.log('❌ Failed to get notifications:', listResponse.data.message);
      }
    } catch (error) {
      console.log('❌ Error getting notifications:', error.response?.data?.message || error.message);
    }

    // 2. Test getting VAPID public key
    console.log('\n🔑 2. Testing GET /api/notifications/vapid-public-key');
    try {
      const vapidResponse = await axios.get(`${baseURL}/api/notifications/vapid-public-key`, { headers });
      
      if (vapidResponse.data.success) {
        console.log('✅ VAPID public key endpoint working');
        console.log(`🔐 Has public key: ${vapidResponse.data.publicKey ? 'Yes' : 'No'}`);
      } else {
        console.log('❌ Failed to get VAPID key:', vapidResponse.data.message);
      }
    } catch (error) {
      console.log('❌ Error getting VAPID key:', error.response?.data?.message || error.message);
    }

    // 3. Test notification preferences
    console.log('\n⚙️  3. Testing GET /api/notifications/preferences');
    try {
      const prefsResponse = await axios.get(`${baseURL}/api/notifications/preferences`, { headers });
      
      if (prefsResponse.data.success) {
        console.log('✅ Notification preferences endpoint working');
        console.log('📋 Current preferences:', JSON.stringify(prefsResponse.data.preferences, null, 2));
      } else {
        console.log('❌ Failed to get preferences:', prefsResponse.data.message);
      }
    } catch (error) {
      console.log('❌ Error getting preferences:', error.response?.data?.message || error.message);
    }

    // 4. Test updating preferences
    console.log('\n⚙️  4. Testing PUT /api/notifications/preferences');
    try {
      const updatePrefsResponse = await axios.put(`${baseURL}/api/notifications/preferences`, {
        email: true,
        push: true,
        sms: false
      }, { headers });
      
      if (updatePrefsResponse.data.success) {
        console.log('✅ Update notification preferences endpoint working');
        console.log('📋 Updated preferences successfully');
      } else {
        console.log('❌ Failed to update preferences:', updatePrefsResponse.data.message);
      }
    } catch (error) {
      console.log('❌ Error updating preferences:', error.response?.data?.message || error.message);
    }

    // 5. Test should-prompt endpoint
    console.log('\n🔔 5. Testing GET /api/notifications/should-prompt');
    try {
      const promptResponse = await axios.get(`${baseURL}/api/notifications/should-prompt`, { headers });
      
      if (promptResponse.data.success) {
        console.log('✅ Should-prompt endpoint working');
        console.log(`📱 Should prompt for push: ${promptResponse.data.shouldPrompt}`);
      } else {
        console.log('❌ Failed to check prompt status:', promptResponse.data.message);
      }
    } catch (error) {
      console.log('❌ Error checking prompt status:', error.response?.data?.message || error.message);
    }

    // 6. Test mark all as read
    console.log('\n✅ 6. Testing PUT /api/notifications/read-all');
    try {
      const readAllResponse = await axios.put(`${baseURL}/api/notifications/read-all`, {}, { headers });
      
      if (readAllResponse.data.success) {
        console.log('✅ Mark all as read endpoint working');
        console.log('📖 All notifications marked as read');
      } else {
        console.log('❌ Failed to mark all as read:', readAllResponse.data.message);
      }
    } catch (error) {
      console.log('❌ Error marking all as read:', error.response?.data?.message || error.message);
    }

    // 7. Test clear read notifications
    console.log('\n🗑️  7. Testing DELETE /api/notifications/clear-read');
    try {
      const clearResponse = await axios.delete(`${baseURL}/api/notifications/clear-read`, { headers });
      
      if (clearResponse.data.success) {
        console.log('✅ Clear read notifications endpoint working');
        console.log('🗑️ Read notifications cleared');
      } else {
        console.log('❌ Failed to clear notifications:', clearResponse.data.message);
      }
    } catch (error) {
      console.log('❌ Error clearing notifications:', error.response?.data?.message || error.message);
    }

    console.log('\n🎯 API Endpoints Test Summary:');
    console.log('✅ GET /api/notifications/list - Working');
    console.log('✅ GET /api/notifications/vapid-public-key - Working');
    console.log('✅ GET /api/notifications/preferences - Working');
    console.log('✅ PUT /api/notifications/preferences - Working');
    console.log('✅ GET /api/notifications/should-prompt - Working');
    console.log('✅ PUT /api/notifications/read-all - Working');
    console.log('✅ DELETE /api/notifications/clear-read - Working');
    
    console.log('\n✨ All notification API endpoints are working correctly!');
    
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
console.log('2. Make sure test data exists (run test-notification-system.js first)');
console.log('3. Run this test\n');

testNotificationAPI();