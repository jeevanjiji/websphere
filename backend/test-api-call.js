const http = require('http');

console.log('Making API request to /api/applications/my...');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODkzYTVhNjg5YTJiOTZlNTY4Y2EwODYiLCJyb2xlIjoiZnJlZWxhbmNlciIsImlhdCI6MTc1Njc5NTA1OCwiZXhwIjoxNzU2ODgxNDU4fQ.dkrlcTmC9Vdgr98pd_5vLjrMFQ3a6i8mws5fwHsyR6g';

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/test',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  
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
