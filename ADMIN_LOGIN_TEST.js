// Test admin login and dashboard access
const adminCredentials = {
  email: 'admin@admin.com',
  password: 'admin123'
};

console.log('Admin test credentials:');
console.log('Email:', adminCredentials.email);
console.log('Password:', adminCredentials.password);
console.log('\nTo test:');
console.log('1. Go to http://localhost:5174');
console.log('2. Navigate to Login page');
console.log('3. Use the credentials above');
console.log('4. After login, you should be redirected to admin dashboard');
console.log('5. The dashboard should load user statistics and user management');
