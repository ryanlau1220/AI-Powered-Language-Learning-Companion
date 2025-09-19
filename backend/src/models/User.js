class User {
  constructor(data) {
    this.userId = data.userId;
    this.email = data.email;
    this.name = data.name;
    this.nativeLanguage = data.nativeLanguage || 'en';
    this.targetLanguages = data.targetLanguages || ['en'];
    this.proficiencyLevels = data.proficiencyLevels || { en: 'beginner' };
    this.interests = data.interests || [];
    this.learningGoals = data.learningGoals || [];
    this.createdAt = data.createdAt || new Date().toISOString();
    this.lastActive = data.lastActive || new Date().toISOString();
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.preferences = {
      voiceId: data.voiceId || 'Joanna',
      speakingSpeed: data.speakingSpeed || 'normal',
      feedbackLevel: data.feedbackLevel || 'moderate',
      scenarioPreferences: data.scenarioPreferences || ['general'],
      ...data.preferences
    };
    this.progress = {
      totalConversations: 0,
      totalMessages: 0,
      averagePronunciationScore: 0,
      averageGrammarScore: 0,
      learningStreak: 0,
      lastLearningDate: null,
      ...data.progress
    };
  }

  toJSON() {
    return {
      userId: this.userId,
      email: this.email,
      name: this.name,
      nativeLanguage: this.nativeLanguage,
      targetLanguages: this.targetLanguages,
      proficiencyLevels: this.proficiencyLevels,
      interests: this.interests,
      learningGoals: this.learningGoals,
      createdAt: this.createdAt,
      lastActive: this.lastActive,
      isActive: this.isActive,
      preferences: this.preferences,
      progress: this.progress
    };
  }

  updateProgress(progressData) {
    this.progress = {
      ...this.progress,
      ...progressData,
      lastLearningDate: new Date().toISOString()
    };
    this.lastActive = new Date().toISOString();
  }

  addTargetLanguage(language, proficiencyLevel = 'beginner') {
    if (!this.targetLanguages.includes(language)) {
      this.targetLanguages.push(language);
    }
    this.proficiencyLevels[language] = proficiencyLevel;
  }

  removeTargetLanguage(language) {
    this.targetLanguages = this.targetLanguages.filter(lang => lang !== language);
    delete this.proficiencyLevels[language];
  }

  updateProficiencyLevel(language, level) {
    if (this.targetLanguages.includes(language)) {
      this.proficiencyLevels[language] = level;
    }
  }

  isLanguageSupported(language) {
    return this.targetLanguages.includes(language);
  }

  getProficiencyLevel(language) {
    return this.proficiencyLevels[language] || 'beginner';
  }
}

module.exports = User;
