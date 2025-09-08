// Test script to directly test the API endpoint
require('dotenv').config();
const jwt = require('jsonwebtoken');

async function testAPIEndpoint() {
  try {
    // Generate a fresh JWT token for the freelancer user
    const freelancerUserId = '6893a5a689a2b96e568ca086'; // From previous test
    const token = jwt.sign(
      { userId: freelancerUserId, role: 'freelancer' },
      process.env.JWT_SECRET || 'your_jwt_secret_key',
      { expiresIn: '24h' }
    );

    console.log('🔑 Using token for freelancer user:', freelancerUserId);

    // Test the freelancer applications API endpoint
    const url = `http://localhost:5000/api/applications/my`;
    
    console.log('📡 Testing freelancer applications API endpoint:', url);

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📊 Response status:', response.status);
    console.log('📋 Response headers:', Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log('📄 Response data:', JSON.stringify(data, null, 2));

  } catch (error) {
    console.error('❌ Error testing API:', error);
  }
}

testAPIEndpoint();
