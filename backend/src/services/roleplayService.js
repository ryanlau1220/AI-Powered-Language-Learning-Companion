const { v4: uuidv4 } = require('uuid');
const dynamoService = require('./dynamoService');
const conversationService = require('./conversationService');
const userService = require('./userService');

class RoleplayService {
  constructor() {
    this.dynamoService = dynamoService;
    this.conversationService = conversationService;
    this.userService = userService;
    this.roleplayTable = process.env.ROLEPLAY_TABLE || 'ai-language-learning-backend-dev-roleplay';
  }

  // Predefined role-playing scenarios
  getScenarioTemplates() {
    return {
      'restaurant': {
        name: 'Restaurant Experience',
        description: 'Practice ordering food, asking about menu items, and handling restaurant situations',
        difficulty: ['beginner', 'intermediate', 'advanced'],
        roles: {
          user: {
            name: 'Customer',
            description: 'You are a customer at a restaurant',
            objectives: [
              'Order food and drinks',
              'Ask about menu items',
              'Handle special requests',
              'Pay the bill and tip appropriately'
            ],
            personality: 'Polite and curious about the food'
          },
          ai: {
            name: 'Waiter/Waitress',
            description: 'You are a professional waiter/waitress',
            personality: 'Friendly, helpful, and knowledgeable about the menu',
            characteristics: [
              'Welcomes customers warmly',
              'Explains menu items clearly',
              'Makes recommendations',
              'Handles special requests professionally'
            ]
          }
        },
        context: {
          setting: 'A busy restaurant during dinner service',
          atmosphere: 'Warm and welcoming with background chatter',
          menu: 'International cuisine with local specialties'
        },
        challenges: [
          'Dealing with dietary restrictions',
          'Understanding local food names',
          'Asking for recommendations',
          'Handling payment and tipping customs'
        ],
        successCriteria: [
          'Successfully place an order',
          'Ask at least 3 questions about the menu',
          'Handle the payment process',
          'Use appropriate politeness expressions'
        ]
      },
      'shopping': {
        name: 'Shopping Experience',
        description: 'Practice shopping for clothes, asking for sizes, and handling returns',
        difficulty: ['beginner', 'intermediate', 'advanced'],
        roles: {
          user: {
            name: 'Shopper',
            description: 'You are shopping for clothes',
            objectives: [
              'Find items you like',
              'Ask about sizes and availability',
              'Try on clothes',
              'Make a purchase or return items'
            ],
            personality: 'Decisive but sometimes indecisive about choices'
          },
          ai: {
            name: 'Sales Associate',
            description: 'You are a helpful sales associate',
            personality: 'Enthusiastic, patient, and knowledgeable about products',
            characteristics: [
              'Greets customers warmly',
              'Helps find the right size and style',
              'Provides honest recommendations',
              'Handles returns and exchanges professionally'
            ]
          }
        },
        context: {
          setting: 'A modern clothing store',
          atmosphere: 'Bright and organized with music playing',
          inventory: 'Trendy clothes for different occasions'
        },
        challenges: [
          'Finding the right size',
          'Understanding fabric and care instructions',
          'Comparing different options',
          'Handling returns and exchanges'
        ],
        successCriteria: [
          'Successfully find and try on items',
          'Ask about sizes and availability',
          'Make a purchase decision',
          'Use shopping-related vocabulary'
        ]
      },
      'directions': {
        name: 'Asking for Directions',
        description: 'Practice asking for and giving directions in a new city',
        difficulty: ['beginner', 'intermediate', 'advanced'],
        roles: {
          user: {
            name: 'Tourist/Traveler',
            description: 'You are lost and need directions',
            objectives: [
              'Ask for directions clearly',
              'Understand the directions given',
              'Ask for clarification if needed',
              'Thank the person appropriately'
            ],
            personality: 'Polite but slightly anxious about being lost'
          },
          ai: {
            name: 'Local Resident',
            description: 'You are a helpful local person',
            personality: 'Friendly, patient, and knowledgeable about the area',
            characteristics: [
              'Willing to help tourists',
              'Gives clear, step-by-step directions',
              'Uses landmarks and reference points',
              'Offers additional helpful information'
            ]
          }
        },
        context: {
          setting: 'A busy street in a foreign city',
          atmosphere: 'Urban environment with people walking by',
          landmarks: 'Various shops, restaurants, and public buildings'
        },
        challenges: [
          'Understanding local street names',
          'Following complex directions',
          'Dealing with language barriers',
          'Remembering multiple steps'
        ],
        successCriteria: [
          'Ask for directions clearly',
          'Understand the main route',
          'Ask for clarification when needed',
          'Express gratitude appropriately'
        ]
      },
      'job_interview': {
        name: 'Job Interview',
        description: 'Practice professional communication in a job interview setting',
        difficulty: ['intermediate', 'advanced'],
        roles: {
          user: {
            name: 'Job Candidate',
            description: 'You are interviewing for a position',
            objectives: [
              'Answer interview questions clearly',
              'Ask thoughtful questions about the role',
              'Present your qualifications effectively',
              'Handle difficult questions professionally'
            ],
            personality: 'Professional, confident, and eager to impress'
          },
          ai: {
            name: 'Interviewer',
            description: 'You are a professional interviewer',
            personality: 'Professional, fair, and thorough',
            characteristics: [
              'Asks relevant questions',
              'Listens carefully to responses',
              'Provides feedback when appropriate',
              'Maintains professional demeanor'
            ]
          }
        },
        context: {
          setting: 'A professional office environment',
          atmosphere: 'Formal but welcoming',
          position: 'Various roles depending on user profile'
        },
        challenges: [
          'Answering behavioral questions',
          'Discussing salary and benefits',
          'Handling unexpected questions',
          'Maintaining professional composure'
        ],
        successCriteria: [
          'Answer questions clearly and concisely',
          'Ask relevant questions about the role',
          'Demonstrate professional communication',
          'Handle difficult questions gracefully'
        ]
      },
      'doctor_visit': {
        name: 'Doctor Visit',
        description: 'Practice medical communication and describing symptoms',
        difficulty: ['intermediate', 'advanced'],
        roles: {
          user: {
            name: 'Patient',
            description: 'You are visiting a doctor',
            objectives: [
              'Describe your symptoms clearly',
              'Answer medical history questions',
              'Ask questions about treatment',
              'Understand medical instructions'
            ],
            personality: 'Concerned about health but cooperative'
          },
          ai: {
            name: 'Doctor',
            description: 'You are a caring medical professional',
            personality: 'Professional, empathetic, and thorough',
            characteristics: [
              'Asks detailed questions about symptoms',
              'Explains medical terms clearly',
              'Provides reassurance when appropriate',
              'Gives clear treatment instructions'
            ]
          }
        },
        context: {
          setting: 'A medical clinic or hospital',
          atmosphere: 'Clean, professional, and reassuring',
          equipment: 'Standard medical examination tools'
        },
        challenges: [
          'Describing pain and symptoms accurately',
              'Understanding medical terminology',
              'Following treatment instructions',
              'Asking appropriate questions'
        ],
        successCriteria: [
          'Describe symptoms clearly',
          'Answer medical questions accurately',
          'Ask relevant questions about treatment',
          'Understand and follow instructions'
        ]
      }
    };
  }

