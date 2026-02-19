// Test the complete notification flow
console.log('🧪 Testing Complete Notification Flow\n');

// Simulate the API response structure (based on backend populate)
const mockNotificationFromAPI = {
  _id: "68f5215326c6381291bb5c84",
  userId: "6893a5a689a2b96e568ca086",
  userRole: "freelancer",
  type: "payment",
  title: "🎉 Funds Released!",
  body: "Payment has been released for completed milestone",
  data: {
    workspaceId: {
      _id: "68d4c4068b0087370b5e32cc",
      title: "E-commerce Website Development"
    },
    milestoneId: "milestone123",
    extraData: {
      amount: 5000,
      event: "payment_released"
    }
  },
  read: false,
  createdAt: "2024-01-15T12:00:00Z"
};

// Test our enhanced extraction function (from NotificationCenter.jsx)
const extractWorkspaceId = (notification) => {
  const workspaceId = notification.workspaceId || notification.data?.workspaceId;
  
  if (!workspaceId) return null;
  
  if (typeof workspaceId === 'object' && workspaceId._id) {
    return String(workspaceId._id);
  }
  
  return String(workspaceId);
};

console.log('📱 Mock notification from API:');
console.log('- workspaceId type:', typeof mockNotificationFromAPI.data.workspaceId);
console.log('- workspaceId value:', mockNotificationFromAPI.data.workspaceId);

console.log('\n🔧 Testing extraction function:');
const extractedId = extractWorkspaceId(mockNotificationFromAPI);
console.log('- Extracted ID:', extractedId);
console.log('- Type:', typeof extractedId);

console.log('\n📍 Testing URL construction:');
const searchParams = new URLSearchParams({
  openWorkspace: 'true',
  workspaceId: extractedId
});
console.log('- Search params:', searchParams.toString());
console.log('- Final URL:', `/freelancer?${searchParams.toString()}`);

console.log('\n✅ Expected result: /freelancer?openWorkspace=true&workspaceId=68d4c4068b0087370b5e32cc');

// Test edge cases
console.log('\n🧪 Testing edge cases:');

// Case 1: Direct workspace ID (string)
const directStringCase = {
  data: {
    workspaceId: "68d4c4068b0087370b5e32cc"
  }
};
console.log('Direct string case:', extractWorkspaceId(directStringCase));

// Case 2: Root level workspace ID
const rootLevelCase = {
  workspaceId: "68d4c4068b0087370b5e32cc"
};
console.log('Root level case:', extractWorkspaceId(rootLevelCase));

// Case 3: Object without _id (edge case)
const objectWithoutIdCase = {
  data: {
    workspaceId: {
      title: "Some Title"
    }
  }
};
console.log('Object without _id case:', extractWorkspaceId(objectWithoutIdCase));

console.log('\n🎯 All cases should return valid workspace IDs or null');