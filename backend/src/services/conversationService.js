const { v4: uuidv4 } = require('uuid');
const bedrockService = require('./bedrockService');
const languageDetectionService = require('./languageDetectionService');

class ConversationService {
  constructor() {
    this.bedrockService = bedrockService;
    this.conversations = new Map(); // In-memory storage for now
  }

  async startConversation({ userId, scenario, language, proficiencyLevel }) {
    try {
      const conversationId = uuidv4();
      const detectedLanguage = language || 'en';
      const culturalContext = languageDetectionService.getCulturalContext(detectedLanguage);
      
      const conversation = {
        conversationId,
        userId,
        scenario: scenario || 'general',
        language: detectedLanguage,
        proficiencyLevel: proficiencyLevel || 'intermediate',
        culturalContext: culturalContext,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [],
        languageHistory: [] // Track language changes
      };

      // Generate initial AI response
      const initialResponse = await this.bedrockService.generateInitialResponse({
        scenario: conversation.scenario,
        language: conversation.language,
        proficiencyLevel: conversation.proficiencyLevel,
        culturalContext: conversation.culturalContext
      });

      // Add initial AI message
      const initialMessage = {
        type: 'ai',
        content: initialResponse.text,
        timestamp: new Date().toISOString(),
        confidence: initialResponse.confidence,
        language: initialResponse.language,
        culturalContext: initialResponse.culturalContext
      };
      conversation.messages.push(initialMessage);

      // Store conversation in memory
      this.conversations.set(conversationId, conversation);

      console.log(`✅ Started conversation ${conversationId} in ${detectedLanguage} with ${culturalContext} cultural context`);
      return conversation;
    } catch (error) {
      console.error('Error starting conversation:', error);
      throw error;
    }
  }

  async processMessage({ conversationId, userId, message, audioData, uiLanguage }) {
    try {
      // Get conversation from memory
      const conversation = this.conversations.get(conversationId);
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Use UI language as the primary indicator - respect user's choice
      let targetLanguage = uiLanguage || 'en';
      
      // Only override if UI language is not explicitly set and message contains Chinese characters
      if (!uiLanguage) {
        const chinesePattern = /[\u4e00-\u9fff\u3400-\u4dbf\u20000-\u2a6df\u2a700-\u2b73f\u2b740-\u2b81f\u2b820-\u2ceaf\uf900-\ufaff\u3300-\u33ff]/;
        if (chinesePattern.test(message)) {
          targetLanguage = 'zh';
          console.log(`🔍 UI language not set, message contains Chinese characters, using Chinese`);
        } else {
          console.log(`🔍 UI language not set, using default English`);
        }
      } else {
        console.log(`🔍 Using UI language: ${targetLanguage}`);
      }

      // Update conversation language if different
      if (targetLanguage !== conversation.language) {
        console.log(`🔄 Language switched from ${conversation.language} to ${targetLanguage}`);
        conversation.language = targetLanguage;
        conversation.culturalContext = targetLanguage === 'zh' ? 'Chinese' : 'Western';
        
        // Track language change
        conversation.languageHistory.push({
          from: conversation.language,
          to: targetLanguage,
          timestamp: new Date().toISOString(),
          confidence: 1.0 // High confidence since it's based on UI language
        });
      } else {
        console.log(`📝 Language remains ${conversation.language}`);
      }

      // Add user message to conversation with language info
      const userMessage = {
        type: 'user',
        content: message,
        timestamp: new Date().toISOString(),
        audioData: audioData || null,
        detectedLanguage: targetLanguage,
        languageConfidence: 1.0
      };
      conversation.messages.push(userMessage);

      // Generate AI response using Bedrock with current language context
      const aiResponse = await this.bedrockService.generateResponse({
        conversationHistory: conversation.messages.slice(-10), // Last 10 messages
        userMessage: message,
        lexIntent: 'conversation', // Default intent
        scenario: conversation.scenario,
        language: conversation.language,
        proficiencyLevel: conversation.proficiencyLevel,
        culturalContext: conversation.culturalContext
      });

      // Add AI response to conversation
      const aiMessage = {
        type: 'ai',
        content: aiResponse.text,
        timestamp: new Date().toISOString(),
        confidence: aiResponse.confidence || 0.8,
        language: aiResponse.language,
        culturalContext: aiResponse.culturalContext
      };
      conversation.messages.push(aiMessage);

      // Update conversation
      conversation.updatedAt = new Date().toISOString();
      this.conversations.set(conversationId, conversation);

      return {
        conversationId,
        response: aiMessage.content,
        confidence: aiMessage.confidence,
        language: aiMessage.language,
        culturalContext: aiMessage.culturalContext,
        languageDetection: {
          detected: targetLanguage,
          confidence: 1.0,
          switched: conversation.languageHistory.length > 0
        },
        conversation: conversation
      };
    } catch (error) {
      console.error('Error processing message:', error);
      throw error;
    }
  }

  async getConversation(conversationId, userId) {
    try {
      const conversation = this.conversations.get(conversationId);
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      if (conversation.userId !== userId) {
        throw new Error('Unauthorized access to conversation');
      }

      return conversation;
    } catch (error) {
      console.error('Error getting conversation:', error);
      throw error;
    }
  }

  async getUserConversations(userId, { limit = 10, offset = 0 } = {}) {
    try {
      const userConversations = Array.from(this.conversations.values())
        .filter(conv => conv.userId === userId)
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .slice(offset, offset + limit);

      return {
        conversations: userConversations,
        total: userConversations.length,
        limit,
        offset
      };
    } catch (error) {
      console.error('Error getting user conversations:', error);
      throw error;
    }
  }

  async endConversation(conversationId, userId) {
    try {
      const conversation = this.conversations.get(conversationId);
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      if (conversation.userId !== userId) {
        throw new Error('Unauthorized access to conversation');
      }

      conversation.status = 'ended';
      conversation.updatedAt = new Date().toISOString();
      this.conversations.set(conversationId, conversation);

      return conversation;
    } catch (error) {
      console.error('Error ending conversation:', error);
      throw error;
    }
  }
}

module.exports = new ConversationService();