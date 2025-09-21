const AWS = require('aws-sdk');
require('dotenv').config();

// Configure Bedrock for US East region (N. Virginia)
const usEastRegion = process.env.BEDROCK_REGION || 'us-east-1';
console.log('🔍 BedrockService - BEDROCK_REGION from env:', process.env.BEDROCK_REGION);
console.log('🔍 BedrockService - Using region:', usEastRegion);

// Configure AWS with explicit credentials
AWS.config.update({
  region: usEastRegion,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

class BedrockService {
  constructor() {
    this.bedrock = new AWS.BedrockRuntime({ region: usEastRegion });
    this.bedrockAgent = new AWS.BedrockAgent({ region: usEastRegion });
  }

  async generateInitialResponse({ scenario, language, proficiencyLevel, culturalContext }) {
    console.log('🚀 generateInitialResponse called with:', { scenario, language, proficiencyLevel, culturalContext });
    console.log('🔍 BEDROCK_MODEL_ID from env:', process.env.BEDROCK_MODEL_ID);
    
    try {
      const prompt = this.buildInitialPrompt({ scenario, language, proficiencyLevel, culturalContext });
      console.log('📝 Generated prompt:', prompt.substring(0, 100) + '...');
      
      const response = await this.invokeModel(prompt);
      
      return {
        text: response.text,
        confidence: response.confidence || 0.8,
        sentiment: response.sentiment || 'neutral',
        language: language,
        culturalContext: culturalContext || 'auto'
      };
    } catch (error) {
      console.error('Error generating initial response:', error);
      throw error;
    }
  }

  async generateResponse({ conversationHistory, userMessage, lexIntent, scenario, language, proficiencyLevel, culturalContext }) {
    try {
      const prompt = this.buildConversationPrompt({
        conversationHistory,
        userMessage,
        lexIntent,
        scenario,
        language,
        proficiencyLevel,
        culturalContext
      });
      
      const response = await this.invokeModel(prompt);
      
      return {
        text: response.text,
        confidence: response.confidence || 0.8,
        sentiment: response.sentiment || 'neutral',
        language: language,
        culturalContext: culturalContext || 'auto',
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
    const modelId = process.env.BEDROCK_MODEL_ID || 'amazon.nova-pro-v1:0';
    
    try {
      const params = {
        modelId: modelId,
        contentType: 'application/json',
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: [
                {
                  text: prompt
                }
              ]
            }
          ]
        })
      };

      const result = await this.bedrock.invokeModel(params).promise();
      const response = JSON.parse(result.body.toString());
      
      // Handle different response formats for different models
      let text;
      if (response.content && response.content[0] && response.content[0].text) {
        // Claude format
        text = response.content[0].text;
      } else if (response.output && response.output.message && response.output.message.content && response.output.message.content[0] && response.output.message.content[0].text) {
        // Nova format
        text = response.output.message.content[0].text;
      } else {
        text = "I'm sorry, I couldn't process your request properly.";
      }
      
      return {
        text: text,
        confidence: 0.8,
        sentiment: this.analyzeSentiment(text)
      };
    } catch (error) {
      console.error('Error invoking Bedrock model:', error);
      console.error('Model ID used:', modelId);
      console.error('Error details:', error.message);
      console.error('Error code:', error.code);
      // Return fallback response
      return this.getFallbackResponse();
    }
  }

  buildInitialPrompt({ scenario, language, proficiencyLevel, culturalContext }) {
    const scenarios = {
      'restaurant': {
        'en': 'You are a friendly waiter at a restaurant. Help the customer order food and answer questions about the menu.',
        'zh': '你是一家餐厅的友好服务员。帮助顾客点餐并回答关于菜单的问题。'
      },
      'shopping': {
        'en': 'You are a helpful shop assistant. Help the customer find items and answer questions about products.',
        'zh': '你是一个乐于助人的商店店员。帮助顾客找到商品并回答关于产品的问题。'
      },
      'directions': {
        'en': 'You are a helpful local person. Give directions and help the customer navigate the city.',
        'zh': '你是一个乐于助人的当地人。给顾客指路并帮助他们导航城市。'
      },
      'general': {
        'en': 'You are a friendly language learning tutor. Have a casual conversation to help practice the language.',
        'zh': '你是一个友好的语言学习导师。进行轻松的对话来帮助练习语言。'
      }
    };

    const proficiencyLevels = {
      'beginner': {
        'en': 'Use simple vocabulary and short sentences. Speak slowly and clearly. Provide encouragement and gentle corrections.',
        'zh': '使用简单的词汇和短句。说得慢一点、清楚一点。提供鼓励和温和的纠正。'
      },
      'intermediate': {
        'en': 'Use moderate vocabulary and varied sentence structures. Include some idiomatic expressions. Provide cultural context when relevant.',
        'zh': '使用中等词汇和多样化的句子结构。包含一些惯用表达。在相关时提供文化背景。'
      },
      'advanced': {
        'en': 'Use complex vocabulary and sophisticated sentence structures. Include cultural references and nuances. Engage in deeper conversations.',
        'zh': '使用复杂的词汇和精妙的句子结构。包含文化参考和细微差别。进行更深层次的对话。'
      }
    };

    const culturalInstructions = {
      'Western': 'Focus on Western cultural norms, politeness, and communication styles. Use appropriate Western social cues.',
      'Chinese': 'Focus on Chinese cultural norms, politeness, and communication styles. Use appropriate Chinese social cues and respect for hierarchy.',
      'auto': 'Adapt cultural context based on the detected language and user preferences.'
    };

    const scenarioContext = scenarios[scenario] || scenarios['general'];
    const proficiencyContext = proficiencyLevels[proficiencyLevel] || proficiencyLevels['beginner'];
    const culturalContextInstruction = culturalInstructions[culturalContext] || culturalInstructions['auto'];

    // Build language-specific prompt
    const isChinese = language === 'zh' || language === 'zh-CN' || language === 'zh-TW';
    const targetLanguage = isChinese ? 'Chinese' : 'English';
    const scenarioText = isChinese ? scenarioContext['zh'] : scenarioContext['en'];
    const proficiencyText = isChinese ? proficiencyContext['zh'] : proficiencyContext['en'];

    const basePrompt = isChinese ? 
      `你是一个AI语言学习导师。${scenarioText}

语言: ${targetLanguage}
熟练程度: ${proficiencyLevel}
指示: ${proficiencyText}
文化背景: ${culturalContextInstruction}

用友好的问候开始对话并介绍场景。保持回复在100字以内，让语言学习变得有趣。

回复:` :
      `You are an AI language learning tutor. ${scenarioText}

Language: ${targetLanguage}
Proficiency Level: ${proficiencyLevel}
Instructions: ${proficiencyText}
Cultural Context: ${culturalContextInstruction}

Start the conversation with a friendly greeting and introduce the scenario. Keep your response under 100 words and make it engaging for language learning.

Response:`;

    return basePrompt;
  }

  buildConversationPrompt({ conversationHistory, userMessage, lexIntent, scenario, language, proficiencyLevel, culturalContext }) {
    const historyText = conversationHistory
      .slice(-6) // Last 6 messages for context
      .map(msg => `${msg.type}: ${msg.content}`)
      .join('\n');

    const culturalInstructions = {
      'Western': 'Use Western communication styles, directness, and cultural references.',
      'Chinese': 'Use Chinese communication styles, respect for hierarchy, and appropriate cultural references.',
      'auto': 'Adapt cultural context based on the conversation flow and user preferences.'
    };

    const culturalContextInstruction = culturalInstructions[culturalContext] || culturalInstructions['auto'];
    const isChinese = language === 'zh' || language === 'zh-CN' || language === 'zh-TW';
    const targetLanguage = isChinese ? 'Chinese' : 'English';

    const basePrompt = isChinese ? 
      `你是一个AI语言学习导师，在${scenario}场景中。

语言: ${targetLanguage}
熟练程度: ${proficiencyLevel}
用户意图: ${lexIntent}
文化背景: ${culturalContextInstruction}

对话历史:
${historyText}

用户消息: ${userMessage}

自然地回应用户的消息。如果需要，提供有用的纠正，但不要过于苛刻。保持对话流畅和教育性。如果有语法问题，在你的回复中巧妙地纠正它们。

回复:` :
      `You are an AI language learning tutor in a ${scenario} scenario.

Language: ${targetLanguage}
Proficiency Level: ${proficiencyLevel}
User Intent: ${lexIntent}
Cultural Context: ${culturalContextInstruction}

Conversation History:
${historyText}

User Message: ${userMessage}

Respond naturally to the user's message. Provide helpful corrections if needed, but don't be overly critical. Keep the conversation flowing and educational. If there are grammar issues, subtly correct them in your response.

Response:`;

    return basePrompt;
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

  // New AI-powered methods for comprehensive language learning

  async analyzeWriting({ text, language, userId }) {
    try {
      const prompt = `You are an expert ${language} writing tutor. Analyze the following text and provide comprehensive feedback.

Text: "${text}"
Language: ${language}

Provide detailed analysis including:
1. Grammar corrections with explanations
2. Vocabulary suggestions for improvement
3. Writing style and clarity assessment
4. Overall writing score (0-100)
5. Specific improvement recommendations

Format as JSON with:
- grammarSuggestions: array of {text, suggestion, explanation, severity}
- overallScore: number (0-100)
- wordCount: number
- readabilityScore: number (0-100)
- vocabularyLevel: string
- improvements: array of strings`;

      const response = await this.invokeModel(prompt);
      return this.parseWritingAnalysis(response);
    } catch (error) {
      console.error('Error analyzing writing:', error);
      return this.getFallbackWritingAnalysis(text, language);
    }
  }

  async generateReadingContent({ level, topic, language, userId }) {
    try {
      const prompt = `Generate engaging reading content for language learning.

Language: ${language}
Level: ${level}
Topic: ${topic}

Create:
1. A compelling article (200-300 words)
2. 3-5 comprehension quiz questions
3. 5-8 vocabulary flashcards
4. A summary of key points
5. Learning objectives

Format as JSON with:
- title: string
- content: string
- level: string
- wordCount: number
- estimatedTime: number
- vocabulary: array of {word, definition, example}
- summary: string
- keyPoints: array of strings
- quiz: array of {question, options, correctAnswer, explanation}
- flashcards: array of {front, back, difficulty}`;

      const response = await this.invokeModel(prompt);
      return this.parseReadingContent(response);
    } catch (error) {
      console.error('Error generating reading content:', error);
      return this.getFallbackReadingContent(level, topic, language);
    }
  }

  async analyzePronunciation({ audioData, text, language }) {
    try {
      // This would integrate with Amazon Transcribe for actual pronunciation analysis
      // For now, return a basic analysis structure
      return {
        overallScore: 0,
        wordScores: [],
        generalFeedback: ['Pronunciation analysis requires audio input. Please record your speech.'],
        fluencyScore: 0,
        paceScore: 0,
        clarityScore: 0,
        improvements: ['Please provide audio data for pronunciation analysis.']
      };
    } catch (error) {
      console.error('Error analyzing pronunciation:', error);
      throw new Error('Failed to analyze pronunciation: ' + error.message);
    }
  }

  async generateQuiz({ content, language, difficulty, userId }) {
    try {
      const prompt = `Generate a comprehensive quiz based on the reading content.

Content: "${content.substring(0, 500)}..."
Language: ${language}
Difficulty: ${difficulty}

Create 5-8 multiple choice questions that test:
1. Reading comprehension
2. Vocabulary understanding
3. Critical thinking
4. Language usage

Format as JSON with:
- questions: array of {question, options, correctAnswer, explanation, difficulty}`;

      const response = await this.invokeModel(prompt);
      return this.parseQuiz(response);
    } catch (error) {
      console.error('Error generating quiz:', error);
      return this.getFallbackQuiz(content, language, difficulty);
    }
  }

  async generateFlashcards({ content, language, count, userId }) {
    try {
      const prompt = `Generate vocabulary flashcards from the reading content.

Content: "${content.substring(0, 500)}..."
Language: ${language}
Count: ${count}

Create flashcards covering:
1. Key vocabulary words
2. Important phrases
3. Grammar concepts
4. Cultural references

Format as JSON with:
- flashcards: array of {front, back, difficulty, category}`;

      const response = await this.invokeModel(prompt);
      return this.parseFlashcards(response);
    } catch (error) {
      console.error('Error generating flashcards:', error);
      return this.getFallbackFlashcards(content, language, count);
    }
  }

  async summarizeContent({ content, language, length, userId }) {
    try {
      const prompt = `Summarize the following content for language learning.

Content: "${content.substring(0, 1000)}..."
Language: ${language}
Length: ${length}

Create a summary that:
1. Captures main ideas
2. Uses appropriate vocabulary for the level
3. Highlights key learning points
4. Maintains engagement

Format as JSON with:
- summary: string
- keyPoints: array of strings
- vocabulary: array of {word, definition}
- learningObjectives: array of strings`;

      const response = await this.invokeModel(prompt);
      return this.parseSummary(response);
    } catch (error) {
      console.error('Error summarizing content:', error);
      return this.getFallbackSummary(content, language, length);
    }
  }

  // Helper methods for parsing AI responses
  parseWritingAnalysis(response) {
    try {
      const data = JSON.parse(response.text);
      return {
        grammarSuggestions: data.grammarSuggestions || [],
        overallScore: data.overallScore || 75,
        wordCount: data.wordCount || 0,
        readabilityScore: data.readabilityScore || 70,
        vocabularyLevel: data.vocabularyLevel || 'intermediate',
        improvements: data.improvements || []
      };
    } catch (error) {
      return this.getFallbackWritingAnalysis('', 'en');
    }
  }

  parseReadingContent(response) {
    try {
      const data = JSON.parse(response.text);
      return {
        title: data.title || 'Reading Practice',
        content: data.content || 'Sample reading content...',
        level: data.level || 'intermediate',
        wordCount: data.wordCount || 250,
        estimatedTime: data.estimatedTime || 3,
        vocabulary: data.vocabulary || [],
        summary: data.summary || 'Summary of the reading content.',
        keyPoints: data.keyPoints || [],
        quiz: data.quiz || [],
        flashcards: data.flashcards || []
      };
    } catch (error) {
      return this.getFallbackReadingContent('intermediate', 'general', 'en');
    }
  }

  parseQuiz(response) {
    try {
      const data = JSON.parse(response.text);
      return data.questions || [];
    } catch (error) {
      return this.getFallbackQuiz('', 'en', 'intermediate');
    }
  }

  parseFlashcards(response) {
    try {
      const data = JSON.parse(response.text);
      return data.flashcards || [];
    } catch (error) {
      return this.getFallbackFlashcards('', 'en', 5);
    }
  }

  parseSummary(response) {
    try {
      const data = JSON.parse(response.text);
      return {
        summary: data.summary || 'Summary not available',
        keyPoints: data.keyPoints || [],
        vocabulary: data.vocabulary || [],
        learningObjectives: data.learningObjectives || []
      };
    } catch (error) {
      return this.getFallbackSummary('', 'en', 'medium');
    }
  }

  // Fallback methods for when AI services are unavailable
  getFallbackWritingAnalysis(text, language) {
    return {
      grammarSuggestions: [
        {
          text: 'This is a sample suggestion',
          suggestion: 'This is a better suggestion',
          explanation: 'This explains why the change is recommended',
          severity: 'warning'
        }
      ],
      overallScore: 75,
      wordCount: text.split(/\s+/).length,
      readabilityScore: 70,
      vocabularyLevel: 'Intermediate',
      improvements: [
        'Try using more varied sentence structures',
        'Consider adding more descriptive adjectives',
        'Work on improving paragraph flow'
      ]
    };
  }

  getFallbackReadingContent(level, topic, language) {
    return {
      title: 'Sample Reading Content',
      content: 'This is sample reading content for language learning practice. It contains various vocabulary words and grammar structures to help improve your language skills.',
      level: level,
      wordCount: 50,
      estimatedTime: 2,
      vocabulary: [
        { word: 'sample', definition: 'example', example: 'This is a sample text.' },
        { word: 'practice', definition: 'exercise', example: 'Practice makes perfect.' }
      ],
      summary: 'This is a sample reading passage for language learning.',
      keyPoints: ['Key point 1', 'Key point 2', 'Key point 3'],
      quiz: [
        {
          question: 'What is this text about?',
          options: ['Language learning', 'Cooking', 'Sports'],
          correctAnswer: 0,
          explanation: 'The text is about language learning practice.'
        }
      ],
      flashcards: [
        { front: 'What does "sample" mean?', back: 'Example', difficulty: 'easy' }
      ]
    };
  }

  getFallbackPronunciationAnalysis(text, language) {
    return {
      overallScore: 0,
      wordScores: [],
      generalFeedback: ['Unable to analyze pronunciation. Please try again.'],
      fluencyScore: 0,
      paceScore: 0,
      clarityScore: 0,
      improvements: ['Please check your connection and try again.']
    };
  }

  getFallbackQuiz(content, language, difficulty) {
    return [
      {
        question: 'What is the main topic of this text?',
        options: ['Language learning', 'Technology', 'Travel'],
        correctAnswer: 0,
        explanation: 'The text focuses on language learning concepts.',
        difficulty: difficulty
      }
    ];
  }

  getFallbackFlashcards(content, language, count) {
    return [
      {
        front: 'What does "learn" mean?',
        back: 'To gain knowledge or skill',
        difficulty: 'easy',
        category: 'vocabulary'
      }
    ];
  }

  getFallbackSummary(content, language, length) {
    return {
      summary: 'This is a sample summary of the content.',
      keyPoints: ['Key point 1', 'Key point 2'],
      vocabulary: [{ word: 'example', definition: 'sample' }],
      learningObjectives: ['Understand the main ideas', 'Learn new vocabulary']
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
