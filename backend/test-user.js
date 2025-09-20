const userService = require('./src/services/userService');

async function testUserCreation() {
  try {
    console.log('Testing user creation...');
    
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      nativeLanguage: 'en',
      targetLanguages: ['es']
    };
    
    console.log('User data:', userData);
    
    const result = await userService.createUser(userData);
    console.log('User created successfully:', result);
    
  } catch (error) {
    console.error('Error creating user:', error);
    console.error('Error stack:', error.stack);
  }
}

testUserCreation();
