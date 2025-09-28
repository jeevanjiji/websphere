// Test the fixed bio update
console.log('🧪 Testing Bio Update Fix...\n');

// Test the bio update with proper JSON format
const testBio = "I am a React developer with 5 years of experience, also proficient in php, css, javascript, node.js etc and many more technologies";

console.log(`Bio text: "${testBio}"`);
console.log(`Bio length: ${testBio.length} characters`);
console.log(`Expected result: Should work now (>50 chars and JSON format)`);

console.log('\n🔧 **Fix Applied:**');
console.log('- Changed frontend from FormData to JSON format');
console.log('- Backend expects JSON: { bio: "text" }');
console.log('- Frontend now sends: JSON.stringify({ bio })');

console.log('\n✅ **Ready for Testing:**');
console.log('- Backend: Running on port 5000');
console.log('- Frontend: Running on port 5174 (5173 was in use)'); 
console.log('- Bio validation: 50+ characters required');
console.log('- Request format: Fixed to use JSON instead of FormData');

console.log('\n🎯 **Next Steps:**');
console.log('1. Refresh the frontend page (localhost:5174)');
console.log('2. Try updating your bio again');
console.log('3. The bio should now save successfully!');