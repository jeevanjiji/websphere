// Test the actual registration API call
const fetch = require('node-fetch').default;

const testRegistration = async () => {
  const testData = {
    fullName: "John Smith", // Make sure this format is correct
    email: "test@example.com",
    password: "Password123", // Has uppercase, lowercase, and number
    role: "freelancer",
    bio: "I am an experienced designer skilled in creating beautiful interfaces using Figma, Adobe Photoshop, and Adobe Illustrator"
  };

  console.log('Making registration request...');
  console.log('Data being sent:', testData);

  try {
    const response = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', [...response.headers.entries()]);

    const responseData = await response.json();
    console.log('Response data:', responseData);

    if (!response.ok) {
      console.log('Request failed with status:', response.status);
      console.log('Error details:', responseData);
    }

  } catch (error) {
    console.error('Network error:', error.message);
  }
};

testRegistration();