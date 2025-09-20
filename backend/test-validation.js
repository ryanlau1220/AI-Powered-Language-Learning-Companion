const { validateUserRegistration } = require('./src/middleware/validation');

// Mock request and response objects
const mockReq = {
  body: {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
    nativeLanguage: 'en',
    targetLanguages: ['es']
  }
};

const mockRes = {
  status: (code) => ({
    json: (data) => {
      console.log('Validation failed:', code, data);
      return { status: code, json: data };
    }
  })
};

const mockNext = () => {
  console.log('Validation passed, calling next()');
};

console.log('Testing validation with data:', mockReq.body);
validateUserRegistration(mockReq, mockRes, mockNext);
