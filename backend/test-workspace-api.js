const mongoose = require('mongoose');
const fetch = require('node-fetch'); // You might need to install this with npm install node-fetch

const testWorkspaceAPI = async () => {
  try {
    const projectId = '68bfbf6bb2f9e961443b7481';
    
    // You'll need to get a valid JWT token for testing
    // For now, let's just test the route directly without authentication
    console.log(`🔍 Testing workspace API for project: ${projectId}`);
    
    const response = await fetch(`http://localhost:5000/api/workspaces/project/${projectId}`, {
      headers: {
        'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE', // Replace with actual token
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Success:', data);
    } else {
      const errorText = await response.text();
      console.log('❌ Error:', errorText);
    }
  } catch (error) {
    console.error('❌ Request failed:', error);
  }
};

testWorkspaceAPI();