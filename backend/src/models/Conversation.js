class Conversation {
  constructor(data) {
    this.conversationId = data.conversationId;
    this.userId = data.userId;
    this.scenario = data.scenario || 'general';
    this.language = data.language || 'en';
    this.proficiencyLevel = data.proficiencyLevel || 'beginner';
    this.status = data.status || 'active';
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.messages = data.messages || [];
    this.metadata = {
      totalMessages: 0,
      averageResponseTime: 0,
      pronunciationScore: 0,
      grammarScore: 0,
      lastActivity: this.createdAt,
      ...data.metadata
    };
  }

  toJSON() {
    return {
      conversationId: this.conversationId,
      userId: this.userId,
      scenario: this.scenario,
      language: this.language,
      proficiencyLevel: this.proficiencyLevel,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      messages: this.messages,
      metadata: this.metadata
    };
  }

  addMessage(message) {
    this.messages.push({
      ...message,
      timestamp: message.timestamp || new Date().toISOString()
    });
    this.metadata.totalMessages = this.messages.length;
    this.metadata.lastActivity = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  getLastMessage() {
    return this.messages[this.messages.length - 1] || null;
  }

  getMessagesByType(type) {
    return this.messages.filter(message => message.type === type);
  }

  getUserMessages() {
    return this.getMessagesByType('user');
  }

  getAIMessages() {
    return this.getMessagesByType('ai');
  }

  updateMetadata(metadata) {
    this.metadata = {
      ...this.metadata,
      ...metadata,
      lastActivity: new Date().toISOString()
    };
    this.updatedAt = new Date().toISOString();
  }

  calculateAverageResponseTime() {
    const aiMessages = this.getAIMessages();
    if (aiMessages.length < 2) return 0;

    let totalTime = 0;
    let responseCount = 0;

    for (let i = 1; i < aiMessages.length; i++) {
      const currentMessage = aiMessages[i];
      const previousMessage = aiMessages[i - 1];
      
      const currentTime = new Date(currentMessage.timestamp);
      const previousTime = new Date(previousMessage.timestamp);
      const responseTime = currentTime - previousTime;
      
      if (responseTime > 0) {
        totalTime += responseTime;
        responseCount++;
      }
    }

    return responseCount > 0 ? totalTime / responseCount : 0;
  }

  calculatePronunciationScore() {
    const userMessages = this.getUserMessages();
    if (userMessages.length === 0) return 0;

    const messagesWithScores = userMessages.filter(msg => 
      msg.metadata && msg.metadata.pronunciationScore !== undefined
    );

    if (messagesWithScores.length === 0) return 0;

    const totalScore = messagesWithScores.reduce((sum, msg) => 
      sum + msg.metadata.pronunciationScore, 0
    );

    return totalScore / messagesWithScores.length;
  }

  calculateGrammarScore() {
    const userMessages = this.getUserMessages();
    if (userMessages.length === 0) return 0;

    const messagesWithScores = userMessages.filter(msg => 
      msg.metadata && msg.metadata.grammarScore !== undefined
    );

    if (messagesWithScores.length === 0) return 0;

    const totalScore = messagesWithScores.reduce((sum, msg) => 
      sum + msg.metadata.grammarScore, 0
    );

    return totalScore / messagesWithScores.length;
  }

  endConversation() {
    this.status = 'ended';
    this.updatedAt = new Date().toISOString();
    
    // Calculate final metrics
    this.metadata.averageResponseTime = this.calculateAverageResponseTime();
    this.metadata.pronunciationScore = this.calculatePronunciationScore();
    this.metadata.grammarScore = this.calculateGrammarScore();
  }

  isActive() {
    return this.status === 'active';
  }

  getDuration() {
    const start = new Date(this.createdAt);
    const end = new Date(this.updatedAt);
    return end - start;
  }
}

module.exports = Conversation;
