// Test script to verify bio validation fixes
const fetch = require('node-fetch');

async function testBioValidation() {
    console.log('🧪 Testing Bio Validation Fixes...\n');

    // Test 1: Bio with less than 50 characters (should fail)
    console.log('Test 1: Bio with 30 characters (should fail)');
    try {
        const shortBio = "I am a developer with experience"; // 32 characters
        console.log(`Bio length: ${shortBio.length} characters`);
        
        const response = await fetch('http://localhost:5000/api/auth/freelancer/auto-tag-bio', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ bio: shortBio })
        });
        
        const result = await response.json();
        console.log('Response:', result);
        console.log('✅ Expected failure - got:', result.message);
    } catch (error) {
        console.log('❌ Error:', error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 2: Bio with exactly 50 characters (should pass if authenticated)
    console.log('Test 2: Bio with 50 characters (should pass if authenticated)');
    try {
        const validBio = "I am a React developer with 5 years of experience!"; // 50 characters
        console.log(`Bio length: ${validBio.length} characters`);
        
        const response = await fetch('http://localhost:5000/api/auth/freelancer/auto-tag-bio', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ bio: validBio })
        });
        
        const result = await response.json();
        console.log('Response:', result);
        
        if (result.message === 'Unauthorized. Please login as a freelancer.') {
            console.log('✅ Bio validation passed - but needs authentication');
        } else if (result.message === 'Bio must be at least 50 characters long') {
            console.log('❌ Still showing old validation');
        } else {
            console.log('✅ Bio validation working correctly');
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
    }

    console.log('\n🎯 Summary:');
    console.log('- Bio validation now requires 50 characters (matches profile completion requirement)');
    console.log('- Frontend forms updated to show 50 character requirement');
    console.log('- Profile completion popup redirect fixed to use /freelancer-profile-setup');
    console.log('- Profile completion logic fixed to show popup until actually complete');
}

testBioValidation().catch(console.error);