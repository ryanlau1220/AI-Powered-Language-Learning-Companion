const dynamoService = require('./dynamoService');
const conversationService = require('./conversationService');
const userService = require('./userService');

class AdaptiveLearningService {
  constructor() {
    this.dynamoService = dynamoService;
    this.conversationService = conversationService;
    this.userService = userService;
    this.usersTable = process.env.USERS_TABLE || 'ai-language-learning-backend-dev-users';
    this.conversationsTable = process.env.CONVERSATIONS_TABLE || 'ai-language-learning-backend-dev-conversations';
  }

  async analyzeUserProgress(userId) {
    try {
      // Get user profile and recent conversations
      const user = await this.userService.getUser(userId);
      const recentConversations = await this.conversationService.getUserConversations(userId, { limit: 20 });
      
      // Analyze learning patterns
      const progressAnalysis = {
        userId,
        currentProficiency: user.proficiencyLevels,
        learningStreak: user.progress.learningStreak,
        totalConversations: user.progress.totalConversations,
        averageScores: {
          pronunciation: user.progress.averagePronunciationScore,
          grammar: user.progress.averageGrammarScore
        },
        strengths: [],
        weaknesses: [],
        learningVelocity: 0,
        engagementLevel: 'medium',
        recommendedFocus: [],
        difficultyAdjustment: 0,
        nextMilestones: []
      };

      // Analyze conversation patterns
      if (recentConversations.length > 0) {
        const conversationAnalysis = this.analyzeConversationPatterns(recentConversations);
        progressAnalysis.strengths = conversationAnalysis.strengths;
        progressAnalysis.weaknesses = conversationAnalysis.weaknesses;
        progressAnalysis.learningVelocity = conversationAnalysis.learningVelocity;
        progressAnalysis.engagementLevel = conversationAnalysis.engagementLevel;
      }

      // Generate recommendations
      progressAnalysis.recommendedFocus = this.generateFocusRecommendations(progressAnalysis);
      progressAnalysis.difficultyAdjustment = this.calculateDifficultyAdjustment(progressAnalysis);
      progressAnalysis.nextMilestones = this.generateMilestones(progressAnalysis);

      return progressAnalysis;
    } catch (error) {
      console.error('Error analyzing user progress:', error);
      throw error;
    }
  }

  analyzeConversationPatterns(conversations) {
    const analysis = {
      strengths: [],
      weaknesses: [],
      learningVelocity: 0,
      engagementLevel: 'medium'
    };

    // Analyze conversation frequency and duration
    const totalMessages = conversations.reduce((sum, conv) => sum + (conv.messages?.length || 0), 0);
    const avgMessagesPerConversation = totalMessages / conversations.length;
    
    // Determine engagement level
    if (avgMessagesPerConversation > 15) {
      analysis.engagementLevel = 'high';
    } else if (avgMessagesPerConversation < 5) {
      analysis.engagementLevel = 'low';
    }

    // Analyze language usage patterns
    const languageUsage = {};
    const scenarioUsage = {};
    
    conversations.forEach(conv => {
      languageUsage[conv.language] = (languageUsage[conv.language] || 0) + 1;
      scenarioUsage[conv.scenario] = (scenarioUsage[conv.scenario] || 0) + 1;
    });

    // Identify strengths and weaknesses
    const mostUsedLanguage = Object.keys(languageUsage).reduce((a, b) => 
      languageUsage[a] > languageUsage[b] ? a : b
    );
    const mostUsedScenario = Object.keys(scenarioUsage).reduce((a, b) => 
      scenarioUsage[a] > scenarioUsage[b] ? a : b
    );

    analysis.strengths.push({
      area: 'language_preference',
      language: mostUsedLanguage,
      confidence: languageUsage[mostUsedLanguage] / conversations.length
    });

    analysis.strengths.push({
      area: 'scenario_comfort',
      scenario: mostUsedScenario,
      confidence: scenarioUsage[mostUsedScenario] / conversations.length
    });

    // Calculate learning velocity based on improvement over time
    if (conversations.length >= 5) {
      const recentConversations = conversations.slice(0, 5);
      const olderConversations = conversations.slice(5, 10);
      
      if (olderConversations.length > 0) {
        const recentAvgScore = this.calculateAverageScore(recentConversations);
        const olderAvgScore = this.calculateAverageScore(olderConversations);
        analysis.learningVelocity = recentAvgScore - olderAvgScore;
      }
    }

    return analysis;
  }