  async createRoleplaySession({ userId, scenario, language, proficiencyLevel, customSettings = {} }) {
    try {
      const sessionId = uuidv4();
      const templates = this.getScenarioTemplates();
      const scenarioTemplate = templates[scenario];
      
      if (!scenarioTemplate) {
        throw new Error(`Scenario '${scenario}' not found`);
      }

      // Validate difficulty level
      if (!scenarioTemplate.difficulty.includes(proficiencyLevel)) {
        throw new Error(`Proficiency level '${proficiencyLevel}' not supported for scenario '${scenario}'`);
      }

      // Create roleplay session
      const session = {
        sessionId,
        userId,
        scenario,
        language,
        proficiencyLevel,
        status: 'active',
        createdAt: new Date().toISOString(),
        roles: scenarioTemplate.roles,
        context: scenarioTemplate.context,
        challenges: scenarioTemplate.challenges,
        successCriteria: scenarioTemplate.successCriteria,
        progress: {
          objectivesCompleted: [],
          challengesFaced: [],
          score: 0,
          timeSpent: 0,
          messagesExchanged: 0
        },
        customSettings,
        conversationId: null // Will be set when conversation starts
      };

      // Save to database
      await this.dynamoService.putItem(this.roleplayTable, session);

      return session;
    } catch (error) {
      console.error('Error creating roleplay session:', error);
      throw error;
    }
  }

