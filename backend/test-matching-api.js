// Test the matching API directly
require('dotenv').config();
const jwt = require('jsonwebtoken');
const https = require('https');
const http = require('http');

async function testMatchingAPI() {
  try {
    // Generate a test token
    const token = jwt.sign(
      { userId: '6893a5a689a2b96e568ca086', role: 'freelancer' },
      process.env.JWT_SECRET || 'your_jwt_secret_key',
      { expiresIn: '1h' }
    );

    console.log('🔑 Generated token for user: 6893a5a689a2b96e568ca086');

    // Test the matching API
    const response = await fetch('http://localhost:5000/api/matching/projects/6893a5a689a2b96e568ca086?limit=10', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', response.headers.raw());

    const data = await response.text();
    console.log('📊 Response body:', data);

    if (response.ok) {
      const jsonData = JSON.parse(data);
      console.log('✅ Success! Found', jsonData.data?.projects?.length || 0, 'recommendations');
    } else {
      console.error('❌ API Error:', response.status, data);
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testMatchingAPI();