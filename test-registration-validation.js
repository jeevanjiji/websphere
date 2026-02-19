// Test registration validation
const { validateRegistrationData } = require('./backend/utils/validation');

// Test data that mimics what you're sending
const testData = {
  fullName: "John Smith", // Example - you'll need to use your actual name
  email: "test@example.com", // Example - you'll need to use your actual email
  password: "Password123", // Example - needs uppercase, lowercase, number
  role: "freelancer",
  bio: "Designing in Figma, Adobe Photoshop, Adobe Illustrator"
};

console.log('Testing registration validation...');
console.log('Test data:', testData);
console.log('Bio length:', testData.bio.length);
console.log('Bio word count:', testData.bio.split(/\s+/).length);

const result = validateRegistrationData(testData);
console.log('Validation result:', result);

if (!result.isValid) {
  console.log('Validation errors:');
  result.errors.forEach(error => {
    console.log(`- ${error.field}: ${error.message}`);
  });
}