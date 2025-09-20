const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const { validateWritingRequest } = require('../middleware/validation');
const bedrockService = require('../services/bedrockService');

// Analyze writing text
router.post('/analyze', authenticateUser, async (req, res) => {
  try {
    const { text, language = 'en' } = req.body;
    const userId = req.user.userId;
    
    console.log('Writing analysis request body:', req.body);
    console.log('Text parameter:', text);

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Text is required for analysis'
      });
    }

    // Use Bedrock to analyze the writing
    const analysis = await bedrockService.analyzeWriting({
      text: text.trim(),
      language,
      userId
    });

    res.status(200).json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Error analyzing writing:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze writing'
    });
  }
});

// Get writing suggestions
router.post('/suggestions', authenticateUser, async (req, res) => {
  try {
    const { text, language = 'en', focus = 'grammar' } = req.body;
    const userId = req.user.userId;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Text is required for suggestions'
      });
    }

    // Use Bedrock to get writing suggestions
    const suggestions = await bedrockService.getWritingSuggestions({
      text: text.trim(),
      language,
      focus,
      userId
    });

    res.status(200).json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    console.error('Error getting writing suggestions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get writing suggestions'
    });
  }
});

// Get vocabulary suggestions
router.post('/vocabulary', authenticateUser, async (req, res) => {
  try {
    const { text, language = 'en', level = 'intermediate' } = req.body;
    const userId = req.user.userId;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Text is required for vocabulary analysis'
      });
    }

    // Use Bedrock to analyze vocabulary
    const vocabulary = await bedrockService.analyzeVocabulary({
      text: text.trim(),
      language,
      level,
      userId
    });

    res.status(200).json({
      success: true,
      data: vocabulary
    });
  } catch (error) {
    console.error('Error analyzing vocabulary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze vocabulary'
    });
  }
});

module.exports = router;
