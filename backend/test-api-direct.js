const fetch = require('node-fetch');

async function testApproval() {
  try {
    const response = await fetch('http://localhost:5000/api/workspaces/68c99cda3607cf5b8fa057ca/milestones/68cb02ea89317b15d4750412', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODkzOTlmMTFjNzVhYjEzZmJlNzk3MzAiLCJyb2xlIjoiY2xpZW50IiwiaWF0IjoxNzMwNTI5MzQ1LCJleHAiOjE3MzEzOTMzNDV9.YOBh3A0yJA6LjIcNDc8gUKDcPBK3TpYI9zGfZCJ1Ycs'
      },
      body: JSON.stringify({
        status: 'approved',
        reviewNotes: 'Test approval'
      })
    });
    
    const data = await response.json();
    console.log('Response:', data);
  } catch (error) {
    console.error('Error:', error);
  }
}

testApproval();