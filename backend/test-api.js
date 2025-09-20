const express = require('express');
const userRoutes = require('./src/handlers/user');

const app = express();
app.use(express.json());
app.use('/user', userRoutes);

// Test the registration endpoint
async function testRegistration() {
  const testData = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
    nativeLanguage: 'en',
    targetLanguages: ['es']
  };

  const response = await fetch('http://localhost:3000/user/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(testData)
  });

  const result = await response.json();
  console.log('Response status:', response.status);
  console.log('Response data:', result);
}

// Start server and test
app.listen(3001, () => {
  console.log('Test server running on port 3001');
  testRegistration();
});
