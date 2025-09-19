const AWS = require('aws-sdk');
require('dotenv').config();

const speechService = require('../services/speechService');

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
    if (path === '/speech/transcribe' && httpMethod === 'POST') {
      return await handleTranscribe(requestBody, headers, corsHeaders);
    } else if (path === '/speech/synthesize' && httpMethod === 'POST') {
      return await handleSynthesize(requestBody, headers, corsHeaders);
    } else if (path === '/speech/pronunciation' && httpMethod === 'POST') {
      return await handlePronunciationAnalysis(requestBody, headers, corsHeaders);
    } else {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Route not found' })
      };
    }
  } catch (error) {
    console.error('Error in speech Lambda:', error);
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

async function handleTranscribe(body, headers, corsHeaders) {
  try {
    const { audioData, languageCode = 'en-US' } = body;
    
    if (!audioData) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ success: false, error: 'Missing audio data' })
      };
    }

    const result = await speechService.transcribeAudio({
      audioData,
      languageCode,
      userId: 'temp-user-id'
    });
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        data: result
      })
    };
  } catch (error) {
    console.error('Error transcribing audio:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: 'Failed to transcribe audio'
      })
    };
  }
}

async function handleSynthesize(body, headers, corsHeaders) {
  try {
    const { text, voiceId = 'Joanna', languageCode = 'en-US' } = body;
    
    if (!text) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ success: false, error: 'Missing text to synthesize' })
      };
    }

    const result = await speechService.synthesizeSpeech({
      text,
      voiceId,
      languageCode,
      userId: 'temp-user-id'
    });
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        data: result
      })
    };
  } catch (error) {
    console.error('Error synthesizing speech:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: 'Failed to synthesize speech'
      })
    };
  }
}

async function handlePronunciationAnalysis(body, headers, corsHeaders) {
  try {
    const { audioData, text, languageCode = 'en-US' } = body;
    
    if (!audioData || !text) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ success: false, error: 'Missing audio data or reference text' })
      };
    }

    const result = await speechService.getPronunciationFeedback({
      audioData,
      text,
      languageCode,
      userId: 'temp-user-id'
    });
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        data: result
      })
    };
  } catch (error) {
    console.error('Error analyzing pronunciation:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: 'Failed to analyze pronunciation'
      })
    };
  }
}
