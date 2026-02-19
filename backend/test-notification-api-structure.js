// Test API call to check notification structure
const axios = require('axios');

const testNotificationAPI = async () => {
  try {
    console.log('🧪 Testing Notification API Response Structure\n');
    
    // You need to get a valid JWT token first
    console.log('⚠️  To run this test, you need to:');
    console.log('1. Login to the app to get a JWT token');
    console.log('2. Replace TOKEN_HERE with your actual token');
    console.log('3. Uncomment the axios call below\n');
    
    // Uncomment and add real token to test:
    /*
    const response = await axios.get('http://localhost:5000/api/notifications/list', {
      headers: {
        'Authorization': 'Bearer TOKEN_HERE'
      }
    });
    
    console.log('📱 API Response:');
    console.log('Success:', response.data.success);
    console.log('Unread Count:', response.data.unreadCount);
    console.log('Notifications count:', response.data.notifications.length);
    
    if (response.data.notifications.length > 0) {
      const sample = response.data.notifications[0];
      console.log('\n📋 Sample notification structure:');
      console.log('Keys:', Object.keys(sample));
      console.log('Full object:', JSON.stringify(sample, null, 2));
    }
    */
    
    console.log('💡 Expected structure based on backend code:');
    console.log(JSON.stringify({
      _id: "notification_id",
      userId: "user_id",
      userRole: "client|freelancer",
      type: "payment|deliverable|etc",
      title: "Notification title",
      body: "Notification message",
      data: {
        workspaceId: "workspace_id",
        milestoneId: "milestone_id",
        extraData: {}
      },
      read: false,
      createdAt: "timestamp",
      updatedAt: "timestamp"
    }, null, 2));
    
    console.log('\n🔧 Frontend should access workspace ID as:');
    console.log('- notification.data.workspaceId (most common)');
    console.log('- notification.workspaceId (if directly set)');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

testNotificationAPI();