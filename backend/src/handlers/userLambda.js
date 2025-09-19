const AWS = require('aws-sdk');
require('dotenv').config();

const userService = require('../services/userService');
const { validateUserRequest } = require('../middleware/lambdaValidation');

// Configure AWS with explicit credentials
AWS.config.update({
  region: process.env.REGION || 'ap-southeast-5',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

exports.handler = async (event, context) => {
  try {
    // Parse the event
    const { httpMethod, path, body, headers } = event;
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    };

    // Handle preflight requests
    if (httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'CORS preflight' })
      };
    }

    // Parse request body
    const requestBody = body ? JSON.parse(body) : {};
    
    // Route handling
    if (path === '/user/register' && httpMethod === 'POST') {
      return await handleRegister(requestBody, headers, corsHeaders);
    } else if (path === '/user/login' && httpMethod === 'POST') {
      return await handleLogin(requestBody, headers, corsHeaders);
    } else if (path === '/user/profile' && httpMethod === 'GET') {
      return await handleGetProfile(headers, corsHeaders);
    } else if (path === '/user/profile' && httpMethod === 'PUT') {
      return await handleUpdateProfile(requestBody, headers, corsHeaders);
    } else if (path === '/user/progress' && httpMethod === 'GET') {
      return await handleGetProgress(headers, corsHeaders);
    } else if (path === '/user/progress' && httpMethod === 'PUT') {
      return await handleUpdateProgress(requestBody, headers, corsHeaders);
    } else {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Route not found' })
      };
    }
  } catch (error) {
    console.error('Error in user Lambda:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: false, 
        error: 'Internal server error' 
      })
    };
  }
};

async function handleRegister(body, headers, corsHeaders) {
  try {
    // Validate request
    const { error, value } = validateUserRequest(body);
    if (error) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ success: false, error: error.details[0].message })
      };
    }

    const { email, password, name, nativeLanguage, targetLanguage, proficiencyLevel } = value;
    
    const user = await userService.registerUser({
      email,
      password,
      name,
      nativeLanguage,
      targetLanguage,
      proficiencyLevel
    });
    
    return {
      statusCode: 201,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        data: {
          userId: user.userId,
          email: user.email,
          name: user.name,
          nativeLanguage: user.nativeLanguage,
          targetLanguage: user.targetLanguage,
          proficiencyLevel: user.proficiencyLevel,
          createdAt: user.createdAt
        }
      })
    };
  } catch (error) {
    console.error('Error registering user:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: 'Failed to register user'
      })
    };
  }
}

async function handleLogin(body, headers, corsHeaders) {
  try {
    const { email, password } = body;
    
    if (!email || !password) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ success: false, error: 'Missing email or password' })
      };
    }

    const result = await userService.authenticateUser(email, password);
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        data: result
      })
    };
  } catch (error) {
    console.error('Error logging in user:', error);
    return {
      statusCode: 401,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: 'Invalid credentials'
      })
    };
  }
}

async function handleGetProfile(headers, corsHeaders) {
  try {
    // TODO: Implement authentication
    const userId = 'temp-user-id'; // For now, use a temporary user ID
    
    const user = await userService.getUser(userId);
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        data: user
      })
    };
  } catch (error) {
    console.error('Error getting user profile:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: 'Failed to get user profile'
      })
    };
  }
}

async function handleUpdateProfile(body, headers, corsHeaders) {
  try {
    // TODO: Implement authentication
    const userId = 'temp-user-id'; // For now, use a temporary user ID
    
    const user = await userService.updateUser(userId, body);
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        data: user
      })
    };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: 'Failed to update user profile'
      })
    };
  }
}

async function handleGetProgress(headers, corsHeaders) {
  try {
    // TODO: Implement authentication
    const userId = 'temp-user-id'; // For now, use a temporary user ID
    
    const progress = await userService.getUserProgress(userId);
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        data: progress
      })
    };
  } catch (error) {
    console.error('Error getting user progress:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: 'Failed to get user progress'
      })
    };
  }
}

async function handleUpdateProgress(body, headers, corsHeaders) {
  try {
    // TODO: Implement authentication
    const userId = 'temp-user-id'; // For now, use a temporary user ID
    
    const progress = await userService.updateUserProgress(userId, body);
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        data: progress
      })
    };
  } catch (error) {
    console.error('Error updating user progress:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: 'Failed to update user progress'
      })
    };
  }
}
