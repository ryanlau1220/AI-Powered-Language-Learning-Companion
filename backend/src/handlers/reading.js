const express = require('express');
const readingService = require('../services/readingService');
const { validateReadingRequest } = require('../middleware/validation');

const router = express.Router();

// File upload middleware
const upload = readingService.upload;

// Analyze content from text or file
router.post('/analyze', upload.single('file'), async (req, res) => {
  try {
    console.log('Reading analysis request received');
    console.log('Request body:', req.body);
    console.log('File uploaded:', req.file ? req.file.originalname : 'No file');
    
    let content = '';
    let contentType = 'text';
    
    if (req.file) {
      // Extract text from uploaded file
      const extractionResult = await readingService.extractTextFromFile(req.file);
      content = extractionResult.text;
      contentType = 'file';
      console.log('Text extracted from file:', content.substring(0, 200) + '...');
    } else if (req.body.content) {
      // Use provided text content
      content = req.body.content;
      contentType = 'text';
      console.log('Using provided text content:', content.substring(0, 200) + '...');
    } else {
      return res.status(400).json({
        success: false,
        error: 'No content provided. Please provide text content or upload a file.'
      });
    }
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No readable content found. Please check your file or text input.'
      });
    }
    
    // Analyze the content
    const result = await readingService.analyzeContent({
      content: content,
      contentType: contentType,
      userId: req.body.userId || 'default'
    });
    
    console.log('Content analysis completed');
    res.status(200).json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('Error in reading analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze content',
      details: error.message
    });
  }
});

// Generate flashcards from content
router.post('/flashcards', async (req, res) => {
  try {
    console.log('Flashcard generation request received');
    console.log('Request body:', req.body);
    
    const { content, analysis, userId } = req.body;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Content is required to generate flashcards'
      });
    }
    
    const result = await readingService.generateFlashcards({
      content: content,
      analysis: analysis || '',
      userId: userId || 'default'
    });
    
    console.log('Flashcards generated successfully');
    res.status(200).json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('Error generating flashcards:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate flashcards',
      details: error.message
    });
  }
});

// Generate quiz from content
router.post('/quiz', async (req, res) => {
  try {
    console.log('Quiz generation request received');
    console.log('Request body:', req.body);
    
    const { content, analysis, userId } = req.body;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Content is required to generate quiz'
      });
    }
    
    const result = await readingService.generateQuiz({
      content: content,
      analysis: analysis || '',
      userId: userId || 'default'
    });
    
    console.log('Quiz generated successfully');
    res.status(200).json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('Error generating quiz:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate quiz',
      details: error.message
    });
  }
});

// Answer questions about content
router.post('/answer', async (req, res) => {
  try {
    console.log('Question answering request received');
    console.log('Request body:', req.body);
    
    const { question, content, analysis, userId } = req.body;
    
    if (!question || !content) {
      return res.status(400).json({
        success: false,
        error: 'Question and content are required'
      });
    }
    
    const result = await readingService.answerQuestion({
      question: question,
      content: content,
      analysis: analysis || '',
      userId: userId || 'default'
    });
    
    console.log('Question answered successfully');
    res.status(200).json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('Error answering question:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to answer question',
      details: error.message
    });
  }
});

// Get reading content (for existing content)
router.post('/content', async (req, res) => {
  try {
    console.log('Reading content generation request received');
    console.log('Request body:', req.body);
    
    const { topic, level, language, userId } = req.body;
    
    if (!topic) {
      return res.status(400).json({
        success: false,
        error: 'Topic is required to generate reading content'
      });
    }
    
    // Generate reading content using Bedrock
    const readingService = require('../services/readingService');
    const result = await readingService.analyzeContent({
      content: `Generate a comprehensive reading passage about: ${topic}. 
                Level: ${level || 'intermediate'}
                Language: ${language || 'English'}
                
                Create an engaging, educational passage that covers:
                - Main concepts and ideas
                - Key vocabulary with context
                - Practical examples
                - Clear explanations
                
                Make it suitable for language learning with appropriate difficulty level.`,
      contentType: 'generated',
      userId: userId || 'default'
    });
    
    console.log('Reading content generated successfully');
    res.status(200).json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('Error generating reading content:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate reading content',
      details: error.message
    });
  }
});

module.exports = router;