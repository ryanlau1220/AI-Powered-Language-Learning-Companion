const AWS = require('aws-sdk');
require('dotenv').config();

// Configure Lex for Singapore region
const singaporeRegion = process.env.LEX_REGION || 'ap-southeast-1';

// Configure AWS with explicit credentials
AWS.config.update({
  region: singaporeRegion,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

class LexService {
  constructor() {
    this.lex = new AWS.LexRuntimeV2({ 
      region: singaporeRegion,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    });
    this.lexModels = new AWS.LexModelsV2({ 
      region: singaporeRegion,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    });
  }

  async createSession(conversationId, context) {
    try {
      const sessionId = `session-${conversationId}-${Date.now()}`;
      
      // In production, you would create a proper Lex bot
      // For now, we'll simulate session creation
      return {
        sessionId,
        botId: process.env.LEX_BOT_ID || 'default-bot',
        botAliasId: process.env.LEX_BOT_ALIAS_ID || 'TSTALIASID',
        localeId: context.language || 'en_US'
      };
    } catch (error) {
      console.error('Error creating Lex session:', error);
      throw error;
    }
  }

  async processMessage(conversationId, message) {
    try {
      // Try to use real Lex bot first, fallback to mock if it fails
      const sessionId = `session-${conversationId}`;
      
      const params = {
        botId: process.env.LEX_BOT_ID || 'your-lex-bot-id',
        botAliasId: process.env.LEX_BOT_ALIAS_ID || 'your-lex-alias-id',
        localeId: 'en_US',
        sessionId: sessionId,
        text: message
      };

      try {
        const result = await this.lex.recognizeText(params).promise();
        
        return {
          intent: result.intent?.intentName || 'General',
          confidence: result.intent?.confidence || 0.8,
          slots: result.slots || {},
          sessionState: result.sessionState || {}
        };
      } catch (lexError) {
        console.error('Lex bot error:', lexError.message);
        throw new Error('Failed to process message with Lex: ' + lexError.message);
      }
    } catch (error) {
      console.error('Error processing message with Lex:', error);
      throw new Error('Failed to process message with Lex: ' + error.message);
    }
  }


  async createBot(botName, languageCode = 'en_US') {
    try {
      const params = {
        botName: botName,
        description: 'AI Language Learning Bot',
        roleArn: process.env.LEX_ROLE_ARN,
        dataPrivacy: {
          childDirected: false
        },
        idleSessionTTLInSeconds: 300
      };

      const result = await this.lexModels.createBot(params).promise();
      return result;
    } catch (error) {
      console.error('Error creating Lex bot:', error);
      throw error;
    }
  }
}

module.exports = new LexService();