  calculateAverageScore(conversations) {
    const scores = conversations
      .filter(conv => conv.metadata?.pronunciationScore !== undefined || conv.metadata?.grammarScore !== undefined)
      .map(conv => {
        const pronunciationScore = conv.metadata?.pronunciationScore || 0.5;
        const grammarScore = conv.metadata?.grammarScore || 0.5;
        return (pronunciationScore + grammarScore) / 2;
      });

    return scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0.5;
  }

  generateFocusRecommendations(progressAnalysis) {
    const recommendations = [];

    // Pronunciation focus
    if (progressAnalysis.averageScores.pronunciation < 0.7) {
      recommendations.push({
        area: 'pronunciation',
        priority: 'high',
        description: 'Focus on improving pronunciation accuracy',
        exercises: ['phoneme_practice', 'word_stress', 'intonation'],
        estimatedTime: '2-3 weeks'
      });
    }

    // Grammar focus
    if (progressAnalysis.averageScores.grammar < 0.7) {
      recommendations.push({
        area: 'grammar',
        priority: 'high',
        description: 'Strengthen grammar fundamentals',
        exercises: ['sentence_structure', 'verb_tenses', 'articles'],
        estimatedTime: '3-4 weeks'
      });
    }

    // Vocabulary expansion
    if (progressAnalysis.learningVelocity < 0.1) {
      recommendations.push({
        area: 'vocabulary',
        priority: 'medium',
        description: 'Expand vocabulary for better expression',
        exercises: ['word_games', 'context_learning', 'idioms'],
        estimatedTime: '2-3 weeks'
      });
    }

    // Conversation fluency
    if (progressAnalysis.engagementLevel === 'low') {
      recommendations.push({
        area: 'fluency',
        priority: 'high',
        description: 'Increase conversation practice',
        exercises: ['daily_chat', 'role_playing', 'topic_discussion'],
        estimatedTime: '1-2 weeks'
      });
    }

    // Advanced skills
    if (progressAnalysis.averageScores.pronunciation > 0.8 && progressAnalysis.averageScores.grammar > 0.8) {
      recommendations.push({
        area: 'advanced_skills',
        priority: 'low',
        description: 'Develop advanced language skills',
        exercises: ['debate', 'presentation', 'creative_writing'],
        estimatedTime: '4-6 weeks'
      });
    }

    return recommendations;
  }

  calculateDifficultyAdjustment(progressAnalysis) {
    let adjustment = 0;

    // Adjust based on average scores
    const avgScore = (progressAnalysis.averageScores.pronunciation + progressAnalysis.averageScores.grammar) / 2;
    
    if (avgScore > 0.8) {
      adjustment += 0.2; // Increase difficulty
    } else if (avgScore < 0.5) {
      adjustment -= 0.2; // Decrease difficulty
    }

    // Adjust based on learning velocity
    if (progressAnalysis.learningVelocity > 0.1) {
      adjustment += 0.1; // User is learning quickly, increase difficulty
    } else if (progressAnalysis.learningVelocity < -0.1) {
      adjustment -= 0.1; // User is struggling, decrease difficulty
    }

    // Adjust based on engagement
    if (progressAnalysis.engagementLevel === 'high') {
      adjustment += 0.1; // High engagement, can handle more difficulty
    } else if (progressAnalysis.engagementLevel === 'low') {
      adjustment -= 0.1; // Low engagement, reduce difficulty
    }

    return Math.max(-0.5, Math.min(0.5, adjustment)); // Clamp between -0.5 and 0.5
  }

