const express = require('express');
const router = express.Router();
const languageDetectionService = require('../services/languageDetectionService');
const translationService = require('../services/translationService');
const { validateLanguageDetection, validateTranslation } = require('../middleware/validation');
const { authenticateUser } = require('../middleware/auth');

/**
 * @route POST /api/language/detect
 * @desc Detect language of input text
 * @access Private (authenticated users)
 */
router.post('/detect', validateLanguageDetection, async (req, res) => {
  try {
    console.log('Language detection request received');
    
    const { text, userId } = req.body;
    const requestingUserId = userId || 'anonymous';

    console.log(`Language detection request from user: ${requestingUserId}`);
    
    // Detect language
    const detectionResult = await languageDetectionService.detectLanguage(text, requestingUserId);
    
    // Log successful detection
    console.log(`Language detected: ${detectionResult.detectedLanguage} (confidence: ${detectionResult.confidence})`);
    
    res.status(200).json({
      success: true,
      data: detectionResult,
      message: `Language detected: ${detectionResult.languageName}`
    });

  } catch (error) {
    console.error('Language detection error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to detect language',
      message: error.message
    });
  }
});

/**
 * @route POST /api/language/batch-detect
 * @desc Detect languages for multiple texts
 * @access Private (authenticated users)
 */
router.post('/batch-detect', authenticateUser, async (req, res) => {
  try {
    
    const { texts, userId } = req.body;
    const requestingUserId = req.user?.id || userId;

    if (!Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid input',
        message: 'Texts array is required and must not be empty'
      });
    }

    if (texts.length > 10) {
      return res.status(400).json({
        success: false,
        error: 'Too many texts',
        message: 'Maximum 10 texts allowed per batch request'
      });
    }

    console.log(`Batch language detection for ${texts.length} texts from user: ${requestingUserId}`);
    
    // Detect languages for all texts
    const detectionResults = await languageDetectionService.batchDetectLanguages(texts, requestingUserId);
    
    // Calculate summary statistics
    const languageCounts = {};
    let totalConfidence = 0;
    
    detectionResults.forEach(result => {
      const lang = result.detectedLanguage;
      languageCounts[lang] = (languageCounts[lang] || 0) + 1;
      totalConfidence += result.confidence;
    });

    const averageConfidence = totalConfidence / detectionResults.length;
    
    console.log(`Batch detection completed. Languages found:`, languageCounts);
    
    res.status(200).json({
      success: true,
      data: {
        results: detectionResults,
        summary: {
          totalTexts: texts.length,
          languageDistribution: languageCounts,
          averageConfidence: averageConfidence,
          mostCommonLanguage: Object.keys(languageCounts).reduce((a, b) => 
            languageCounts[a] > languageCounts[b] ? a : b
          )
        }
      },
      message: `Batch language detection completed for ${texts.length} texts`
    });

  } catch (error) {
    console.error('Batch language detection error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to detect languages',
      message: error.message
    });
  }
});

/**
 * @route GET /api/language/supported
 * @desc Get list of supported languages
 * @access Public
 */
router.get('/supported', async (req, res) => {
  try {
    
    const supportedLanguages = languageDetectionService.getSupportedLanguages();
    
    res.status(200).json({
      success: true,
      data: {
        supportedLanguages,
        totalCount: supportedLanguages.length
      },
      message: 'Supported languages retrieved successfully'
    });

  } catch (error) {
    console.error('Get supported languages error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to get supported languages',
      message: error.message
    });
  }
});

/**
 * @route GET /api/language/preferences/:userId
 * @desc Get user language preferences
 * @access Private (authenticated users)
 */
router.get('/preferences/:userId', authenticateUser, async (req, res) => {
  try {
    
    const { userId } = req.params;
    const requestingUserId = req.user?.id;

    // Check if user can access these preferences
    if (requestingUserId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You can only access your own language preferences'
      });
    }

    const preferences = await languageDetectionService.getUserLanguagePreferences(userId);
    
    res.status(200).json({
      success: true,
      data: preferences,
      message: 'User language preferences retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Get user language preferences error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to get user language preferences',
      message: error.message
    });
  }
});

/**
 * @route PUT /api/language/preferences/:userId
 * @desc Update user language preferences
 * @access Private (authenticated users)
 */
