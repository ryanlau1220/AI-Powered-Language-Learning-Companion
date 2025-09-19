const https = require('https');

// This will be updated with actual API Gateway URLs after deployment
const API_BASE_URL = process.env.API_GATEWAY_URL || 'https://your-api-gateway-url.execute-api.ap-southeast-5.amazonaws.com/dev';

async function testEndpoint(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (body) {
      options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(body));
    }

    const req = https.request(`${API_BASE_URL}${path}`, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function testAPIEndpoints() {
  console.log('🧪 Testing API Gateway Endpoints...\n');

  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await testEndpoint('GET', '/health');
    console.log(`   Status: ${healthResponse.statusCode}`);
    console.log(`   Response: ${healthResponse.body}\n`);

    // Test conversation endpoints
    console.log('2. Testing conversation endpoints...');
    const conversationResponse = await testEndpoint('POST', '/conversation/start', {
      scenario: 'restaurant',
      language: 'en-US',
      proficiencyLevel: 'beginner'
    });
    console.log(`   Start Conversation Status: ${conversationResponse.statusCode}`);
    console.log(`   Response: ${conversationResponse.body}\n`);

    // Test speech endpoints
    console.log('3. Testing speech endpoints...');
    const speechResponse = await testEndpoint('POST', '/speech/synthesize', {
      text: 'Hello, welcome to our restaurant!',
      voiceId: 'Joanna',
      languageCode: 'en-US'
    });
    console.log(`   Synthesize Speech Status: ${speechResponse.statusCode}`);
    console.log(`   Response: ${speechResponse.body}\n`);

    // Test user endpoints
    console.log('4. Testing user endpoints...');
    const userResponse = await testEndpoint('GET', '/user/profile');
    console.log(`   Get Profile Status: ${userResponse.statusCode}`);
    console.log(`   Response: ${userResponse.body}\n`);

    console.log('✅ API Gateway testing completed!');

  } catch (error) {
    console.error('❌ API Gateway testing failed:', error.message);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  testAPIEndpoints();
}

module.exports = { testAPIEndpoints, testEndpoint };
