const fetch = require('node-fetch');

async function testMilestoneApproval() {
  try {
    // Login first to get a token
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'jeevanjiji2026@mca.ajce.in',
        password: 'password' // Use the actual password
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login response:', loginData.success ? 'Success' : 'Failed');
    
    if (!loginData.success) {
      console.log('Login failed:', loginData.message);
      return;
    }
    
    const token = loginData.token;
    
    // Now try to approve a milestone
    const milestoneId = '68cb057234ec1c99d404380f'; // Use the ID from our test
    const workspaceId = '68c99cda3607cf5b8fa057ca'; // Use the workspace ID from logs
    
    const approvalResponse = await fetch(`http://localhost:5000/api/workspaces/${workspaceId}/milestones/${milestoneId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        status: 'approved',
        reviewNotes: 'Test approval from API'
      })
    });
    
    const approvalData = await approvalResponse.json();
    console.log('Approval response:', approvalData);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testMilestoneApproval();