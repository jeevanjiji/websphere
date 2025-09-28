require('dotenv').config();
const axios = require('axios');

async function testAPIUpdate() {
  try {
    // First, get a token (you'll need to replace these credentials with valid ones)
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'jeevanjiji@gmail.com', // Replace with actual freelancer email
      password: 'qwerty' // Replace with actual password
    });
    
    const token = loginResponse.data.token;
    console.log('Login successful, token received');

    // Get workspace ID (replace with actual workspace ID)
    const workspaceId = '68c99cda3607cf5b8fa057ca'; // From the screenshot URL
    
    // Get milestones to find one to edit
    const milestonesResponse = await axios.get(`http://localhost:5000/api/workspaces/${workspaceId}/milestones`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const milestones = milestonesResponse.data.data || milestonesResponse.data.milestones || [];
    console.log('Found milestones:', milestones.length);
    
    // Find an editable milestone
    const editableMilestone = milestones.find(m => 
      m.status !== 'approved' && m.status !== 'paid' && m.status !== 'payment-overdue'
    );
    
    if (!editableMilestone) {
      console.log('No editable milestones found');
      return;
    }
    
    console.log('Found editable milestone:', {
      id: editableMilestone._id,
      title: editableMilestone.title,
      status: editableMilestone.status
    });
    
    // Try to update it
    const updateData = {
      title: `API Test: ${editableMilestone.title}`,
      description: `Updated via API: ${editableMilestone.description}`,
      amount: editableMilestone.amount + 50
    };
    
    console.log('Sending update request with data:', updateData);
    
    const updateResponse = await axios.put(
      `http://localhost:5000/api/workspaces/${workspaceId}/milestones/${editableMilestone._id}`,
      updateData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Update response:', updateResponse.data);
    
    // Fetch milestones again to verify
    const updatedMilestonesResponse = await axios.get(`http://localhost:5000/api/workspaces/${workspaceId}/milestones`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const updatedMilestones = updatedMilestonesResponse.data.data || updatedMilestonesResponse.data.milestones || [];
    const updatedMilestone = updatedMilestones.find(m => m._id === editableMilestone._id);
    
    console.log('Updated milestone from API:', {
      id: updatedMilestone._id,
      title: updatedMilestone.title,
      description: updatedMilestone.description,
      amount: updatedMilestone.amount
    });
    
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

testAPIUpdate();