  generateMilestones(progressAnalysis) {
    const milestones = [];
    const currentLevel = this.getCurrentLevel(progressAnalysis);

    // Pronunciation milestones
    if (progressAnalysis.averageScores.pronunciation < 0.6) {
      milestones.push({
        type: 'pronunciation',
        target: 0.7,
        current: progressAnalysis.averageScores.pronunciation,
        description: 'Achieve 70% pronunciation accuracy',
        reward: 'Pronunciation Master Badge',
        estimatedTime: '2-3 weeks'
      });
    } else if (progressAnalysis.averageScores.pronunciation < 0.8) {
      milestones.push({
        type: 'pronunciation',
        target: 0.85,
        current: progressAnalysis.averageScores.pronunciation,
        description: 'Achieve 85% pronunciation accuracy',
        reward: 'Pronunciation Expert Badge',
        estimatedTime: '3-4 weeks'
      });
    }

    // Grammar milestones
    if (progressAnalysis.averageScores.grammar < 0.6) {
      milestones.push({
        type: 'grammar',
        target: 0.7,
        current: progressAnalysis.averageScores.grammar,
        description: 'Achieve 70% grammar accuracy',
        reward: 'Grammar Master Badge',
        estimatedTime: '3-4 weeks'
      });
    } else if (progressAnalysis.averageScores.grammar < 0.8) {
      milestones.push({
        type: 'grammar',
        target: 0.85,
        current: progressAnalysis.averageScores.grammar,
        description: 'Achieve 85% grammar accuracy',
        reward: 'Grammar Expert Badge',
        estimatedTime: '4-5 weeks'
      });
    }

    // Conversation milestones
    if (progressAnalysis.totalConversations < 10) {
      milestones.push({
        type: 'conversation',
        target: 10,
        current: progressAnalysis.totalConversations,
        description: 'Complete 10 conversations',
        reward: 'Conversation Starter Badge',
        estimatedTime: '1-2 weeks'
      });
    } else if (progressAnalysis.totalConversations < 50) {
      milestones.push({
        type: 'conversation',
        target: 50,
        current: progressAnalysis.totalConversations,
        description: 'Complete 50 conversations',
        reward: 'Conversation Champion Badge',
        estimatedTime: '4-6 weeks'
      });
    }

    // Learning streak milestones
    if (progressAnalysis.learningStreak < 7) {
      milestones.push({
        type: 'streak',
        target: 7,
        current: progressAnalysis.learningStreak,
        description: 'Maintain 7-day learning streak',
        reward: 'Week Warrior Badge',
        estimatedTime: '1 week'
      });
    } else if (progressAnalysis.learningStreak < 30) {
      milestones.push({
        type: 'streak',
        target: 30,
        current: progressAnalysis.learningStreak,
        description: 'Maintain 30-day learning streak',
        reward: 'Month Master Badge',
        estimatedTime: '3-4 weeks'
      });
    }

    return milestones;
  }

  getCurrentLevel(progressAnalysis) {
    const avgScore = (progressAnalysis.averageScores.pronunciation + progressAnalysis.averageScores.grammar) / 2;
    
    if (avgScore >= 0.9) return 'expert';
    if (avgScore >= 0.8) return 'advanced';
    if (avgScore >= 0.6) return 'intermediate';
    return 'beginner';
  }

  async generatePersonalizedLesson(userId, focusArea = null) {
    try {
      const progressAnalysis = await this.analyzeUserProgress(userId);
      const user = await this.userService.getUser(userId);
      
      // Determine focus area if not specified
      if (!focusArea) {
        const recommendations = progressAnalysis.recommendedFocus;
        focusArea = recommendations.length > 0 ? recommendations[0].area : 'general';
      }

      // Generate lesson based on focus area and user level
      const lesson = {
        userId,
        lessonId: `lesson-${Date.now()}`,
        focusArea,
        difficulty: this.calculateLessonDifficulty(progressAnalysis),
        scenarios: this.selectScenarios(focusArea, user.targetLanguages),
        exercises: this.generateExercises(focusArea, progressAnalysis),
        estimatedDuration: this.estimateDuration(focusArea, progressAnalysis),
        learningObjectives: this.generateObjectives(focusArea, progressAnalysis),
        successCriteria: this.generateSuccessCriteria(focusArea, progressAnalysis)
      };

      return lesson;
    } catch (error) {
      console.error('Error generating personalized lesson:', error);
      throw error;
    }
  }

  calculateLessonDifficulty(progressAnalysis) {
    const baseDifficulty = this.getCurrentLevel(progressAnalysis);
    const adjustment = progressAnalysis.difficultyAdjustment;
    
    const difficultyLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
    const currentIndex = difficultyLevels.indexOf(baseDifficulty);
    const adjustedIndex = Math.max(0, Math.min(difficultyLevels.length - 1, 
      currentIndex + Math.round(adjustment * 2)));
    
    return difficultyLevels[adjustedIndex];
  }

  selectScenarios(focusArea, targetLanguages) {
    const scenarioMap = {
      'pronunciation': ['restaurant', 'shopping', 'directions'],
      'grammar': ['general', 'restaurant', 'shopping'],
      'vocabulary': ['shopping', 'restaurant', 'general'],
      'fluency': ['general', 'restaurant', 'shopping', 'directions'],
      'advanced_skills': ['general', 'restaurant']
    };

    return scenarioMap[focusArea] || ['general'];
  }

