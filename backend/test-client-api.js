const jwt = require('jsonwebtoken');
const http = require('http');

// Create test token for a client
const clientId = '6893a5a689a2b96e568ca086'; // Use the same user but as client
const token = jwt.sign(
  { userId: clientId, role: 'client' },
  'your_jwt_secret_key',
  { expiresIn: '24h' }
);

console.log('Testing client APIs...');
console.log('Token:', token);

// Test /api/projects/my endpoint
const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/projects/my',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response body:');
    try {
      const parsed = JSON.parse(data);
      console.log(JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log(data);
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error.message);
});

req.end();
