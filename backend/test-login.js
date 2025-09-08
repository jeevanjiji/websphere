// Test login API to see what token we get
async function testLogin() {
  try {
    console.log('🔑 Testing freelancer login API...');
    
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'jeevanjiji2003@gmail.com', // Freelancer email
        password: 'test123' // Updated password
      })
    });

    console.log('📡 Login response status:', response.status);
    
    const data = await response.json();
    console.log('📄 Login response data:', JSON.stringify(data, null, 2));

    if (data.success && data.token) {
      // Decode the token to see what's inside
      const tokenParts = data.token.split('.');
      const payload = JSON.parse(atob(tokenParts[1]));
      console.log('🔓 Token payload:', payload);
    }

  } catch (error) {
    console.error('❌ Error testing login:', error);
  }
}

testLogin();
