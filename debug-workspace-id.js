// Debug test for notification workspace ID issue
// This will help us understand the exact notification structure

// Sample notification structures we might encounter
const testNotifications = [
  {
    _id: "notification1",
    type: "milestone_due",
    title: "Milestone Payment Due",
    message: "Payment for milestone 'Initial Design' is due in 2 days",
    workspaceId: "67567c6a8c7d8b8e9f1a2b3c", // Direct property
    recipient: "freelancer123",
    recipientModel: "Freelancer",
    read: false,
    createdAt: "2024-01-15T10:00:00Z"
  },
  {
    _id: "notification2", 
    type: "deliverable_submitted",
    title: "New Deliverable Submitted",
    message: "Freelancer has submitted deliverable for review",
    data: {
      workspaceId: "67567c6a8c7d8b8e9f1a2b3c" // Nested in data object
    },
    recipient: "client456",
    recipientModel: "Client",
    read: false,
    createdAt: "2024-01-15T11:00:00Z"
  },
  {
    _id: "notification3",
    type: "payment_released",
    title: "Payment Released",
    message: "Payment has been released for completed milestone",
    data: {
      workspaceId: {
        _id: "67567c6a8c7d8b8e9f1a2b3c", // Object with _id property
        project: "project123"
      }
    },
    recipient: "freelancer123", 
    recipientModel: "Freelancer",
    read: false,
    createdAt: "2024-01-15T12:00:00Z"
  }
];

// Test our workspaceId extraction logic
function testWorkspaceIdExtraction() {
  console.log("🧪 Testing Workspace ID Extraction Logic");
  
  testNotifications.forEach((notification, index) => {
    console.log(`\n📱 Test ${index + 1}: ${notification.title}`);
    console.log("📋 Full notification:", JSON.stringify(notification, null, 2));
    
    // Original logic (problematic)
    const originalId = notification.data?.workspaceId;
    console.log("❌ Original extraction (notification.data?.workspaceId):", originalId, typeof originalId);
    
    // Fixed logic
    const workspaceId = notification.workspaceId || notification.data?.workspaceId;
    console.log("🔍 Fixed extraction (workspaceId || data?.workspaceId):", workspaceId, typeof workspaceId);
    
    if (workspaceId) {
      let finalId;
      
      if (typeof workspaceId === 'object' && workspaceId._id) {
        // Handle case where workspaceId is an object with _id property
        finalId = String(workspaceId._id);
      } else {
        // Handle string or other cases
        finalId = String(workspaceId);
      }
      
      console.log("✅ Final workspace ID:", finalId);
      console.log("✅ URL would be:", `/freelancer?openWorkspace=true&workspaceId=${finalId}&tab=chat`);
    } else {
      console.log("❌ No workspace ID found");
    }
    
    console.log("-".repeat(50));
  });
}

// Test URL parameter extraction
function testUrlParameterExtraction() {
  console.log("\n\n🧪 Testing URL Parameter Extraction");
  
  const testUrls = [
    "?openWorkspace=true&workspaceId=67567c6a8c7d8b8e9f1a2b3c&tab=payments",
    "?openWorkspace=true&workspaceId=[object Object]&tab=deliverables", // The problematic case
    "?workspaceId=67567c6a8c7d8b8e9f1a2b3c&tab=milestones"
  ];
  
  testUrls.forEach((urlParams, index) => {
    console.log(`\n🔗 Test URL ${index + 1}: ${urlParams}`);
    
    const searchParams = new URLSearchParams(urlParams);
    const openWorkspace = searchParams.get('openWorkspace');
    const workspaceId = searchParams.get('workspaceId');
    const tab = searchParams.get('tab');
    
    console.log("📍 Extracted openWorkspace:", openWorkspace);
    console.log("📍 Extracted workspaceId:", workspaceId, typeof workspaceId);
    console.log("📍 Extracted tab:", tab);
    
    if (workspaceId === '[object Object]') {
      console.log("❌ PROBLEM DETECTED: workspaceId is '[object Object]'");
      console.log("💡 This happens when an object is converted to string incorrectly");
    } else if (workspaceId && workspaceId.length === 24) {
      console.log("✅ Valid MongoDB ObjectId format");
    } else {
      console.log("⚠️  Unusual workspaceId format");
    }
  });
}

// Enhanced workspace ID extraction for NotificationCenter
function enhancedWorkspaceIdExtraction(notification) {
  console.log("\n🔧 Enhanced Extraction Function Test");
  
  let workspaceId = notification.workspaceId || notification.data?.workspaceId;
  
  if (!workspaceId) {
    console.log("❌ No workspace ID found in notification");
    return null;
  }
  
  // Handle different types of workspace ID values
  if (typeof workspaceId === 'string') {
    console.log("✅ Workspace ID is already a string");
    return workspaceId;
  } else if (typeof workspaceId === 'object') {
    if (workspaceId._id) {
      console.log("✅ Workspace ID is object with _id property");
      return String(workspaceId._id);
    } else {
      console.log("⚠️  Workspace ID is object without _id, using toString()");
      return String(workspaceId);
    }
  } else {
    console.log("⚠️  Workspace ID is unexpected type, converting to string");
    return String(workspaceId);
  }
}

// Run all tests
console.log("🚀 Starting Workspace ID Debug Tests\n");

testWorkspaceIdExtraction();
testUrlParameterExtraction();

console.log("\n🔧 Testing Enhanced Extraction Function:");
testNotifications.forEach(notification => {
  const result = enhancedWorkspaceIdExtraction(notification);
  console.log(`📱 ${notification.title} → ${result}`);
});

console.log("\n📋 Recommended Fix for NotificationCenter.jsx:");
console.log(`
// Enhanced workspace ID extraction
const extractWorkspaceId = (notification) => {
  const workspaceId = notification.workspaceId || notification.data?.workspaceId;
  
  if (!workspaceId) return null;
  
  if (typeof workspaceId === 'object' && workspaceId._id) {
    return String(workspaceId._id);
  }
  
  return String(workspaceId);
};

// Usage in handleNotificationClick:
const workspaceIdStr = extractWorkspaceId(notification);
if (workspaceIdStr) {
  // Use workspaceIdStr in URLSearchParams
}
`);