  async startRoleplayConversation(sessionId, userId) {
    try {
      // Get roleplay session
      const session = await this.dynamoService.getItem(this.roleplayTable, { sessionId });
      
      if (!session || session.userId !== userId) {
        throw new Error('Roleplay session not found or access denied');
      }

      if (session.status !== 'active') {
        throw new Error('Roleplay session is not active');
      }

      // Create conversation for this roleplay
      const conversation = await this.conversationService.startConversation({
        userId,
        scenario: session.scenario,
        language: session.language,
        proficiencyLevel: session.proficiencyLevel
      });

      // Update session with conversation ID
      await this.dynamoService.updateItem(this.roleplayTable, { sessionId }, {
        conversationId: conversation.conversationId,
        status: 'in_progress',
        startedAt: new Date().toISOString()
      });

      // Generate roleplay-specific initial message
      const initialMessage = this.generateRoleplayInitialMessage(session);
      
      return {
        session,
        conversation,
        initialMessage
      };
    } catch (error) {
      console.error('Error starting roleplay conversation:', error);
      throw error;
    }
  }

  generateRoleplayInitialMessage(session) {
    const { roles, context, scenario } = session;
    const aiRole = roles.ai;
    
    const scenarioMessages = {
      'restaurant': `Welcome to our restaurant! I'm ${aiRole.name.toLowerCase()}, and I'll be taking care of you today. We have some wonderful specials this evening. Would you like to hear about them, or would you prefer to look at our menu first?`,
      'shopping': `Hello! Welcome to our store! I'm ${aiRole.name.toLowerCase()}, and I'd be happy to help you find what you're looking for. Are you shopping for anything specific today, or would you like to browse around?`,
      'directions': `Hello there! I noticed you look a bit lost. I'm a local here, and I'd be happy to help you find your way. Where are you trying to get to?`,
      'job_interview': `Good morning! I'm ${aiRole.name.toLowerCase()}, and I'll be conducting your interview today. Thank you for coming in. Please, have a seat and make yourself comfortable. Let's start with you telling me a bit about yourself.`,
      'doctor_visit': `Hello, I'm Dr. ${aiRole.name.toLowerCase()}. I see you're here for an appointment. Please, have a seat and tell me what brings you in today. How can I help you?`
    };

    return {
      type: 'ai',
      content: scenarioMessages[scenario] || `Hello! I'm ${aiRole.name.toLowerCase()}. Let's begin our ${scenario} scenario.`,
      role: aiRole.name,
      context: context,
      objectives: roles.user.objectives
    };
  }

  async processRoleplayMessage({ sessionId, userId, message, audioData }) {
    try {
      // Get roleplay session
      const session = await this.dynamoService.getItem(this.roleplayTable, { sessionId });
      
      if (!session || session.userId !== userId) {
        throw new Error('Roleplay session not found or access denied');
      }

      if (!session.conversationId) {
        throw new Error('Roleplay conversation not started');
      }

      // Process message through conversation service
      const response = await this.conversationService.processMessage({
        conversationId: session.conversationId,
        userId,
        message,
        audioData
      });

      // Analyze message for roleplay objectives
      const objectiveAnalysis = this.analyzeObjectiveProgress(message, session);
      
      // Update session progress
      const updatedProgress = {
        ...session.progress,
        messagesExchanged: session.progress.messagesExchanged + 1,
        objectivesCompleted: [...session.progress.objectivesCompleted, ...objectiveAnalysis.completed],
        challengesFaced: [...session.progress.challengesFaced, ...objectiveAnalysis.challenges],
        score: this.calculateRoleplayScore(session.progress, objectiveAnalysis)
      };

      await this.dynamoService.updateItem(this.roleplayTable, { sessionId }, {
        progress: updatedProgress,
        lastActivity: new Date().toISOString()
      });

      return {
        ...response,
        roleplayProgress: updatedProgress,
        objectives: session.roles.user.objectives,
        nextChallenges: this.suggestNextChallenges(session, objectiveAnalysis)
      };
    } catch (error) {
      console.error('Error processing roleplay message:', error);
      throw error;
    }
  }

