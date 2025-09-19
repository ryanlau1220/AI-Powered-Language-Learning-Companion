const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const dynamoService = require('./dynamoService');
const lexService = require('./lexService');
const bedrockService = require('./bedrockService');

// Configure AWS regions
const malaysiaRegion = process.env.REGION || 'ap-southeast-5';
const singaporeRegion = process.env.LEX_REGION || 'ap-southeast-1';

class ConversationService {
  constructor() {
    this.dynamoService = dynamoService;
    this.lexService = lexService;
    this.bedrockService = bedrockService;
    this.conversationsTable = process.env.CONVERSATIONS_TABLE || 'ai-language-learning-backend-dev-conversations';
  }

  async startConversation({ userId, scenario, language, proficiencyLevel }) {
    try {
      const conversationId = uuidv4();
      const conversation = {
        conversationId,
        userId,
        scenario: scenario || 'general',
        language: language || 'en',
        proficiencyLevel: proficiencyLevel || 'beginner',
        status: 'active',
        createdAt: new Date().toISOString(),
        messages: [],
        metadata: {
          totalMessages: 0,
          averageResponseTime: 0,
          pronunciationScore: 0,
          grammarScore: 0
        }
      };

      // Save to DynamoDB
      await this.dynamoService.putItem(this.conversationsTable, conversation);

      // Initialize Lex session
      const lexSession = await this.lexService.createSession(conversationId, {
        scenario,
        language,
        proficiencyLevel
      });

      // Generate initial AI response using Bedrock
      const initialResponse = await this.bedrockService.generateInitialResponse({
        scenario,
        language,
        proficiencyLevel
      });

      // Add initial AI message
      const aiMessage = {
        messageId: uuidv4(),
        type: 'ai',
        content: initialResponse.text,
        timestamp: new Date().toISOString(),
        metadata: {
          confidence: initialResponse.confidence,
          sentiment: initialResponse.sentiment
        }
      };

      conversation.messages.push(aiMessage);
      conversation.metadata.totalMessages = 1;

      // Update conversation with initial message
      await this.dynamoService.updateItem(this.conversationsTable, { conversationId }, {
        messages: conversation.messages,
        'metadata.totalMessages': 1
      });

      return {
        ...conversation,
        lexSessionId: lexSession.sessionId
      };
    } catch (error) {
      console.error('Error starting conversation:', error);
      throw error;
    }
  }

  async processMessage({ conversationId, userId, message, audioData }) {
    try {
      // Get conversation from DynamoDB
      const conversation = await this.dynamoService.getItem(this.conversationsTable, { conversationId });
      
      if (!conversation || conversation.userId !== userId) {
        throw new Error('Conversation not found or access denied');
      }

      // Add user message
      const userMessage = {
        messageId: uuidv4(),
        type: 'user',
        content: message,
        timestamp: new Date().toISOString(),
        audioData: audioData || null
      };

      // Process with Lex for intent recognition
      const lexResponse = await this.lexService.processMessage(conversationId, message);

      // Generate AI response using Bedrock
      const aiResponse = await this.bedrockService.generateResponse({
        conversationHistory: conversation.messages,
        userMessage: message,
        lexIntent: lexResponse.intent,
        scenario: conversation.scenario,
        language: conversation.language,
        proficiencyLevel: conversation.proficiencyLevel
      });

      // Add AI response message
      const aiMessage = {
        messageId: uuidv4(),
        type: 'ai',
        content: aiResponse.text,
        timestamp: new Date().toISOString(),
        metadata: {
          confidence: aiResponse.confidence,
          sentiment: aiResponse.sentiment,
          grammarSuggestions: aiResponse.grammarSuggestions,
          pronunciationTips: aiResponse.pronunciationTips
        }
      };

      // Update conversation with new messages
      const updatedMessages = [...conversation.messages, userMessage, aiMessage];
      const updatedMetadata = {
        ...conversation.metadata,
        totalMessages: updatedMessages.length,
        lastActivity: new Date().toISOString()
      };

      await this.dynamoService.updateItem(this.conversationsTable, { conversationId }, {
        messages: updatedMessages,
        metadata: updatedMetadata
      });

      return {
        userMessage,
        aiMessage,
        conversationId,
        lexResponse
      };
    } catch (error) {
      console.error('Error processing message:', error);
      throw error;
    }
  }

  async getConversation(conversationId, userId) {
    try {
      const conversation = await this.dynamoService.getItem(this.conversationsTable, { conversationId });
      
      if (!conversation || conversation.userId !== userId) {
        throw new Error('Conversation not found or access denied');
      }

      return conversation;
    } catch (error) {
      console.error('Error getting conversation:', error);
      throw error;
    }
  }

  async getUserConversations(userId, { limit = 10, offset = 0 }) {
    try {
      const conversations = await this.dynamoService.queryByIndex(
        this.conversationsTable,
        'UserConversationsIndex',
        'userId',
        userId,
        { limit, offset }
      );

      return conversations;
    } catch (error) {
      console.error('Error getting user conversations:', error);
      throw error;
    }
  }
}

module.exports = new ConversationService();
