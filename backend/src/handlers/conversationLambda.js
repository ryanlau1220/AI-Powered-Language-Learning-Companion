const AWS = require('aws-sdk');
require('dotenv').config();

const conversationService = require('../services/conversationService');
const { validateConversationRequest } = require('../middleware/lambdaValidation');

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
    if (path === '/conversation/start' && httpMethod === 'POST') {
      return await handleStartConversation(requestBody, headers, corsHeaders);
    } else if (path === '/conversation/message' && httpMethod === 'POST') {
      return await handleProcessMessage(requestBody, headers, corsHeaders);
    } else if (path.startsWith('/conversation/') && httpMethod === 'GET') {
      const conversationId = path.split('/')[2];
      return await handleGetConversation(conversationId, headers, corsHeaders);
    } else if (path === '/conversation' && httpMethod === 'GET') {
      return await handleGetConversations(event.queryStringParameters || {}, headers, corsHeaders);
    } else {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Route not found' })
      };
    }
  } catch (error) {
    console.error('Error in conversation Lambda:', error);
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

async function handleStartConversation(body, headers, corsHeaders) {
  try {
    // Validate request
    const { error, value } = validateConversationRequest(body);
    if (error) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ success: false, error: error.details[0].message })
      };
    }

    // TODO: Implement authentication
    const userId = 'temp-user-id'; // For now, use a temporary user ID
    
    const conversation = await conversationService.startConversation({
      userId,
      scenario: value.scenario,
      language: value.language,
      proficiencyLevel: value.proficiencyLevel
    });
    
    return {
      statusCode: 201,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        data: conversation
      })
    };
  } catch (error) {
    console.error('Error starting conversation:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: 'Failed to start conversation'
      })
    };
  }
}

async function handleProcessMessage(body, headers, corsHeaders) {
  try {
    const { conversationId, message, audioData } = body;
    
    if (!conversationId || !message) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ success: false, error: 'Missing required fields' })
      };
    }

    // TODO: Implement authentication
    const userId = 'temp-user-id'; // For now, use a temporary user ID
    
    const response = await conversationService.processMessage({
      conversationId,
      userId,
      message,
      audioData
    });
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        data: response
      })
    };
  } catch (error) {
    console.error('Error processing message:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: 'Failed to process message'
      })
    };
  }
}

async function handleGetConversation(conversationId, headers, corsHeaders) {
  try {
    if (!conversationId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ success: false, error: 'Missing conversation ID' })
      };
    }

    // TODO: Implement authentication
    const userId = 'temp-user-id'; // For now, use a temporary user ID
    
    const conversation = await conversationService.getConversation(conversationId, userId);
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        data: conversation
      })
    };
  } catch (error) {
    console.error('Error getting conversation:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: 'Failed to get conversation'
      })
    };
  }
}

async function handleGetConversations(queryParams, headers, corsHeaders) {
  try {
    const { limit = 10, offset = 0 } = queryParams;
    
    // TODO: Implement authentication
    const userId = 'temp-user-id'; // For now, use a temporary user ID
    
    const conversations = await conversationService.getUserConversations(userId, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        data: conversations
      })
    };
  } catch (error) {
    console.error('Error getting conversations:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: 'Failed to get conversations'
      })
    };
  }
}