  analyzeObjectiveProgress(message, session) {
    const completed = [];
    const challenges = [];
    const objectives = session.roles.user.objectives;
    const messageText = message.toLowerCase();

    // Check for objective completion
    objectives.forEach(objective => {
      const objectiveKeywords = this.getObjectiveKeywords(objective);
      const isCompleted = objectiveKeywords.some(keyword => messageText.includes(keyword));
      
      if (isCompleted && !session.progress.objectivesCompleted.includes(objective)) {
        completed.push(objective);
      }
    });

    // Check for challenges faced
    session.challenges.forEach(challenge => {
      const challengeKeywords = this.getChallengeKeywords(challenge);
      const isFaced = challengeKeywords.some(keyword => messageText.includes(keyword));
      
      if (isFaced && !session.progress.challengesFaced.includes(challenge)) {
        challenges.push(challenge);
      }
    });

    return { completed, challenges };
  }

  getObjectiveKeywords(objective) {
    const keywordMap = {
      'Order food and drinks': ['order', 'would like', 'i want', 'can i have', 'menu'],
      'Ask about menu items': ['what is', 'tell me about', 'ingredients', 'spicy', 'vegetarian'],
      'Handle special requests': ['allergy', 'dietary', 'substitute', 'without', 'instead of'],
      'Pay the bill and tip appropriately': ['bill', 'check', 'tip', 'payment', 'total'],
      'Find items you like': ['looking for', 'like this', 'interested in', 'perfect'],
      'Ask about sizes and availability': ['size', 'available', 'have this', 'in stock'],
      'Try on clothes': ['try on', 'fitting room', 'how does it look', 'fit'],
      'Make a purchase or return items': ['buy', 'purchase', 'return', 'exchange', 'refund'],
      'Ask for directions clearly': ['how to get', 'where is', 'directions', 'way to'],
      'Understand the directions given': ['okay', 'i understand', 'got it', 'clear'],
      'Ask for clarification if needed': ['can you repeat', 'clarify', 'not sure', 'confused'],
      'Thank the person appropriately': ['thank you', 'thanks', 'appreciate', 'grateful']
    };

    return keywordMap[objective] || [];
  }

  getChallengeKeywords(challenge) {
    const keywordMap = {
      'Dealing with dietary restrictions': ['allergy', 'vegetarian', 'vegan', 'gluten', 'dairy'],
      'Understanding local food names': ['what is', 'never heard', 'unfamiliar', 'local'],
      'Asking for recommendations': ['recommend', 'suggest', 'best', 'popular'],
      'Handling payment and tipping customs': ['tip', 'gratuity', 'custom', 'usual'],
      'Finding the right size': ['size', 'too big', 'too small', 'fit'],
      'Understanding fabric and care instructions': ['fabric', 'material', 'care', 'wash'],
      'Comparing different options': ['compare', 'difference', 'better', 'which one'],
      'Handling returns and exchanges': ['return', 'exchange', 'refund', 'change']
    };

    return keywordMap[challenge] || [];
  }

  calculateRoleplayScore(progress, analysis) {
    let score = progress.score;
    
    // Add points for completed objectives
    score += analysis.completed.length * 10;
    
    // Add points for facing challenges (shows engagement)
    score += analysis.challenges.length * 5;
    
    // Bonus for high message exchange
    if (progress.messagesExchanged > 10) {
      score += 5;
    }
    
    return Math.min(100, score); // Cap at 100
  }

  suggestNextChallenges(session, analysis) {
    const remainingObjectives = session.roles.user.objectives.filter(
      obj => !session.progress.objectivesCompleted.includes(obj)
    );
    
    const remainingChallenges = session.challenges.filter(
      challenge => !session.progress.challengesFaced.includes(challenge)
    );

    return {
      objectives: remainingObjectives.slice(0, 2),
      challenges: remainingChallenges.slice(0, 2),
      suggestions: this.generateChallengeSuggestions(session, analysis)
    };
  }

  generateChallengeSuggestions(session, analysis) {
    const suggestions = [];
    
    if (analysis.completed.length === 0) {
      suggestions.push('Try to engage with the scenario by asking questions or making requests');
    }
    
    if (session.progress.messagesExchanged < 5) {
      suggestions.push('Continue the conversation to practice more language skills');
    }
    
    if (analysis.challenges.length === 0) {
      suggestions.push('Try to face some of the scenario challenges to improve your skills');
    }

    return suggestions;
  }

