const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const os = require('os');
const multer = require('multer');
const mammoth = require('mammoth');
const pdf = require('pdf-parse');
const languageDetectionService = require('./languageDetectionService');

// Configure AWS regions
const malaysiaRegion = process.env.REGION || 'ap-southeast-5';
const bedrockRegion = process.env.BEDROCK_REGION || 'us-east-1';

class ReadingService {
  constructor() {
    // Configure AWS with explicit credentials
    AWS.config.update({
      region: bedrockRegion,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    });

    // Initialize AWS services
    this.bedrock = new AWS.BedrockRuntime({ region: bedrockRegion });
    this.s3 = new AWS.S3({ region: malaysiaRegion });
    
    // Configure multer for file uploads
    this.upload = multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
      },
      fileFilter: (req, file, cb) => {
        const allowedTypes = [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/msword',
          'text/plain',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type. Only PDF, DOC, DOCX, TXT, PPT, PPTX files are allowed.'), false);
        }
      }
    });
  }

  async analyzeContent({ content, contentType, userId, uiLanguage }) {
    try {
      console.log('Analyzing content for Text Explorer Lab...');
      console.log('Content type:', contentType);
      console.log('Content length:', content ? content.length : 0);
      
      // Use UI language as primary indicator, with fallback to language detection
      let targetLanguage = uiLanguage || 'en';
      
      // Only use language detection if UI language is not provided
      if (!uiLanguage) {
        const languageDetection = await languageDetectionService.detectLanguage(content, userId);
        targetLanguage = languageDetection.detectedLanguage;
        console.log(`UI language not set, detected language: ${targetLanguage}`);
      } else {
        console.log(`Using UI language: ${targetLanguage}`);
      }
      
      // Simple heuristic: if content contains Chinese characters, use Chinese
      const chinesePattern = /[\u4e00-\u9fff\u3400-\u4dbf\u20000-\u2a6df\u2a700-\u2b73f\u2b740-\u2b81f\u2b820-\u2ceaf\uf900-\ufaff\u3300-\u33ff]/;
      if (chinesePattern.test(content)) {
        targetLanguage = 'zh';
        console.log(`Content contains Chinese characters, using Chinese`);
      }
      
      const detectedLanguage = targetLanguage;
      const culturalContext = targetLanguage === 'zh' ? 'Chinese' : 'Western';
      
      console.log(`Target language: ${detectedLanguage}`);
      console.log(`Cultural context: ${culturalContext}`);
      
      // Build language-specific prompt
      const isChinese = detectedLanguage === 'zh';
      const prompt = isChinese ? 
        `你是一个专业的语言学习内容分析师。请分析以下内容并提供全面的语言学习分析。

内容：${content}

请提供以下分析（全部用中文回答）：
1. **主要主题** - 列出涵盖的关键主题
2. **关键概念** - 重要概念和定义
3. **词汇** - 关键词汇及其定义和难度等级
4. **总结** - 内容清晰简洁的总结
5. **学习目标** - 学生应该从这些内容中学到什么

请用清晰的中文回答，适合语言学习者理解。使用markdown格式。` :
        `You are an expert educational content analyzer. Analyze the following content and provide a comprehensive breakdown for language learning purposes.

Content: ${content}

Please provide (respond in ${detectedLanguage === 'en' ? 'English' : detectedLanguage}):
1. **Main Topics** - List the key topics covered
2. **Key Concepts** - Important concepts and definitions
3. **Vocabulary** - Key terms with definitions and difficulty levels
4. **Summary** - A clear, concise summary of the content
5. **Learning Objectives** - What students should learn from this content

Do NOT include Difficulty Level, Reading Time, or Key Questions sections.

Format your response in clear sections with markdown formatting.`;

      const params = {
        modelId: process.env.BEDROCK_MODEL_ID || 'amazon.nova-pro-v1:0',
        contentType: 'application/json',
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: [{ text: prompt }]
            }
          ]
        })
      };

      console.log('Calling Bedrock for content analysis...');
      const response = await this.bedrock.invokeModel(params).promise();
      const responseBody = JSON.parse(response.body.toString());
      
      console.log('Bedrock response received');
      // Response received from Bedrock
      
      // Handle different response structures
      let analysisText = '';
      if (responseBody.output && responseBody.output.message && responseBody.output.message.content && responseBody.output.message.content[0] && responseBody.output.message.content[0].text) {
        analysisText = responseBody.output.message.content[0].text;
      } else if (responseBody.content && responseBody.content[0] && responseBody.content[0].text) {
        analysisText = responseBody.content[0].text;
      } else if (responseBody.messages && responseBody.messages[0] && responseBody.messages[0].content) {
        analysisText = responseBody.messages[0].content[0].text;
      } else if (responseBody.text) {
        analysisText = responseBody.text;
      } else {
        console.log('Unexpected response structure, using fallback');
        analysisText = this.getFallbackAnalysis(content);
      }
      
      // Auto-generate flashcards and quiz
      let flashcards = [];
      let quiz = null;
      
      try {
        const flashcardResponse = await this.generateFlashcards({ content: analysisText, userId });
        if (flashcardResponse.success) {
          flashcards = flashcardResponse.flashcards || [];
        }
        
        const quizResponse = await this.generateQuiz({ content: analysisText, userId });
        if (quizResponse.success) {
          quiz = quizResponse.questions || quizResponse.quiz || null;
        }
      } catch (error) {
        // Continue without flashcards/quiz if generation fails
      }

      return {
        success: true,
        analysis: analysisText,
        contentType: contentType,
        analyzedAt: new Date().toISOString(),
        flashcards: flashcards,
        quiz: quiz
      };
      
    } catch (error) {
      console.error('Error analyzing content:', error);
      
      // Fallback analysis
      return {
        success: true,
        analysis: this.getFallbackAnalysis(content),
        contentType: contentType,
        analyzedAt: new Date().toISOString()
      };
    }
  }

  async generateFlashcards({ content, analysis, userId }) {
    try {
      console.log('Generating flashcards from content...');
      
      // Detect language of the content
      const languageDetection = await languageDetectionService.detectLanguage(content, userId);
      const detectedLanguage = languageDetection.detectedLanguage;
      const culturalContext = languageDetection.culturalContext;
      
      // Generating flashcards in detected language
      
      // Build language-specific flashcard prompt
      const isChinese = detectedLanguage === 'zh';
      const prompt = isChinese ? 
        `基于以下内容和分析，创建10张有效的学习卡片。

内容：${content}
分析：${analysis}

请使用以下JSON格式返回，使用英文字段名但中文内容：
[
  {
    "front": "问题或术语（中文）",
    "back": "答案或定义（中文）",
    "difficulty": "简单"
  }
]

返回仅包含10张卡片的有效JSON数组。` :
        `Based on the following content and analysis, create 10 flashcards for effective learning.

Content: ${content}
Analysis: ${analysis}

For each flashcard, provide:
1. **Front** - A question or term
2. **Back** - The answer or definition
3. **Category** - The topic or subject area
4. **Difficulty** - Easy, Medium, or Hard

Format as a JSON array with the following structure:
[
  {
    "front": "Question or term",
    "back": "Answer or definition", 
    "category": "Topic",
    "difficulty": "Easy/Medium/Hard"
  }
]`;

      const params = {
        modelId: process.env.BEDROCK_MODEL_ID || 'amazon.nova-pro-v1:0',
        contentType: 'application/json',
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: [{ text: prompt }]
            }
          ]
        })
      };

      const response = await this.bedrock.invokeModel(params).promise();
      const responseBody = JSON.parse(response.body.toString());
      
      // Handle different response structures
      let responseText = '';
      if (responseBody.output && responseBody.output.message && responseBody.output.message.content && responseBody.output.message.content[0] && responseBody.output.message.content[0].text) {
        responseText = responseBody.output.message.content[0].text;
      } else if (responseBody.content && responseBody.content[0] && responseBody.content[0].text) {
        responseText = responseBody.content[0].text;
      } else if (responseBody.messages && responseBody.messages[0] && responseBody.messages[0].content) {
        responseText = responseBody.messages[0].content[0].text;
      } else if (responseBody.text) {
        responseText = responseBody.text;
      } else {
        console.log('Unexpected response structure for flashcards, using fallback');
        return {
          success: true,
          flashcards: this.getFallbackFlashcards(content),
          generatedAt: new Date().toISOString()
        };
      }
      
      // Flashcard response received
      
      // Try to parse the JSON response
      let flashcards = [];
      try {
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          flashcards = JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        console.log('Could not parse flashcards JSON, using fallback');
        flashcards = this.getFallbackFlashcards(content);
      }
      
      return {
        success: true,
        flashcards: flashcards,
        generatedAt: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Error generating flashcards:', error);
      return {
        success: true,
        flashcards: this.getFallbackFlashcards(content),
        generatedAt: new Date().toISOString()
      };
    }
  }

  async generateQuiz({ content, analysis, userId }) {
    try {
      console.log('Generating quiz from content...');
      
      // Detect language of the content
      const languageDetection = await languageDetectionService.detectLanguage(content, userId);
      const detectedLanguage = languageDetection.detectedLanguage;
      const culturalContext = languageDetection.culturalContext;
      
      // Generating quiz in detected language
      
      const timestamp = new Date().toISOString();
      const randomSeed = Math.floor(Math.random() * 1000);
      const questionSet = Math.floor(Math.random() * 4); // 0, 1, 2, or 3
      
      // Extract key concepts from content for targeted question generation
      const contentLower = content.toLowerCase();
      const hasLRT = contentLower.includes('lrt') || contentLower.includes('light rail') || contentLower.includes('transit');
      const hasMalaysia = contentLower.includes('malaysia') || contentLower.includes('malaysian');
      const hasUrban = contentLower.includes('urban') || contentLower.includes('city');
      const hasTransport = contentLower.includes('transport') || contentLower.includes('transportation');
      const hasVocabulary = contentLower.includes('vocabulary') || contentLower.includes('definition');
      
      // Generate different question sets based on content analysis
      let focusAreas = [];
      if (questionSet === 0) {
        focusAreas = ['primary purpose', 'basic definitions', 'capacity comparisons', 'vocabulary terms', 'general concepts'];
      } else if (questionSet === 1) {
        focusAreas = ['operational details', 'system characteristics', 'technical specifications', 'usage patterns', 'infrastructure'];
      } else if (questionSet === 2) {
        focusAreas = ['benefits and advantages', 'challenges and limitations', 'comparisons with other systems', 'efficiency metrics', 'user experience'];
      } else {
        focusAreas = ['future developments', 'maintenance requirements', 'safety considerations', 'environmental impact', 'economic factors'];
      }
      
      // Build language-specific quiz prompt
      const isChinese = detectedLanguage === 'zh';
      const prompt = isChinese ? 
        `你是一个专业的测验创建者。请基于以下内容创建5个测验问题，重点关注这些特定领域：${focusAreas.join('、')}。

内容：${content}

要求：
- 专注于特定领域：${focusAreas.join('、')}
- 创建测试对这些特定方面理解的问题
- 混合选择题和判断题
- 变化难度等级（简单、中等、困难）
- 使问题与提供的内容具体相关

请使用以下JSON格式返回，使用英文字段名但中文内容：
[
  {
    "question": "关于内容的具体问题（中文）",
    "type": "multiple_choice",
    "options": ["选项A（中文）", "选项B（中文）", "选项C（中文）", "选项D（中文）"],
    "correctAnswer": "正确答案（中文）",
    "explanation": "解释（中文）",
    "difficulty": "简单"
  }
]

返回仅包含5个测验问题的有效JSON数组。` :
        `You are an expert quiz creator. Create exactly 5 quiz questions based on the following content, focusing on these specific areas: ${focusAreas.join(', ')}.

Content: ${content}

REQUIREMENTS:
- Focus on the specific areas: ${focusAreas.join(', ')}
- Create questions that test understanding of these particular aspects
- Mix multiple choice and true/false questions
- Vary difficulty levels (Easy, Medium, Hard)
- Make questions specific to the content provided

For each question, provide:
1. **Question** - A specific question about the content
2. **Type** - "multiple_choice" or "true_false"
3. **Options** - Array of 4 options (for multiple choice only)
4. **Correct Answer** - The correct answer
5. **Explanation** - Why this is the correct answer
6. **Difficulty** - "Easy", "Medium", or "Hard"

Focus areas for this quiz: ${focusAreas.join(', ')}
Question set: ${questionSet}
Timestamp: ${timestamp}

Format as a JSON array with exactly 5 questions:
[
  {
    "question": "Specific question about the content",
    "type": "multiple_choice",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
    "correctAnswer": "Option 1",
    "explanation": "Explanation text",
    "difficulty": "Medium"
  }
]`;

      const params = {
        modelId: process.env.BEDROCK_MODEL_ID || 'amazon.nova-pro-v1:0',
        contentType: 'application/json',
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: [{ text: prompt }]
            }
          ]
        })
      };

      const response = await this.bedrock.invokeModel(params).promise();
      const responseBody = JSON.parse(response.body.toString());
      
      // Handle different response structures
      let responseText = '';
      // Quiz response received
      
      if (responseBody.content && responseBody.content[0] && responseBody.content[0].text) {
        responseText = responseBody.content[0].text;
        // Using content structure
      } else if (responseBody.messages && responseBody.messages[0] && responseBody.messages[0].content) {
        responseText = responseBody.messages[0].content[0].text;
        // Using messages structure
      } else if (responseBody.text) {
        responseText = responseBody.text;
        // Using text structure
      } else if (responseBody.output && responseBody.output.message && responseBody.output.message.content) {
        responseText = responseBody.output.message.content[0].text;
        // Using output structure
      } else {
        console.log('Unexpected response structure for quiz, using fallback');
        console.log('Available keys:', Object.keys(responseBody));
        return {
          success: true,
          questions: this.getFallbackQuiz(content),
          generatedAt: new Date().toISOString()
        };
      }
      
      // Try to parse the JSON response
      let questions = [];
      try {
        // Quiz response parsed
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          // Clean up the JSON by removing trailing commas
          let jsonString = jsonMatch[0];
          jsonString = jsonString.replace(/,(\s*[}\]])/g, '$1'); // Remove trailing commas
          questions = JSON.parse(jsonString);
          console.log('Parsed quiz questions:', questions);
        } else {
          console.log('No JSON array found in quiz response, using fallback');
          questions = this.getFallbackQuiz(content);
        }
      } catch (parseError) {
        console.log('Could not parse quiz JSON, using fallback:', parseError.message);
        questions = this.getFallbackQuiz(content);
      }
      
      return {
        success: true,
        questions: questions,
        generatedAt: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Error generating quiz:', error);
      return {
        success: true,
        questions: this.getFallbackQuiz(content),
        generatedAt: new Date().toISOString()
      };
    }
  }

  async answerQuestion({ question, content, analysis, userId }) {
    try {
      console.log('Answering question about content...');
      
      const prompt = `Based on the following content and analysis, answer the user's question in detail.

Content: ${content}
Analysis: ${analysis}
User Question: ${question}

Provide a comprehensive answer that:
1. Directly addresses the question
2. References specific parts of the content
3. Provides examples when relevant
4. Explains complex concepts clearly
5. Suggests related topics for further learning

Format your response with clear sections and markdown formatting.`;

      const params = {
        modelId: process.env.BEDROCK_MODEL_ID || 'amazon.nova-pro-v1:0',
        contentType: 'application/json',
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: [{ text: prompt }]
            }
          ]
        })
      };

      const response = await this.bedrock.invokeModel(params).promise();
      const responseBody = JSON.parse(response.body.toString());
      
      // Handle different response structures
      let answerText = '';
      if (responseBody.output && responseBody.output.message && responseBody.output.message.content && responseBody.output.message.content[0] && responseBody.output.message.content[0].text) {
        answerText = responseBody.output.message.content[0].text;
      } else if (responseBody.content && responseBody.content[0] && responseBody.content[0].text) {
        answerText = responseBody.content[0].text;
      } else if (responseBody.messages && responseBody.messages[0] && responseBody.messages[0].content) {
        answerText = responseBody.messages[0].content[0].text;
      } else if (responseBody.text) {
        answerText = responseBody.text;
      } else {
        console.log('Unexpected response structure for answer, using fallback');
        answerText = "I apologize, but I'm having trouble processing your question right now. Please try rephrasing it or ask about a different aspect of the content.";
      }
      
      return {
        success: true,
        answer: answerText,
        answeredAt: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Error answering question:', error);
      return {
        success: true,
        answer: "I apologize, but I'm having trouble processing your question right now. Please try rephrasing it or ask about a different aspect of the content.",
        answeredAt: new Date().toISOString()
      };
    }
  }

  async extractTextFromFile(file) {
    try {
      const fileExtension = path.extname(file.originalname).toLowerCase();
      let text = '';

      if (fileExtension === '.pdf') {
        const data = await pdf(file.buffer);
        text = data.text;
      } else if (fileExtension === '.docx') {
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        text = result.value;
      } else if (fileExtension === '.txt') {
        text = file.buffer.toString('utf-8');
      } else {
        throw new Error(`Unsupported file type: ${fileExtension}`);
      }

      return {
        success: true,
        text: text,
        fileName: file.originalname,
        fileSize: file.size,
        extractedAt: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Error extracting text from file:', error);
      throw new Error(`Failed to extract text from file: ${error.message}`);
    }
  }

  getFallbackAnalysis(content) {
    // Generate a more relevant fallback based on the content
    const contentLower = content.toLowerCase();
    
    let mainTopics = [];
    let keyConcepts = [];
    let vocabulary = [];
    let summary = '';
    let difficulty = 'intermediate';
    
    if (contentLower.includes('ai') || contentLower.includes('artificial intelligence')) {
      mainTopics = ['Artificial Intelligence', 'Machine Learning', 'Technology'];
      keyConcepts = [
        'AI: Computer systems that can perform tasks requiring human intelligence',
        'Machine Learning: AI subset that learns from data',
        'Neural Networks: Computing systems inspired by biological neural networks'
      ];
      vocabulary = [
        '**Algorithm**: A set of rules for solving problems',
        '**Data**: Information used to train AI systems',
        '**Automation**: Using technology to perform tasks automatically'
      ];
      summary = 'This content explores artificial intelligence, covering its fundamental concepts, applications, and impact on modern technology. AI represents a revolutionary field that combines computer science, mathematics, and cognitive science to create systems that can think, learn, and make decisions.';
      difficulty = 'intermediate';
    } else if (contentLower.includes('job') || contentLower.includes('work')) {
      mainTopics = ['Career Development', 'Work Experience', 'Professional Growth'];
      keyConcepts = [
        'Career Planning: Strategic approach to professional development',
        'Work Experience: Practical knowledge gained through employment',
        'Skill Development: Continuous learning and improvement'
      ];
      vocabulary = [
        '**Resume**: Document summarizing work experience and skills',
        '**Interview**: Formal meeting to assess job candidates',
        '**Networking**: Building professional relationships'
      ];
      summary = 'This content discusses career development and work experience, highlighting the importance of gaining practical skills, building professional relationships, and continuous learning in today\'s job market.';
      difficulty = 'beginner';
    } else {
      mainTopics = ['General Knowledge', 'Learning Concepts', 'Educational Content'];
      keyConcepts = [
        'Learning: Process of acquiring knowledge and skills',
        'Education: Systematic instruction and training',
        'Development: Growth and improvement over time'
      ];
      vocabulary = [
        '**Knowledge**: Information and understanding gained through experience',
        '**Skills**: Abilities developed through practice',
        '**Growth**: Process of becoming better or more advanced'
      ];
      summary = 'This content provides valuable educational information designed to enhance understanding and knowledge retention. The material covers important concepts that can be applied in various learning contexts.';
    }
    
    return `# Content Analysis

## Main Topics
${mainTopics.map(topic => `- ${topic}`).join('\n')}

## Key Concepts
${keyConcepts.map(concept => `- ${concept}`).join('\n')}

## Vocabulary
${vocabulary.join('\n')}

## Summary
${summary}

## Learning Objectives
- Understand the main concepts presented
- Learn key vocabulary and terminology
- Apply knowledge in practical situations
- Develop critical thinking skills`;
  }

  getFallbackFlashcards(content) {
    return [
      {
        front: "What is the main topic of this content?",
        back: "The main topic covers key concepts and important information for learning.",
        category: "General",
        difficulty: "Easy"
      },
      {
        front: "What are the key concepts mentioned?",
        back: "Key concepts include important definitions and ideas that help with understanding.",
        category: "Concepts",
        difficulty: "Medium"
      },
      {
        front: "What vocabulary is important to learn?",
        back: "Important vocabulary includes technical terms and key definitions.",
        category: "Vocabulary",
        difficulty: "Medium"
      }
    ];
  }

  getFallbackQuiz(content) {
    // Extract key terms and concepts from content for relevant questions
    const contentLower = content.toLowerCase();
    const timestamp = Date.now(); // Use timestamp for variation
    
    // Check for specific topics
    const hasHTML = contentLower.includes('html') || contentLower.includes('hypertext markup language');
    const hasCSS = contentLower.includes('css') || contentLower.includes('cascading style sheets');
    const hasJavaScript = contentLower.includes('javascript') || contentLower.includes('js');
    const hasWebDev = contentLower.includes('web development') || contentLower.includes('web page') || contentLower.includes('website');
    const hasProgramming = contentLower.includes('programming') || contentLower.includes('code') || contentLower.includes('coding');
    const hasAWS = contentLower.includes('aws') || contentLower.includes('amazon web services');
    const hasCloud = contentLower.includes('cloud') || contentLower.includes('cloud computing') || contentLower.includes('cloud engineering');
    const hasAI = contentLower.includes('ai') || contentLower.includes('artificial intelligence') || contentLower.includes('machine learning');
    const hasFlutter = contentLower.includes('flutter') || contentLower.includes('dart');
    const hasMobileDev = contentLower.includes('mobile') || contentLower.includes('app development') || contentLower.includes('cross-platform');
    const hasDevOps = contentLower.includes('devops') || contentLower.includes('dev ops');
    const hasInfrastructure = contentLower.includes('infrastructure') || contentLower.includes('iac') || contentLower.includes('infrastructure as code');
    const hasContainerization = contentLower.includes('containerization') || contentLower.includes('container') || contentLower.includes('docker');
    const hasMicroservices = contentLower.includes('microservices') || contentLower.includes('microservice');
    
    // Generate content-specific questions with variation
    const questions = [];
    
    // Use timestamp and random seed to vary question selection
    const questionSet = (timestamp + Math.floor(Math.random() * 100)) % 4; // 0, 1, 2, or 3 for different question sets
    
    if (hasHTML) {
      questions.push({
        question: "What does HTML stand for?",
        type: "multiple_choice",
        options: ["HyperText Markup Language", "High Tech Modern Language", "Home Tool Markup Language", "Hyperlink and Text Markup Language"],
        correctAnswer: "HyperText Markup Language",
        explanation: "HTML stands for HyperText Markup Language, which is the standard language for creating web pages.",
        difficulty: "Easy"
      });
      
      questions.push({
        question: "HTML tags are enclosed in angle brackets.",
        type: "true_false",
        options: [],
        correctAnswer: "True",
        explanation: "HTML tags are indeed enclosed in angle brackets (< and >) to define elements in a web page.",
        difficulty: "Easy"
      });
    }
    
    if (hasWebDev) {
      questions.push({
        question: "What is the purpose of HTML in web development?",
        type: "multiple_choice",
        options: ["To style web pages", "To add interactivity", "To structure web content", "To host websites"],
        correctAnswer: "To structure web content",
        explanation: "HTML is used to structure and organize the content of web pages, not for styling or interactivity.",
        difficulty: "Medium"
      });
    }
    
    if (hasAWS) {
      questions.push({
        question: "What does AWS stand for?",
        type: "multiple_choice",
        options: ["Amazon Web Services", "Advanced Web Solutions", "Automated Web Systems", "Application Web Services"],
        correctAnswer: "Amazon Web Services",
        explanation: "AWS stands for Amazon Web Services, which is Amazon's cloud computing platform.",
        difficulty: "Easy"
      });
    }
    
    if (hasCloud) {
      if (questionSet === 0) {
        questions.push({
          question: "What is the primary goal of Cloud Engineering?",
          type: "multiple_choice",
          options: ["To maximize server uptime", "To help organizations meet business goals using cloud services", "To reduce hardware costs", "To store data locally"],
          correctAnswer: "To help organizations meet business goals using cloud services",
          explanation: "Cloud Engineering is the practice of using cloud services to help organizations meet their business goals.",
          difficulty: "Easy"
        });

        questions.push({
          question: "Cloud Engineering involves only technical implementation.",
          type: "true_false",
          options: [],
          correctAnswer: "False",
          explanation: "Cloud Engineering involves both technical implementation and addressing challenges like skills gaps and cost management.",
          difficulty: "Medium"
        });

        questions.push({
          question: "What is Infrastructure as Code (IaC) in Cloud Engineering?",
          type: "multiple_choice",
          options: ["Physical hardware configuration", "Managing infrastructure through machine-readable files", "Manual server setup", "Cloud storage management"],
          correctAnswer: "Managing infrastructure through machine-readable files",
          explanation: "IaC is the practice of managing and provisioning computing infrastructure through machine-readable definition files.",
          difficulty: "Medium"
        });
      } else if (questionSet === 1) {
        questions.push({
          question: "Which practice is essential in Cloud Engineering?",
          type: "multiple_choice",
          options: ["DevOps", "Manual deployment", "Physical servers", "Local storage"],
          correctAnswer: "DevOps",
          explanation: "DevOps practices are essential in Cloud Engineering for collaboration and faster delivery.",
          difficulty: "Easy"
        });

        questions.push({
          question: "Containerization packages software with its dependencies.",
          type: "true_false",
          options: [],
          correctAnswer: "True",
          explanation: "Containerization packages software code with its dependencies and configurations into a single unit called a container.",
          difficulty: "Easy"
        });

        questions.push({
          question: "What is a key benefit of microservices in Cloud Engineering?",
          type: "multiple_choice",
          options: ["Reduced complexity", "Independent service deployment", "Lower costs", "Faster hardware"],
          correctAnswer: "Independent service deployment",
          explanation: "Microservices allow for independent deployment and scaling of individual services.",
          difficulty: "Medium"
        });
      } else if (questionSet === 2) {
        questions.push({
          question: "Cloud Engineering helps organizations achieve scalability.",
          type: "true_false",
          options: [],
          correctAnswer: "True",
          explanation: "Cloud Engineering enables organizations to scale their infrastructure and services as needed.",
          difficulty: "Easy"
        });

        questions.push({
          question: "What is a significant challenge in Cloud Engineering?",
          type: "multiple_choice",
          options: ["High availability", "Skills gap in cloud technologies", "Data security", "Cost management"],
          correctAnswer: "Skills gap in cloud technologies",
          explanation: "Addressing the skills gap in cloud technologies is a significant non-technical challenge in Cloud Engineering.",
          difficulty: "Medium"
        });

        questions.push({
          question: "DevOps practices improve collaboration between teams.",
          type: "true_false",
          options: [],
          correctAnswer: "True",
          explanation: "DevOps practices increase collaboration between development and operations teams.",
          difficulty: "Easy"
        });
      } else {
        questions.push({
          question: "What does IaC stand for in Cloud Engineering?",
          type: "multiple_choice",
          options: ["Infrastructure as Code", "Internet as Cloud", "Integration as Component", "Interface as Container"],
          correctAnswer: "Infrastructure as Code",
          explanation: "IaC stands for Infrastructure as Code, a key practice in Cloud Engineering.",
          difficulty: "Easy"
        });

        questions.push({
          question: "Cloud Engineering only involves technical aspects.",
          type: "true_false",
          options: [],
          correctAnswer: "False",
          explanation: "Cloud Engineering involves both technical implementation and business strategy considerations.",
          difficulty: "Medium"
        });

        questions.push({
          question: "Which is NOT a benefit of Cloud Engineering?",
          type: "multiple_choice",
          options: ["Scalability", "Cost reduction", "Increased complexity", "Faster deployment"],
          correctAnswer: "Increased complexity",
          explanation: "Cloud Engineering aims to reduce complexity, not increase it, while providing scalability, cost reduction, and faster deployment.",
          difficulty: "Medium"
        });
      }
    }
    
    if (hasFlutter) {
      // Different question sets based on timestamp
      if (questionSet === 0) {
        questions.push({
          question: "What programming language does Flutter use?",
          type: "multiple_choice",
          options: ["Dart", "JavaScript", "Python", "Java"],
          correctAnswer: "Dart",
          explanation: "Flutter uses Dart as its programming language for developing applications.",
          difficulty: "Easy"
        });

        questions.push({
          question: "Flutter is created by Google.",
          type: "true_false",
          options: [],
          correctAnswer: "True",
          explanation: "Flutter is an open-source UI software development toolkit created by Google.",
          difficulty: "Easy"
        });

        questions.push({
          question: "What are the basic building blocks of a Flutter app's user interface?",
          type: "multiple_choice",
          options: ["Components", "Widgets", "Elements", "Modules"],
          correctAnswer: "Widgets",
          explanation: "Widgets are the basic building blocks of a Flutter app's user interface.",
          difficulty: "Medium"
        });
      } else if (questionSet === 1) {
        questions.push({
          question: "Which feature allows Flutter developers to see changes instantly?",
          type: "multiple_choice",
          options: ["Hot Reload", "Live Preview", "Code Sync", "Instant Update"],
          correctAnswer: "Hot Reload",
          explanation: "Hot Reload allows developers to see changes in real-time without restarting the application.",
          difficulty: "Easy"
        });

        questions.push({
          question: "Flutter can build apps for multiple platforms from a single codebase.",
          type: "true_false",
          options: [],
          correctAnswer: "True",
          explanation: "Flutter enables cross-platform development, allowing apps to run on multiple operating systems from a single codebase.",
          difficulty: "Easy"
        });

        questions.push({
          question: "What is the main advantage of using Flutter for mobile development?",
          type: "multiple_choice",
          options: ["Faster compilation", "Cross-platform compatibility", "Smaller app size", "Better performance than native"],
          correctAnswer: "Cross-platform compatibility",
          explanation: "Flutter's main advantage is enabling cross-platform development with a single codebase.",
          difficulty: "Medium"
        });
      } else if (questionSet === 2) {
        questions.push({
          question: "Flutter apps are compiled to native code.",
          type: "true_false",
          options: [],
          correctAnswer: "True",
          explanation: "Flutter apps are compiled to native ARM code for both iOS and Android, providing near-native performance.",
          difficulty: "Medium"
        });

        questions.push({
          question: "What does 'widget' mean in Flutter development?",
          type: "multiple_choice",
          options: ["A small application", "A UI building block", "A data structure", "A programming pattern"],
          correctAnswer: "A UI building block",
          explanation: "In Flutter, widgets are the basic building blocks for creating user interfaces.",
          difficulty: "Easy"
        });

        questions.push({
          question: "Flutter uses a reactive programming model.",
          type: "true_false",
          options: [],
          correctAnswer: "True",
          explanation: "Flutter uses a reactive programming model where the UI updates automatically when the state changes.",
          difficulty: "Medium"
        });
      } else {
        questions.push({
          question: "What is the main advantage of Flutter's single codebase approach?",
          type: "multiple_choice",
          options: ["Faster development", "Reduced maintenance", "Consistent UI across platforms", "All of the above"],
          correctAnswer: "All of the above",
          explanation: "Flutter's single codebase approach provides faster development, reduced maintenance, and consistent UI across platforms.",
          difficulty: "Medium"
        });

        questions.push({
          question: "Flutter was first released in 2017.",
          type: "true_false",
          options: [],
          correctAnswer: "True",
          explanation: "Flutter was first released by Google in 2017 as an open-source UI toolkit.",
          difficulty: "Easy"
        });

        questions.push({
          question: "Which platform does Flutter NOT support?",
          type: "multiple_choice",
          options: ["iOS", "Android", "Web", "Windows Phone"],
          correctAnswer: "Windows Phone",
          explanation: "Flutter supports iOS, Android, Web, and Desktop platforms, but not Windows Phone.",
          difficulty: "Medium"
        });
      }
    }
    
    if (hasMobileDev) {
      questions.push({
        question: "Flutter allows developers to create cross-platform applications.",
        type: "true_false",
        options: [],
        correctAnswer: "True",
        explanation: "Flutter enables cross-platform development, allowing apps to run on multiple operating systems from a single codebase.",
        difficulty: "Medium"
      });
    }
    
    // Fill remaining slots with general content questions if needed
    while (questions.length < 5) {
      questions.push({
        question: "This content provides educational information for learning purposes.",
        type: "true_false",
        options: [],
        correctAnswer: "True",
        explanation: "The content is designed to provide educational information and help with learning.",
        difficulty: "Easy"
      });
    }
    
    return questions.slice(0, 5); // Ensure exactly 5 questions
  }
}

module.exports = new ReadingService();
