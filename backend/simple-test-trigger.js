// Simple test to trigger notifications
const axios = require('axios');

async function testTrigger() {
  try {
    console.log('🧪 Triggering notification check...');
    
    const response = await axios.post('http://localhost:5000/api/notifications/trigger-due-date-check');
    console.log('📬 Response:', response.data);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testTrigger();