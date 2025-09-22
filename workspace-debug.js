// Test workspace access for freelancer
// This helps debug the white screen issue

console.log('Testing workspace access...');

// Test URL: http://localhost:5000/api/workspaces/project/{projectId}
// Expected: Should return workspace data for freelancer

const testWorkspaceAccess = async (projectId, token) => {
  try {
    const response = await fetch(`http://localhost:5000/api/workspaces/project/${projectId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);

    if (!response.ok) {
      console.error('Error:', data.message);
      return null;
    }

    return data.data;
  } catch (error) {
    console.error('Network error:', error);
    return null;
  }
};

// To test: 
// 1. Get freelancer token from localStorage
// 2. Get projectId from accepted application
// 3. Call testWorkspaceAccess(projectId, token)