router.put('/preferences/:userId', authenticateUser, async (req, res) => {
  try {
    
    const { userId } = req.params;
    const requestingUserId = req.user?.id;
    const { primaryLanguage, secondaryLanguage, autoDetect, preferredCulturalContext } = req.body;

    // Check if user can update these preferences
    if (requestingUserId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You can only update your own language preferences'
      });
    }

    // Validate language codes
    if (primaryLanguage && !languageDetectionService.isLanguageSupported(primaryLanguage)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid primary language',
        message: `Language '${primaryLanguage}' is not supported`
      });
    }

    if (secondaryLanguage && !languageDetectionService.isLanguageSupported(secondaryLanguage)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid secondary language',
        message: `Language '${secondaryLanguage}' is not supported`
      });
    }

    // This would typically update the database
    // For now, return success
    const updatedPreferences = {
      primaryLanguage: primaryLanguage || 'en',
      secondaryLanguage: secondaryLanguage || 'zh',
      autoDetect: autoDetect !== undefined ? autoDetect : true,
      preferredCulturalContext: preferredCulturalContext || 'auto',
      lastUpdated: new Date().toISOString()
    };

    console.log(`✅ Language preferences updated for user: ${userId}`);
    
    res.status(200).json({
      success: true,
      data: updatedPreferences,
      message: 'User language preferences updated successfully'
    });

  } catch (error) {
    console.error('❌ Update user language preferences error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to update user language preferences',
      message: error.message
    });
  }
});

/**
 * @route POST /api/language/sentiment
 * @desc Analyze sentiment of text in detected language
 * @access Private (authenticated users)
 */
router.post('/sentiment', authenticateUser, async (req, res) => {
  try {
    
    const { text, languageCode } = req.body;
    const requestingUserId = req.user?.id;

    if (!text || !languageCode) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Both text and languageCode are required'
      });
    }

    // Validate language code
    if (!languageDetectionService.isLanguageSupported(languageCode)) {
      return res.status(400).json({
        success: false,
        error: 'Unsupported language',
        message: `Language '${languageCode}' is not supported for sentiment analysis`
      });
    }

    console.log(`Sentiment analysis for ${languageCode} text from user: ${requestingUserId}`);
    
    // Analyze sentiment
    const sentimentResult = await languageDetectionService.analyzeSentiment(text, languageCode);
    
    console.log(`✅ Sentiment analyzed: ${sentimentResult.sentiment} (confidence: ${sentimentResult.confidence})`);
    
    res.status(200).json({
      success: true,
      data: sentimentResult,
      message: `Sentiment analyzed: ${sentimentResult.sentiment}`
    });

  } catch (error) {
    console.error('❌ Sentiment analysis error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to analyze sentiment',
      message: error.message
    });
  }
});

/**
 * @route GET /api/language/health
 * @desc Health check for language detection service
 * @access Public
 */
router.get('/health', async (req, res) => {
  try {
    // Test language detection with a simple English phrase
    const testResult = await languageDetectionService.detectLanguage('Hello, how are you?');
    
    res.status(200).json({
      success: true,
      status: 'healthy',
      service: 'language-detection',
      timestamp: new Date().toISOString(),
      testResult: {
        detectedLanguage: testResult.detectedLanguage,
        confidence: testResult.confidence
      },
      message: 'Language detection service is healthy'
    });

  } catch (error) {
    console.error('❌ Language detection health check failed:', error);
    
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      service: 'language-detection',
      timestamp: new Date().toISOString(),
      error: error.message,
      message: 'Language detection service is unhealthy'
    });
  }
});

/**
 * @route POST /api/language/translate
 * @desc Translate text from one language to another
 * @access Public (for testing, normally Private)
 */
router.post('/translate', async (req, res) => {
  try {
    console.log('Translation request received');
    
    const { text, targetLanguage, sourceLanguage = 'auto' } = req.body;

    if (!text || !targetLanguage) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Text and targetLanguage are required'
      });
    }

    console.log(`Translating: "${text.substring(0, 50)}..." from ${sourceLanguage} to ${targetLanguage}`);
    
    // Translate text
    const translationResult = await translationService.translateText(text, targetLanguage, sourceLanguage);
    
    if (translationResult.success) {
      console.log(`✅ Translation successful: ${translationResult.sourceLanguage} → ${translationResult.targetLanguage}`);
      
      res.status(200).json({
        success: true,
        data: translationResult,
        message: `Text translated from ${translationResult.sourceLanguage} to ${translationResult.targetLanguage}`
      });
    } else {
      console.error('❌ Translation failed:', translationResult.error);
      
      res.status(500).json({
        success: false,
        error: 'Translation failed',
        message: translationResult.message || 'Unable to translate text'
      });
    }

  } catch (error) {
    console.error('❌ Translation error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Translation service error',
      message: error.message
    });
  }
});

/**
 * @route GET /api/language/supported
 * @desc Get list of supported languages
 * @access Public
 */
router.get('/supported', async (req, res) => {
  try {
    const supportedLanguages = translationService.getSupportedLanguages();
    
    res.status(200).json({
      success: true,
      data: supportedLanguages,
      message: 'Supported languages retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Error getting supported languages:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to get supported languages',
      message: error.message
    });
  }
});

module.exports = router;
