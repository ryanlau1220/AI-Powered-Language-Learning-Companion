const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dynamoService = require('./dynamoService');

class UserService {
  constructor() {
    this.dynamoService = dynamoService;
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    this.usersTable = process.env.USERS_TABLE || 'ai-language-learning-backend-dev-users';
    this.conversationsTable = process.env.CONVERSATIONS_TABLE || 'ai-language-learning-backend-dev-conversations';
  }

  async registerUser({ username, email, password, nativeLanguage, targetLanguages }) {
    try {
      // Check if user already exists
      const existingUser = await this.getUserByEmail(email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const userId = uuidv4();
      const user = {
        userId,
        username,
        email,
        password: hashedPassword,
        nativeLanguage: nativeLanguage || 'en',
        targetLanguages: targetLanguages || ['en'],
        proficiencyLevels: { [targetLanguages?.[0] || 'en']: 'beginner' },
        interests: [],
        learningGoals: [],
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        isActive: true,
        preferences: {
          voiceId: 'Joanna',
          speakingSpeed: 'normal',
          feedbackLevel: 'moderate',
          scenarioPreferences: ['general']
        },
        progress: {
          totalConversations: 0,
          totalMessages: 0,
          averagePronunciationScore: 0,
          averageGrammarScore: 0,
          learningStreak: 0,
          lastLearningDate: null
        }
      };

      await this.dynamoService.putItem(this.usersTable, user);
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  }

  async loginUser({ email, password }) {
    try {
      const user = await this.getUserByEmail(email);
      if (!user) {
        throw new Error('Invalid email or password');
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      if (!user.isActive) {
        throw new Error('Account is deactivated');
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user.userId, 
          email: user.email,
          username: user.username
        },
        this.jwtSecret,
        { expiresIn: '24h' }
      );

      // Update last active
      await this.updateUser(user.userId, { lastActive: new Date().toISOString() });

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      return { user: userWithoutPassword, token };
    } catch (error) {
      console.error('Error logging in user:', error);
      throw error;
    }
  }

  async getUserByEmail(email) {
    try {
      const users = await this.dynamoService.scan(
        this.usersTable,
        'email = :email',
        { ':email': email }
      );
      
      return users.length > 0 ? users[0] : null;
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw error;
    }
  }

  async createUser(userData) {
    try {
      const userId = uuidv4();
      const user = {
        userId,
        email: userData.email,
        name: userData.name,
        nativeLanguage: userData.nativeLanguage || 'en',
        targetLanguages: userData.targetLanguages || ['en'],
        proficiencyLevels: userData.proficiencyLevels || { en: 'beginner' },
        interests: userData.interests || [],
        learningGoals: userData.learningGoals || [],
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        isActive: true,
        preferences: {
          voiceId: userData.voiceId || 'Joanna',
          speakingSpeed: userData.speakingSpeed || 'normal',
          feedbackLevel: userData.feedbackLevel || 'moderate',
          scenarioPreferences: userData.scenarioPreferences || ['general']
        },
        progress: {
          totalConversations: 0,
          totalMessages: 0,
          averagePronunciationScore: 0,
          averageGrammarScore: 0,
          learningStreak: 0,
          lastLearningDate: null
        }
      };

      await this.dynamoService.putItem(this.usersTable, user);
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async getUser(userId) {
    try {
      const user = await this.dynamoService.getItem(this.usersTable, { userId });
      
      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  }

  async getUserProfile(userId) {
    try {
      const user = await this.getUser(userId);
      
      // Return user without password
      const { password, ...userProfile } = user;
      return userProfile;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  async updateUserProfile(userId, updateData) {
    try {
      // Remove sensitive fields from update data
      const { password, userId: _, ...safeUpdateData } = updateData;
      
      const updatedUser = await this.updateUser(userId, {
        ...safeUpdateData,
        lastActive: new Date().toISOString()
      });

      // Return user without password
      const { password: __, ...userProfile } = updatedUser;
      return userProfile;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  async updateUser(userId, updateData) {
    try {
      const user = await this.getUser(userId);
      
      const updatedUser = {
        ...user,
        ...updateData,
        lastActive: new Date().toISOString()
      };

      await this.dynamoService.putItem('users', updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async getUserProgress(userId) {
    try {
      const user = await this.getUser(userId);
      
      // Get recent conversations for progress analysis
      const recentConversations = await this.dynamoService.queryByIndex(
        this.conversationsTable,
        'UserConversationsIndex',
        'userId',
        userId,
        { limit: 10 }
      );

      // Calculate progress metrics
      const progress = this.calculateProgressMetrics(user, recentConversations);
      
      return {
        ...user.progress,
        ...progress,
        recentActivity: recentConversations.map(conv => ({
          conversationId: conv.conversationId,
          scenario: conv.scenario,
          language: conv.language,
          createdAt: conv.createdAt,
          messageCount: conv.messages?.length || 0
        }))
      };
    } catch (error) {
      console.error('Error getting user progress:', error);
      throw error;
    }
  }

  calculateProgressMetrics(user, conversations) {
    if (!conversations || conversations.length === 0) {
      return user.progress;
    }

    const totalMessages = conversations.reduce((sum, conv) => 
      sum + (conv.messages?.length || 0), 0
    );

    const totalConversations = conversations.length;

    // Calculate average scores
    const conversationsWithScores = conversations.filter(conv => 
      conv.metadata?.pronunciationScore !== undefined
    );

    const averagePronunciationScore = conversationsWithScores.length > 0
      ? conversationsWithScores.reduce((sum, conv) => 
          sum + (conv.metadata.pronunciationScore || 0), 0
        ) / conversationsWithScores.length
      : 0;

    const averageGrammarScore = conversationsWithScores.length > 0
      ? conversationsWithScores.reduce((sum, conv) => 
          sum + (conv.metadata.grammarScore || 0), 0
        ) / conversationsWithScores.length
      : 0;

    // Calculate learning streak
    const learningStreak = this.calculateLearningStreak(conversations);

    return {
      totalConversations: user.progress.totalConversations + totalConversations,
      totalMessages: user.progress.totalMessages + totalMessages,
      averagePronunciationScore: Math.round(averagePronunciationScore * 100) / 100,
      averageGrammarScore: Math.round(averageGrammarScore * 100) / 100,
      learningStreak,
      lastLearningDate: conversations[0]?.createdAt || user.progress.lastLearningDate
    };
  }

  calculateLearningStreak(conversations) {
    if (!conversations || conversations.length === 0) return 0;

    // Sort conversations by date (most recent first)
    const sortedConversations = conversations.sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < sortedConversations.length; i++) {
      const convDate = new Date(sortedConversations[i].createdAt);
      convDate.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((today - convDate) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === i) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  async updateUserProgress(userId, progressData) {
    try {
      const user = await this.getUser(userId);
      
      const updatedProgress = {
        ...user.progress,
        ...progressData,
        lastLearningDate: new Date().toISOString()
      };

      await this.dynamoService.updateItem(this.usersTable, { userId }, {
        progress: updatedProgress,
        lastActive: new Date().toISOString()
      });

      return updatedProgress;
    } catch (error) {
      console.error('Error updating user progress:', error);
      throw error;
    }
  }
}

module.exports = new UserService();