  generateExercises(focusArea, progressAnalysis) {
    const exerciseMap = {
      'pronunciation': [
        { type: 'phoneme_practice', difficulty: progressAnalysis.difficultyAdjustment },
        { type: 'word_stress', difficulty: progressAnalysis.difficultyAdjustment },
        { type: 'intonation', difficulty: progressAnalysis.difficultyAdjustment }
      ],
      'grammar': [
        { type: 'sentence_structure', difficulty: progressAnalysis.difficultyAdjustment },
        { type: 'verb_tenses', difficulty: progressAnalysis.difficultyAdjustment },
        { type: 'articles', difficulty: progressAnalysis.difficultyAdjustment }
      ],
      'vocabulary': [
        { type: 'word_games', difficulty: progressAnalysis.difficultyAdjustment },
        { type: 'context_learning', difficulty: progressAnalysis.difficultyAdjustment },
        { type: 'idioms', difficulty: progressAnalysis.difficultyAdjustment }
      ],
      'fluency': [
        { type: 'daily_chat', difficulty: progressAnalysis.difficultyAdjustment },
        { type: 'role_playing', difficulty: progressAnalysis.difficultyAdjustment },
        { type: 'topic_discussion', difficulty: progressAnalysis.difficultyAdjustment }
      ]
    };

    return exerciseMap[focusArea] || [
      { type: 'general_practice', difficulty: progressAnalysis.difficultyAdjustment }
    ];
  }

  estimateDuration(focusArea, progressAnalysis) {
    const baseDuration = {
      'pronunciation': 20,
      'grammar': 25,
      'vocabulary': 15,
      'fluency': 30,
      'advanced_skills': 40
    };

    const duration = baseDuration[focusArea] || 20;
    const adjustment = Math.abs(progressAnalysis.difficultyAdjustment) * 10;
    
    return Math.round(duration + adjustment);
  }

  generateObjectives(focusArea, progressAnalysis) {
    const objectivesMap = {
      'pronunciation': [
        'Improve phoneme accuracy',
        'Master word stress patterns',
        'Develop natural intonation'
      ],
      'grammar': [
        'Strengthen sentence structure',
        'Master verb tense usage',
        'Improve article usage'
      ],
      'vocabulary': [
        'Expand active vocabulary',
        'Learn contextual word usage',
        'Master common idioms'
      ],
      'fluency': [
        'Increase conversation confidence',
        'Improve response speed',
        'Develop natural flow'
      ]
    };

    return objectivesMap[focusArea] || ['General language improvement'];
  }

  generateSuccessCriteria(focusArea, progressAnalysis) {
    const criteriaMap = {
      'pronunciation': [
        'Achieve 80% pronunciation accuracy',
        'Complete 5 pronunciation exercises',
        'Demonstrate improved word stress'
      ],
      'grammar': [
        'Achieve 80% grammar accuracy',
        'Complete 5 grammar exercises',
        'Demonstrate correct sentence structure'
      ],
      'vocabulary': [
        'Learn 20 new words',
        'Use new vocabulary in context',
        'Complete vocabulary exercises'
      ],
      'fluency': [
        'Complete 3 conversation scenarios',
        'Maintain conversation flow',
        'Demonstrate increased confidence'
      ]
    };

    return criteriaMap[focusArea] || ['Complete the lesson successfully'];
  }

  async updateLearningPath(userId, lessonResults) {
    try {
      // Update user progress based on lesson results
      const user = await this.userService.getUser(userId);
      const updatedProgress = {
        ...user.progress,
        lastLearningDate: new Date().toISOString(),
        learningStreak: user.progress.learningStreak + 1
      };

      // Update scores based on lesson performance
      if (lessonResults.pronunciationScore) {
        updatedProgress.averagePronunciationScore = this.calculateRunningAverage(
          user.progress.averagePronunciationScore,
          lessonResults.pronunciationScore,
          user.progress.totalConversations
        );
      }

      if (lessonResults.grammarScore) {
        updatedProgress.averageGrammarScore = this.calculateRunningAverage(
          user.progress.averageGrammarScore,
          lessonResults.grammarScore,
          user.progress.totalConversations
        );
      }

      // Update user progress
      await this.userService.updateUserProgress(userId, updatedProgress);

      // Generate next lesson recommendations
      const nextRecommendations = await this.analyzeUserProgress(userId);
      
      return {
        updatedProgress,
        nextRecommendations: nextRecommendations.recommendedFocus,
        nextMilestones: nextRecommendations.nextMilestones
      };
    } catch (error) {
      console.error('Error updating learning path:', error);
      throw error;
    }
  }

  calculateRunningAverage(currentAverage, newScore, totalCount) {
    return ((currentAverage * totalCount) + newScore) / (totalCount + 1);
  }
}

module.exports = new AdaptiveLearningService();
