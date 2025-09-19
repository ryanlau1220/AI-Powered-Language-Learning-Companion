const AWS = require('aws-sdk');

// Configure Bedrock for Singapore region
const singaporeRegion = process.env.BEDROCK_REGION || 'ap-southeast-1';

// Configure AWS with explicit credentials
AWS.config.update({
  region: singaporeRegion,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

class BedrockService {
  constructor() {
    this.bedrock = new AWS.BedrockRuntime({ region: singaporeRegion });
    this.bedrockAgent = new AWS.BedrockAgent({ region: singaporeRegion });
  }

  async generateInitialResponse({ scenario, language, proficiencyLevel }) {
    try {
      const prompt = this.buildInitialPrompt({ scenario, language, proficiencyLevel });
      
      const response = await this.invokeModel(prompt);
      
      return {
        text: response.text,
        confidence: response.confidence || 0.8,
        sentiment: response.sentiment || 'neutral'
      };
    } catch (error) {
      console.error('Error generating initial response:', error);
      throw error;
    }
  }

  async generateResponse({ conversationHistory, userMessage, lexIntent, scenario, language, proficiencyLevel }) {
    try {
      const prompt = this.buildConversationPrompt({
        conversationHistory,
        userMessage,
        lexIntent,
        scenario,
        language,
        proficiencyLevel
      });
      
      const response = await this.invokeModel(prompt);
      
      return {
        text: response.text,
        confidence: response.confidence || 0.8,
        sentiment: response.sentiment || 'neutral',
        grammarSuggestions: response.grammarSuggestions || [],
        pronunciationTips: response.pronunciationTips || []
      };
    } catch (error) {
      console.error('Error generating response:', error);
      throw error;
    }
  }

  async analyzeGrammar({ text, language, proficiencyLevel, context }) {
    try {
      const prompt = this.buildGrammarAnalysisPrompt({
        text,
        language,
        proficiencyLevel,
        context
      });
      
      const response = await this.invokeModel(prompt);
      
      return {
        originalText: text,
        correctedText: response.correctedText || text,
        grammarScore: response.grammarScore || 0.8,
        errors: response.errors || [],
        suggestions: response.suggestions || [],
        explanations: response.explanations || [],
        difficultyLevel: response.difficultyLevel || proficiencyLevel,
        learningPoints: response.learningPoints || []
      };
    } catch (error) {
      console.error('Error analyzing grammar:', error);
      // Fallback to basic grammar analysis
      return this.basicGrammarAnalysis(text, language, proficiencyLevel);
    }
  }

  async contextualGrammarCorrection({ text, conversationContext, language, proficiencyLevel }) {
    try {
      const prompt = this.buildContextualGrammarPrompt({
        text,
        conversationContext,
        language,
        proficiencyLevel
      });
      
      const response = await this.invokeModel(prompt);
      
      return {
        originalText: text,
        correctedText: response.correctedText || text,
        contextualCorrections: response.contextualCorrections || [],
        styleImprovements: response.styleImprovements || [],
        fluencyEnhancements: response.fluencyEnhancements || [],
        culturalNotes: response.culturalNotes || [],
        overallScore: response.overallScore || 0.8,
        detailedFeedback: response.detailedFeedback || []
      };
    } catch (error) {
      console.error('Error in contextual grammar correction:', error);
      return this.basicGrammarAnalysis(text, language, proficiencyLevel);
    }
  }

  async invokeModel(prompt) {
    try {
      const modelId = process.env.BEDROCK_MODEL_ID || 'amazon.nova-pro-v1:0';
      
      const params = {
        modelId: modelId,
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.7
        })
      };

      const result = await this.bedrock.invokeModel(params).promise();
      const response = JSON.parse(result.body.toString());
      
      return {
        text: response.output.message.content[0].text,
        confidence: 0.8, // Nova doesn't provide confidence scores
        sentiment: this.analyzeSentiment(response.output.message.content[0].text)
      };
    } catch (error) {
      console.error('Error invoking Bedrock model:', error);
      // Return fallback response
      return this.getFallbackResponse();
    }
  }

  buildInitialPrompt({ scenario, language, proficiencyLevel }) {
    const scenarios = {
      'restaurant': 'You are a friendly waiter at a restaurant. Help the customer order food and answer questions about the menu.',
      'shopping': 'You are a helpful shop assistant. Help the customer find items and answer questions about products.',
      'directions': 'You are a helpful local person. Give directions and help the customer navigate the city.',
      'general': 'You are a friendly language learning tutor. Have a casual conversation to help practice the language.'
    };

    const proficiencyLevels = {
      'beginner': 'Use simple vocabulary and short sentences. Speak slowly and clearly.',
      'intermediate': 'Use moderate vocabulary and varied sentence structures. Include some idiomatic expressions.',
      'advanced': 'Use complex vocabulary and sophisticated sentence structures. Include cultural references and nuances.'
    };

    const scenarioContext = scenarios[scenario] || scenarios['general'];
    const proficiencyContext = proficiencyLevels[proficiencyLevel] || proficiencyLevels['beginner'];

    return `You are an AI language learning tutor. ${scenarioContext}

Language: ${language}
Proficiency Level: ${proficiencyLevel}
Instructions: ${proficiencyContext}

Start the conversation with a friendly greeting and introduce the scenario. Keep your response under 100 words and make it engaging for language learning.

Response:`;
  }

  buildConversationPrompt({ conversationHistory, userMessage, lexIntent, scenario, language, proficiencyLevel }) {
    const historyText = conversationHistory
      .slice(-6) // Last 6 messages for context
      .map(msg => `${msg.type}: ${msg.content}`)
      .join('\n');

    return `You are an AI language learning tutor in a ${scenario} scenario.

Language: ${language}
Proficiency Level: ${proficiencyLevel}
User Intent: ${lexIntent}

Conversation History:
${historyText}

User Message: ${userMessage}

Respond naturally to the user's message. Provide helpful corrections if needed, but don't be overly critical. Keep the conversation flowing and educational. If there are grammar issues, subtly correct them in your response.

Response:`;
  }

  buildGrammarAnalysisPrompt({ text, language, proficiencyLevel, context }) {
    return `You are an expert ${language} grammar tutor. Analyze the following text and provide detailed grammar feedback.

Text to analyze: "${text}"
Language: ${language}
Proficiency Level: ${proficiencyLevel}
Context: ${context || 'General conversation'}

Please provide:
1. Corrected version of the text
2. Grammar score (0-1)
3. List of errors found
4. Specific suggestions for improvement
5. Explanations of grammar rules
6. Learning points for the student

Format your response as JSON with these fields:
- correctedText: string
- grammarScore: number
- errors: array of {type, description, position, suggestion}
- suggestions: array of {rule, explanation, example}
- explanations: array of {concept, explanation, examples}
- learningPoints: array of {topic, importance, practice_tip}`;
  }

  buildContextualGrammarPrompt({ text, conversationContext, language, proficiencyLevel }) {
    const contextText = conversationContext.map(msg => 
      `${msg.type}: ${msg.content}`
    ).join('\n');
    
    return `You are an expert ${language} tutor providing contextual grammar correction. Consider the conversation context and provide nuanced feedback.

Conversation Context:
${contextText}

Text to correct: "${text}"
Language: ${language}
Proficiency Level: ${proficiencyLevel}

Provide contextual grammar correction that considers:
1. The flow of the conversation
2. Cultural appropriateness
3. Natural language patterns
4. Style and register
5. Fluency improvements

Format your response as JSON with these fields:
- correctedText: string
- contextualCorrections: array of {original, corrected, reason, context}
- styleImprovements: array of {suggestion, explanation, example}
- fluencyEnhancements: array of {improvement, reason, alternative}
- culturalNotes: array of {note, explanation, context}
- overallScore: number
- detailedFeedback: array of {category, feedback, examples}`;
  }

  analyzeSentiment(text) {
    // Simple sentiment analysis
    const positiveWords = ['good', 'great', 'excellent', 'wonderful', 'amazing', 'fantastic'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'disappointing'];
    
    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  getFallbackResponse() {
    const fallbackResponses = [
      "I understand you're practicing your language skills. Could you tell me more about what you'd like to work on?",
      "That's interesting! Let's continue our conversation. What would you like to talk about next?",
      "Great effort! I'm here to help you practice. What topic interests you most?",
      "I'm enjoying our conversation! What would you like to learn about today?"
    ];
    
    const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    
    return {
      text: randomResponse,
      confidence: 0.5,
      sentiment: 'neutral'
    };
  }

  basicGrammarAnalysis(text, language, proficiencyLevel) {
    // Fallback basic grammar analysis when Bedrock is not available
    const errors = [];
    const suggestions = [];
    let correctedText = text;
    let grammarScore = 0.8; // Base score

    // Basic English grammar checks
    if (language === 'en' || language === 'en-US') {
      // Check for common errors
      const commonErrors = [
        { pattern: /\bi\s+am\s+go\b/gi, correction: 'I am going', type: 'verb_tense' },
        { pattern: /\bhe\s+go\b/gi, correction: 'he goes', type: 'subject_verb_agreement' },
        { pattern: /\bthey\s+is\b/gi, correction: 'they are', type: 'subject_verb_agreement' },
        { pattern: /\bdon't\s+can\b/gi, correction: "can't", type: 'auxiliary_verb' },
        { pattern: /\bme\s+and\s+him\b/gi, correction: 'he and I', type: 'pronoun_case' }
      ];

      commonErrors.forEach(error => {
        if (error.pattern.test(text)) {
          correctedText = correctedText.replace(error.pattern, error.correction);
          errors.push({
            type: error.type,
            description: `Incorrect usage: "${error.pattern.source}"`,
            position: text.search(error.pattern),
            suggestion: error.correction
          });
          grammarScore -= 0.1;
        }
      });

      // Check for missing articles
      const articlePattern = /\b(?:a|an|the)\s+(?:a|an|the)\b/gi;
      if (articlePattern.test(text)) {
        errors.push({
          type: 'article_usage',
          description: 'Double article usage detected',
          position: text.search(articlePattern),
          suggestion: 'Remove one article'
        });
        grammarScore -= 0.05;
      }

      // Check for capitalization
      if (!/^[A-Z]/.test(text.trim())) {
        errors.push({
          type: 'capitalization',
          description: 'Sentence should start with capital letter',
          position: 0,
          suggestion: 'Capitalize the first letter'
        });
        correctedText = correctedText.charAt(0).toUpperCase() + correctedText.slice(1);
        grammarScore -= 0.05;
      }

      // Generate suggestions based on proficiency level
      if (proficiencyLevel === 'beginner') {
        suggestions.push({
          rule: 'Subject-Verb Agreement',
          explanation: 'Make sure the verb matches the subject (he goes, not he go)',
          example: 'He goes to school every day.'
        });
        suggestions.push({
          rule: 'Articles',
          explanation: 'Use "a" before consonant sounds, "an" before vowel sounds',
          example: 'a book, an apple'
        });
      } else if (proficiencyLevel === 'intermediate') {
        suggestions.push({
          rule: 'Present Perfect',
          explanation: 'Use present perfect for actions that started in the past and continue to the present',
          example: 'I have lived here for five years.'
        });
        suggestions.push({
          rule: 'Conditional Sentences',
          explanation: 'Use "if" clauses with appropriate verb forms',
          example: 'If I had time, I would help you.'
        });
      } else {
        suggestions.push({
          rule: 'Subjunctive Mood',
          explanation: 'Use subjunctive for hypothetical or contrary-to-fact situations',
          example: 'If I were you, I would study harder.'
        });
        suggestions.push({
          rule: 'Complex Sentence Structures',
          explanation: 'Combine ideas using relative clauses and conjunctions',
          example: 'The book, which I read last week, was very interesting.'
        });
      }
    }

    // Ensure score is between 0 and 1
    grammarScore = Math.max(0, Math.min(1, grammarScore));

    return {
      originalText: text,
      correctedText: correctedText,
      grammarScore: grammarScore,
      errors: errors,
      suggestions: suggestions,
      explanations: suggestions.map(s => ({
        concept: s.rule,
        explanation: s.explanation,
        examples: [s.example]
      })),
      difficultyLevel: proficiencyLevel,
      learningPoints: suggestions.map(s => ({
        topic: s.rule,
        importance: errors.some(e => e.type.includes(s.rule.toLowerCase())) ? 'high' : 'medium',
        practice_tip: `Practice using ${s.rule} in different contexts`
      }))
    };
  }
}

module.exports = new BedrockService();