  async endRoleplaySession(sessionId, userId) {
    try {
      const session = await this.dynamoService.getItem(this.roleplayTable, { sessionId });
      
      if (!session || session.userId !== userId) {
        throw new Error('Roleplay session not found or access denied');
      }

      // Calculate final score and feedback
      const finalScore = session.progress.score;
      const completionRate = session.progress.objectivesCompleted.length / session.roles.user.objectives.length;
      const challengeRate = session.progress.challengesFaced.length / session.challenges.length;

      const feedback = this.generateSessionFeedback(session, finalScore, completionRate, challengeRate);

      // Update session
      await this.dynamoService.updateItem(this.roleplayTable, { sessionId }, {
        status: 'completed',
        endedAt: new Date().toISOString(),
        finalScore,
        completionRate,
        challengeRate,
        feedback
      });

      return {
        session,
        finalScore,
        completionRate,
        challengeRate,
        feedback
      };
    } catch (error) {
      console.error('Error ending roleplay session:', error);
      throw error;
    }
  }

  generateSessionFeedback(session, score, completionRate, challengeRate) {
    const feedback = {
      overall: '',
      strengths: [],
      areasForImprovement: [],
      recommendations: []
    };

    // Overall feedback
    if (score >= 80) {
      feedback.overall = 'Excellent performance! You handled the scenario very well.';
    } else if (score >= 60) {
      feedback.overall = 'Good job! You did well with some areas for improvement.';
    } else if (score >= 40) {
      feedback.overall = 'Not bad, but there are several areas where you can improve.';
    } else {
      feedback.overall = 'Keep practicing! This scenario was challenging, but you can improve.';
    }

    // Strengths
    if (completionRate >= 0.8) {
      feedback.strengths.push('Completed most objectives successfully');
    }
    if (challengeRate >= 0.6) {
      feedback.strengths.push('Faced and handled challenges well');
    }
    if (session.progress.messagesExchanged >= 10) {
      feedback.strengths.push('Engaged actively in the conversation');
    }

    // Areas for improvement
    if (completionRate < 0.5) {
      feedback.areasForImprovement.push('Focus on completing more objectives');
    }
    if (challengeRate < 0.3) {
      feedback.areasForImprovement.push('Try to engage with more challenging situations');
    }
    if (session.progress.messagesExchanged < 5) {
      feedback.areasForImprovement.push('Practice more conversational exchanges');
    }

    // Recommendations
    if (score < 60) {
      feedback.recommendations.push('Practice this scenario again to improve your skills');
    }
    if (completionRate < 0.7) {
      feedback.recommendations.push('Review the scenario objectives and try to complete them');
    }
    if (challengeRate < 0.5) {
      feedback.recommendations.push('Challenge yourself with more difficult situations');
    }

    return feedback;
  }

  async getUserRoleplayHistory(userId, { limit = 10, offset = 0 } = {}) {
    try {
      const sessions = await this.dynamoService.scan(
        this.roleplayTable,
        'userId = :userId',
        { ':userId': userId }
      );

      return sessions
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(offset, offset + limit);
    } catch (error) {
      console.error('Error getting user roleplay history:', error);
      throw error;
    }
  }

  async getAvailableScenarios(language, proficiencyLevel) {
    try {
      const templates = this.getScenarioTemplates();
      const availableScenarios = [];

      Object.entries(templates).forEach(([key, template]) => {
        if (template.difficulty.includes(proficiencyLevel)) {
          availableScenarios.push({
            id: key,
            name: template.name,
            description: template.description,
            difficulty: template.difficulty,
            estimatedDuration: this.estimateScenarioDuration(template),
            objectives: template.roles.user.objectives.length,
            challenges: template.challenges.length
          });
        }
      });

      return availableScenarios;
    } catch (error) {
      console.error('Error getting available scenarios:', error);
      throw error;
    }
  }

  estimateScenarioDuration(template) {
    const baseDuration = {
      'restaurant': 15,
      'shopping': 20,
      'directions': 10,
      'job_interview': 30,
      'doctor_visit': 25
    };

    return baseDuration[template.name.toLowerCase().replace(' ', '_')] || 15;
  }
}

module.exports = new RoleplayService();
