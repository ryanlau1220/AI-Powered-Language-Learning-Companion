const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const dynamoService = require('./dynamoService');
const lexService = require('./lexService');
const bedrockService = require('./bedrockService');

// Configure AWS regions
const malaysiaRegion = process.env.AWS_REGION || 'ap-southeast-1';
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

      // Try to save to DynamoDB, but don't fail if not available
      try {
        await this.dynamoService.putItem(this.conversationsTable, conversation);
      } catch (dbError) {
        console.log('DynamoDB not available, using in-memory conversation');
      }

      let lexSession = { sessionId: `session-${conversationId}` };
      let initialResponse;

      try {
        // Initialize Lex session
        lexSession = await this.lexService.createSession(conversationId, {
          scenario,
          language,
          proficiencyLevel
        });
      } catch (lexError) {
        console.log('Lex service not available, using fallback session');
      }

      try {
        // Generate initial AI response using Bedrock
        initialResponse = await this.bedrockService.generateInitialResponse({
          scenario,
          language,
          proficiencyLevel
        });
      } catch (bedrockError) {
        console.log('Bedrock service not available, using fallback response');
        console.error('Bedrock error details:', bedrockError.message);
        console.error('Bedrock error code:', bedrockError.code);
        initialResponse = this.getInitialFallbackResponse(scenario || 'general');
      }

      // Add initial AI message
      const aiMessage = {
        messageId: uuidv4(),
        type: 'ai',
        content: initialResponse.text,
        timestamp: new Date().toISOString(),
        metadata: {
          confidence: initialResponse.confidence || 0.8,
          sentiment: initialResponse.sentiment || 'positive'
        }
      };

      conversation.messages.push(aiMessage);
      conversation.metadata.totalMessages = 1;

      // Try to update conversation with initial message
      try {
        await this.dynamoService.updateItem(this.conversationsTable, { conversationId }, {
          messages: conversation.messages,
          'metadata.totalMessages': 1
        });
      } catch (dbError) {
        console.log('Could not update conversation in DynamoDB, continuing');
      }

      return {
        ...conversation,
        lexSessionId: lexSession.sessionId
      };
    } catch (error) {
      console.error('Error starting conversation:', error);
      // Return a basic conversation even if there's an error
      return {
        conversationId: uuidv4(),
        userId,
        scenario: scenario || 'general',
        language: language || 'en',
        proficiencyLevel: proficiencyLevel || 'beginner',
        status: 'active',
        createdAt: new Date().toISOString(),
        messages: [{
          messageId: uuidv4(),
          type: 'ai',
          content: "Hello! I'm your AI language learning tutor. Let's practice conversations. What would you like to talk about?",
          timestamp: new Date().toISOString(),
          metadata: {
            confidence: 0.8,
            sentiment: 'positive'
          }
        }],
        metadata: {
          totalMessages: 1,
          averageResponseTime: 0,
          pronunciationScore: 0,
          grammarScore: 0
        },
        lexSessionId: `session-${uuidv4()}`
      };
    }
  }

  getInitialFallbackResponse(scenario) {
    const responses = {
      restaurant: "Welcome to our restaurant! I'll be your server today. What would you like to order?",
      school: "Hello! Welcome to our school. I'm here to help you with any questions about our programs or campus life.",
      work: "Good morning! I'm here to discuss our project. How can I assist you with your work today?",
      general: "Hello! I'm your AI language learning tutor. Let's practice conversations. What would you like to talk about?"
    };

    return {
      text: responses[scenario] || responses.general,
      confidence: 0.8,
      sentiment: 'positive'
    };
  }

  async processMessage({ conversationId, userId, message, audioData }) {
    try {
      // For now, create a simple conversation without DynamoDB if not available
      let conversation = null;
      
      try {
        conversation = await this.dynamoService.getItem(this.conversationsTable, { conversationId });
      } catch (dbError) {
        console.log('DynamoDB not available, using in-memory conversation');
        // Create a simple conversation object for testing
        conversation = {
          conversationId,
          userId,
          scenario: 'general',
          language: 'en',
          proficiencyLevel: 'beginner',
          messages: [],
          metadata: {
            totalMessages: 0,
            averageResponseTime: 0,
            pronunciationScore: 0,
            grammarScore: 0
          }
        };
      }

      // Add user message
      const userMessage = {
        messageId: uuidv4(),
        type: 'user',
        content: message,
        timestamp: new Date().toISOString(),
        audioData: audioData || null
      };

      let lexResponse = { intent: 'General', confidence: 0.8 };
      let aiResponse;

      try {
        // Process with Lex for intent recognition
        lexResponse = await this.lexService.processMessage(conversationId, message);
      } catch (lexError) {
        console.log('Lex service not available, using fallback');
        lexResponse = { intent: 'General', confidence: 0.8 };
      }

      try {
        // Generate AI response using Bedrock
        aiResponse = await this.bedrockService.generateResponse({
          conversationHistory: conversation?.messages || [],
          userMessage: message,
          lexIntent: lexResponse.intent,
          scenario: conversation?.scenario || 'general',
          language: conversation?.language || 'en',
          proficiencyLevel: conversation?.proficiencyLevel || 'beginner'
        });
      } catch (bedrockError) {
        console.log('Bedrock service not available, using intelligent fallback response');
        aiResponse = this.getIntelligentFallbackResponse(message, conversation?.scenario || 'general', conversation?.messages || []);
      }

      // Add AI response message
      const aiMessage = {
        messageId: uuidv4(),
        type: 'ai',
        content: aiResponse.text || aiResponse.content,
        timestamp: new Date().toISOString(),
        metadata: {
          confidence: aiResponse.confidence || 0.8,
          sentiment: aiResponse.sentiment || 'neutral',
          grammarSuggestions: aiResponse.grammarSuggestions || [],
          pronunciationTips: aiResponse.pronunciationTips || []
        }
      };

      // Update conversation with new messages
      const updatedMessages = [...(conversation?.messages || []), userMessage, aiMessage];
      const updatedMetadata = {
        ...(conversation?.metadata || {}),
        totalMessages: updatedMessages.length,
        lastActivity: new Date().toISOString()
      };

      // Try to update in DynamoDB, but don't fail if it's not available
      try {
        await this.dynamoService.updateItem(this.conversationsTable, { conversationId }, {
          messages: updatedMessages,
          metadata: updatedMetadata
        });
      } catch (dbError) {
        console.log('Could not update conversation in DynamoDB, continuing with response');
      }

      return {
        messageId: aiMessage.messageId,
        content: aiMessage.content,
        metadata: aiMessage.metadata,
        conversationId,
        lexResponse
      };
    } catch (error) {
      console.error('Error processing message:', error);
      // Return a fallback response instead of throwing
      return {
        messageId: uuidv4(),
        content: "I'm sorry, I'm having trouble processing your message right now. Please try again.",
        metadata: {
          confidence: 0.5,
          sentiment: 'neutral',
          grammarSuggestions: [],
          pronunciationTips: []
        },
        conversationId,
        lexResponse: { intent: 'Error', confidence: 0.5 }
      };
    }
  }

  getIntelligentFallbackResponse(message, scenario, conversationHistory) {
    const lowerMessage = message.toLowerCase();
    
    // Analyze the user's message for context
    const isGreeting = lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey');
    const isQuestion = lowerMessage.includes('?') || lowerMessage.includes('what') || lowerMessage.includes('how') || lowerMessage.includes('why');
    const isPractice = lowerMessage.includes('practice') || lowerMessage.includes('learn') || lowerMessage.includes('study');
    const isFood = lowerMessage.includes('food') || lowerMessage.includes('eat') || lowerMessage.includes('order') || lowerMessage.includes('menu');
    const isSchool = lowerMessage.includes('school') || lowerMessage.includes('class') || lowerMessage.includes('student') || lowerMessage.includes('teacher');
    const isWork = lowerMessage.includes('work') || lowerMessage.includes('job') || lowerMessage.includes('meeting') || lowerMessage.includes('project');
    
    // Generate contextual responses based on scenario and message content
    let response;
    
    if (scenario === 'restaurant') {
      if (isGreeting) {
        response = "Welcome to our restaurant! I'll be your server today. What would you like to order?";
      } else if (isFood) {
        response = "That sounds delicious! Would you like to see our specials menu or do you have any dietary preferences?";
      } else if (isQuestion) {
        response = "I'd be happy to help you with that. What would you like to know about our menu?";
      } else {
        response = "I'm here to help you with your order. What can I get for you today?";
      }
    } else if (scenario === 'school') {
      if (isGreeting) {
        response = "Hello! Welcome to our school. I'm here to help you with any questions about our programs or campus life.";
      } else if (isQuestion) {
        response = "That's a great question! Let me help you understand that better. What specific aspect would you like to know more about?";
      } else if (isPractice) {
        response = "I'm here to help you learn and practice. What subject or topic would you like to work on?";
      } else {
        response = "I'm here to support your learning. What would you like to discuss or practice today?";
      }
    } else if (scenario === 'work') {
      if (isGreeting) {
        response = "Good morning! I'm here to discuss our project. How can I assist you with your work today?";
      } else if (isQuestion) {
        response = "That's a good point. Let me help you with that. What specific information do you need?";
      } else if (isWork) {
        response = "I understand. Let's work together on this. What's your current priority?";
      } else {
        response = "I'm here to support your work. What would you like to discuss or work on?";
      }
    } else {
      // General conversation - keep responses short and conversational
      if (isGreeting) {
        response = "Hello! Nice to meet you. How are you today?";
      } else if (isQuestion) {
        response = "That's a good question! What do you think about it?";
      } else if (isPractice) {
        response = "Great! What would you like to practice?";
      } else {
        response = "That's interesting! Tell me more.";
      }
    }
    
    // Keep responses short and conversational
    // Remove the long practice content that was being added
    
    return {
      text: response,
      confidence: 0.8,
      sentiment: 'positive',
      grammarSuggestions: this.generateGrammarSuggestions(message),
      pronunciationTips: this.generatePronunciationTips(message)
    };
  }

  generateGrammarSuggestions(message) {
    const suggestions = [];
    
    // Basic grammar checks
    if (message.includes('i am go')) {
      suggestions.push("Consider using 'I am going' instead of 'I am go'");
    }
    if (message.includes('he go')) {
      suggestions.push("Consider using 'he goes' instead of 'he go'");
    }
    if (!message.match(/^[A-Z]/)) {
      suggestions.push("Remember to start sentences with a capital letter");
    }
    
    return suggestions;
  }

  generatePronunciationTips(message) {
    const tips = [];
    
    // Basic pronunciation tips
    if (message.includes('th')) {
      tips.push("Practice the 'th' sound by placing your tongue between your teeth");
    }
    if (message.includes('r')) {
      tips.push("For the 'r' sound, curl your tongue slightly back");
    }
    
    return tips;
  }

  getFallbackResponse(message, scenario) {
    const responses = {
      restaurant: [
        "That sounds great! What else would you like to order?",
        "I'd be happy to help you with that. Is there anything else I can get for you?",
        "Excellent choice! Would you like to see our dessert menu?",
        "Perfect! How would you like that prepared?"
      ],
      school: [
        "That's a great question! Let me help you understand that better.",
        "I'm here to help you learn. What would you like to know more about?",
        "That's an interesting point. Can you tell me more about your thoughts on this?",
        "Good thinking! Let's explore that topic further."
      ],
      work: [
        "I understand. Let's discuss this further and find a solution.",
        "That's a good point. How do you think we should proceed?",
        "I see what you mean. Let me help you with that.",
        "Great idea! Let's work on implementing that."
      ],
      general: [
        "That's interesting! Tell me more about that.",
        "I'd love to hear more about your thoughts on this topic.",
        "That's a great point. What made you think about that?",
        "I'm enjoying our conversation! What else would you like to discuss?"
      ]
    };

    const scenarioResponses = responses[scenario] || responses.general;
    const randomResponse = scenarioResponses[Math.floor(Math.random() * scenarioResponses.length)];
    
    return {
      text: randomResponse,
      confidence: 0.7,
      sentiment: 'positive',
      grammarSuggestions: [],
      pronunciationTips: []
    };
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
