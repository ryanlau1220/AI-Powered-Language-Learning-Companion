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
      // Check if user already exists
      const existingUser = await this.getUserByEmail(userData.email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const userId = uuidv4();
      const user = {
        userId,
        username: userData.username,
        email: userData.email,
        password: hashedPassword,
        nativeLanguage: userData.nativeLanguage || 'en',
        targetLanguages: userData.targetLanguages || ['en'],
        proficiencyLevels: userData.proficiencyLevels || { [userData.targetLanguages?.[0] || 'en']: 'beginner' },
        interests: userData.interests || [],
        learningGoals: userData.learningGoals || [],
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        isActive: true,
        preferences: userData.preferences || {
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

  // Enhanced progress tracking methods
  async getUserProgress(userId, timeframe = 'week') {
    try {
      const user = await this.getUser(userId);
      
      // Get conversations based on timeframe
      const conversations = await this.getConversationsByTimeframe(userId, timeframe);
      
      // Calculate comprehensive progress metrics
      const stats = this.calculateComprehensiveStats(user, conversations);
      const skillProgress = this.calculateSkillProgress(user, conversations);
      const achievements = await this.getUserAchievements(userId);
      const weeklyActivity = this.calculateWeeklyActivity(conversations);

      return {
        stats,
        skillProgress,
        achievements,
        weeklyActivity
      };
    } catch (error) {
      console.error('Error getting user progress:', error);
      throw error;
    }
  }

  async getConversationsByTimeframe(userId, timeframe) {
    try {
      const conversations = await this.dynamoService.queryByIndex(
        this.conversationsTable,
        'UserConversationsIndex',
        'userId',
        userId,
        { limit: 100 }
      );

      const now = new Date();
      let cutoffDate;

      switch (timeframe) {
        case 'week':
          cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      return conversations.filter(conv => 
        new Date(conv.createdAt) >= cutoffDate
      );
    } catch (error) {
      console.error('Error getting conversations by timeframe:', error);
      return [];
    }
  }

  calculateComprehensiveStats(user, conversations) {
    const totalSessions = conversations.length;
    const totalTimeSpent = conversations.reduce((sum, conv) => 
      sum + (conv.metadata?.timeSpent || 0), 0
    );
    
    const totalMessages = conversations.reduce((sum, conv) => 
      sum + (conv.messages?.length || 0), 0
    );

    // Calculate average scores
    const conversationsWithScores = conversations.filter(conv => 
      conv.metadata?.pronunciationScore !== undefined || 
      conv.metadata?.grammarScore !== undefined
    );

    const averageScore = conversationsWithScores.length > 0
      ? conversationsWithScores.reduce((sum, conv) => {
          const pronunciationScore = conv.metadata?.pronunciationScore || 0;
          const grammarScore = conv.metadata?.grammarScore || 0;
          return sum + (pronunciationScore + grammarScore) / 2;
        }, 0) / conversationsWithScores.length
      : 0;

    const streakDays = this.calculateLearningStreak(conversations);
    const completedLessons = conversations.filter(conv => 
      conv.status === 'completed'
    ).length;

    const totalWordsLearned = conversations.reduce((sum, conv) => 
      sum + (conv.metadata?.wordsLearned || 0), 0
    );

    const accuracyRate = conversationsWithScores.length > 0
      ? conversationsWithScores.reduce((sum, conv) => {
          const accuracy = conv.metadata?.accuracyRate || 0;
          return sum + accuracy;
        }, 0) / conversationsWithScores.length
      : 0;

    return {
      totalSessions,
      totalTimeSpent,
      averageScore: Math.round(averageScore * 100) / 100,
      streakDays,
      completedLessons,
      totalWordsLearned,
      accuracyRate: Math.round(accuracyRate * 100) / 100
    };
  }

  calculateSkillProgress(user, conversations) {
    const skills = ['speaking', 'writing', 'reading', 'listening'];
    const skillProgress = [];

    skills.forEach(skill => {
      const skillConversations = conversations.filter(conv => 
        conv.metadata?.skillType === skill || 
        (skill === 'speaking' && conv.messages?.some(msg => msg.type === 'user'))
      );

      if (skillConversations.length > 0) {
        const scores = skillConversations.map(conv => {
          switch (skill) {
            case 'speaking':
              return conv.metadata?.pronunciationScore || 0;
            case 'writing':
              return conv.metadata?.grammarScore || 0;
            case 'reading':
              return conv.metadata?.readingScore || 0;
            case 'listening':
              return conv.metadata?.listeningScore || 0;
            default:
              return 0;
          }
        });

        const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        const progress = Math.min(100, Math.round(averageScore));
        
        let level = 'beginner';
        if (progress >= 80) level = 'advanced';
        else if (progress >= 60) level = 'intermediate';

        skillProgress.push({
          skill,
          level,
          progress,
          lastPracticed: skillConversations[0]?.createdAt || new Date().toISOString(),
          nextMilestone: this.getNextMilestone(level, progress)
        });
      } else {
        skillProgress.push({
          skill,
          level: 'beginner',
          progress: 0,
          lastPracticed: null,
          nextMilestone: 'Begin practicing to get started!'
        });
      }
    });

    return skillProgress;
  }

  getNextMilestone(currentLevel, progress) {
    if (currentLevel === 'beginner') {
      return progress >= 50 ? 'Intermediate (60%)' : 'Intermediate (50%)';
    } else if (currentLevel === 'intermediate') {
      return progress >= 80 ? 'Advanced (85%)' : 'Advanced (80%)';
    } else {
      return progress >= 95 ? 'Expert (98%)' : 'Expert (95%)';
    }
  }

  async getUserAchievements(userId) {
    try {
      const user = await this.getUser(userId);
      const conversations = await this.getConversationsByTimeframe(userId, 'all');
      
      const achievements = [
        {
          id: '1',
          title: 'First Steps',
          description: 'Complete your first lesson',
          icon: '🎯',
          earned: conversations.length > 0,
          earnedDate: conversations.length > 0 ? conversations[conversations.length - 1].createdAt : null
        },
        {
          id: '2',
          title: 'Week Warrior',
          description: 'Practice for 7 consecutive days',
          icon: '🔥',
          earned: user.progress.learningStreak >= 7,
          earnedDate: user.progress.learningStreak >= 7 ? new Date().toISOString() : null
        },
        {
          id: '3',
          title: 'Grammar Master',
          description: 'Achieve 90% accuracy in writing exercises',
          icon: '📝',
          earned: user.progress.averageGrammarScore >= 90,
          progress: Math.min(100, user.progress.averageGrammarScore),
          maxProgress: 90
        },
        {
          id: '4',
          title: 'Speaking Star',
          description: 'Complete 50 speaking exercises',
          icon: '🎤',
          earned: conversations.filter(conv => conv.metadata?.skillType === 'speaking').length >= 50,
          progress: Math.min(50, conversations.filter(conv => conv.metadata?.skillType === 'speaking').length),
          maxProgress: 50
        },
        {
          id: '5',
          title: 'Reading Champion',
          description: 'Read 100 articles',
          icon: '📚',
          earned: conversations.filter(conv => conv.metadata?.skillType === 'reading').length >= 100,
          progress: Math.min(100, conversations.filter(conv => conv.metadata?.skillType === 'reading').length),
          maxProgress: 100
        },
        {
          id: '6',
          title: 'Perfect Week',
          description: 'Get 100% score for 7 days straight',
          icon: '⭐',
          earned: false, // This would require more complex logic
          progress: 0,
          maxProgress: 7
        }
      ];

      return achievements;
    } catch (error) {
      console.error('Error getting user achievements:', error);
      return [];
    }
  }

  calculateWeeklyActivity(conversations) {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weeklyActivity = [];

    // Get the last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayConversations = conversations.filter(conv => {
        const convDate = new Date(conv.createdAt);
        return convDate >= date && convDate < nextDate;
      });

      const sessions = dayConversations.length;
      const timeSpent = dayConversations.reduce((sum, conv) => 
        sum + (conv.metadata?.timeSpent || 0), 0
      );
      
      const scores = dayConversations.map(conv => {
        const pronunciationScore = conv.metadata?.pronunciationScore || 0;
        const grammarScore = conv.metadata?.grammarScore || 0;
        return (pronunciationScore + grammarScore) / 2;
      });
      
      const score = scores.length > 0 
        ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
        : 0;

      weeklyActivity.push({
        day: days[date.getDay()],
        sessions,
        timeSpent,
        score
      });
    }

    return weeklyActivity;
  }

  async getLearningStats(userId, period = 'week') {
    try {
      const conversations = await this.getConversationsByTimeframe(userId, period);
      
      const stats = {
        totalSessions: conversations.length,
        totalTimeSpent: conversations.reduce((sum, conv) => 
          sum + (conv.metadata?.timeSpent || 0), 0
        ),
        averageScore: 0,
        improvementRate: 0,
        mostActiveDay: 'Monday',
        favoriteScenario: 'general'
      };

      if (conversations.length > 0) {
        const scores = conversations.map(conv => {
          const pronunciationScore = conv.metadata?.pronunciationScore || 0;
          const grammarScore = conv.metadata?.grammarScore || 0;
          return (pronunciationScore + grammarScore) / 2;
        });

        stats.averageScore = Math.round(
          scores.reduce((sum, score) => sum + score, 0) / scores.length
        );

        // Calculate improvement rate (simplified)
        const firstHalf = conversations.slice(0, Math.floor(conversations.length / 2));
        const secondHalf = conversations.slice(Math.floor(conversations.length / 2));
        
        if (firstHalf.length > 0 && secondHalf.length > 0) {
          const firstHalfAvg = firstHalf.reduce((sum, conv) => {
            const pronunciationScore = conv.metadata?.pronunciationScore || 0;
            const grammarScore = conv.metadata?.grammarScore || 0;
            return sum + (pronunciationScore + grammarScore) / 2;
          }, 0) / firstHalf.length;

          const secondHalfAvg = secondHalf.reduce((sum, conv) => {
            const pronunciationScore = conv.metadata?.pronunciationScore || 0;
            const grammarScore = conv.metadata?.grammarScore || 0;
            return sum + (pronunciationScore + grammarScore) / 2;
          }, 0) / secondHalf.length;

          stats.improvementRate = Math.round((secondHalfAvg - firstHalfAvg) * 100) / 100;
        }
      }

      return stats;
    } catch (error) {
      console.error('Error getting learning stats:', error);
      throw error;
    }
  }

  async getSkillBreakdown(userId) {
    try {
      const conversations = await this.getConversationsByTimeframe(userId, 'month');
      const skills = ['speaking', 'writing', 'reading', 'listening'];
      
      const skillBreakdown = skills.map(skill => {
        const skillConversations = conversations.filter(conv => 
          conv.metadata?.skillType === skill
        );

        const totalTime = skillConversations.reduce((sum, conv) => 
          sum + (conv.metadata?.timeSpent || 0), 0
        );

        const scores = skillConversations.map(conv => {
          switch (skill) {
            case 'speaking':
              return conv.metadata?.pronunciationScore || 0;
            case 'writing':
              return conv.metadata?.grammarScore || 0;
            case 'reading':
              return conv.metadata?.readingScore || 0;
            case 'listening':
              return conv.metadata?.listeningScore || 0;
            default:
              return 0;
          }
        });

        const averageScore = scores.length > 0
          ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
          : 0;

        return {
          skill,
          sessions: skillConversations.length,
          totalTime,
          averageScore,
          lastPracticed: skillConversations.length > 0 
            ? skillConversations[0].createdAt 
            : null
        };
      });

      return skillBreakdown;
    } catch (error) {
      console.error('Error getting skill breakdown:', error);
      throw error;
    }
  }
}

module.exports = new UserService();
