// Test script to debug workspace access issue
const PROJECT_ID = '68abd8cf01531cb32f022544';
const APPLICATION_ID = '68c99ca13607cf5b8fa0579e';
const API_BASE = 'http://localhost:5000/api';

console.log('🔍 Testing workspace access...');
console.log('Project ID:', PROJECT_ID);
console.log('Application ID:', APPLICATION_ID);

// You would need to get the JWT token from your browser's localStorage
// For now, we'll test without auth to see the response
async function testWorkspaceAccess() {
  try {
    console.log('\n📡 Testing workspace endpoint...');
    const response = await fetch(`${API_BASE}/workspaces/project/${PROJECT_ID}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
        // Note: No Authorization header - this should return 401
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    const data = await response.json();
    console.log('Response data:', data);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testWorkspaceAccess();