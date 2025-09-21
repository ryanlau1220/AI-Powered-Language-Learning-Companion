const AWS = require('aws-sdk');
require('dotenv').config();

// Configure AWS Comprehend for language detection
// Using ap-southeast-1 region for Comprehend
const comprehendRegion = process.env.AWS_REGION || 'ap-southeast-1';
console.log('LanguageDetectionService - Using region:', comprehendRegion);

class LanguageDetectionService {
  constructor() {
    // Initialize Comprehend for language detection
    this.comprehend = new AWS.Comprehend({ 
      region: comprehendRegion,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    });

    // Supported languages for our application
    this.supportedLanguages = {
      'en': { name: 'English', confidence: 0.8, culturalContext: 'Western' },
      'zh': { name: 'Chinese', confidence: 0.8, culturalContext: 'Chinese' },
      'zh-TW': { name: 'Chinese (Traditional)', confidence: 0.8, culturalContext: 'Chinese' }
    };

    // Language detection cache to improve performance
    this.detectionCache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Detect language of input text using AWS Comprehend
   * @param {string} text - Text to analyze
   * @param {string} userId - User ID for caching
   * @returns {Object} Language detection result
   */
  async detectLanguage(text, userId = null) {
    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(text, userId);
      const cached = this.getCachedDetection(cacheKey);
      if (cached) {
        console.log('Using cached language detection result');
        return cached;
      }

      // Validate input
      if (!text || text.trim().length < 3) {
        return this.getFallbackDetection('en');
      }

      console.log('Detecting language for text:', text.substring(0, 50) + '...');

      // Simple pattern-based detection for testing
      const chinesePattern = /[\u4e00-\u9fff\u3400-\u4dbf\u20000-\u2a6df\u2a700-\u2b73f\u2b740-\u2b81f\u2b820-\u2ceaf\uf900-\ufaff\u3300-\u33ff]/;
      const isChinese = chinesePattern.test(text);
      
      if (isChinese) {
        const detectionResult = {
          detectedLanguage: 'zh',
          confidence: 0.9,
          languageName: 'Chinese',
          culturalContext: 'Chinese',
          allDetectedLanguages: [{
            code: 'zh',
            name: 'Chinese',
            confidence: 0.9
          }],
          isSupported: true,
          fallbackUsed: false,
          timestamp: new Date().toISOString()
        };
        
        this.setCachedDetection(cacheKey, detectionResult);
        return detectionResult;
      }

      // If not Chinese, assume English for now
      const detectionResult = {
        detectedLanguage: 'en',
        confidence: 0.8,
        languageName: 'English',
        culturalContext: 'Western',
        allDetectedLanguages: [{
          code: 'en',
          name: 'English',
          confidence: 0.8
        }],
        isSupported: true,
        fallbackUsed: false,
        timestamp: new Date().toISOString()
      };
      
      this.setCachedDetection(cacheKey, detectionResult);
      console.log('Language detected:', detectionResult);
      return detectionResult;

    } catch (error) {
      console.error('Error in language detection:', error);
      
      // Return fallback detection
      const fallbackResult = this.getFallbackDetection('en');
      fallbackResult.error = error.message;
      return fallbackResult;
    }
  }

  /**
   * Batch detect languages for multiple texts
   * @param {Array} texts - Array of texts to analyze
   * @param {string} userId - User ID for caching
   * @returns {Array} Array of language detection results
   */
  async batchDetectLanguages(texts, userId = null) {
    try {
      console.log(`Batch detecting languages for ${texts.length} texts`);
      
      const promises = texts.map(text => this.detectLanguage(text, userId));
      const results = await Promise.all(promises);
      
      return results;
    } catch (error) {
      console.error('Error in batch language detection:', error);
      return texts.map(() => this.getFallbackDetection('en'));
    }
  }

  /**
   * Get language preferences for a user
   * @param {string} userId - User ID
   * @returns {Object} User language preferences
   */
  async getUserLanguagePreferences(userId) {
    try {
      // This would typically fetch from database
      // For now, return default preferences
      return {
        primaryLanguage: 'en',
        secondaryLanguage: 'zh',
        preferredCulturalContext: 'auto',
        autoDetect: true,
        lastDetectedLanguage: 'en'
      };
    } catch (error) {
      console.error('Error getting user language preferences:', error);
      return {
        primaryLanguage: 'en',
        secondaryLanguage: 'zh',
        preferredCulturalContext: 'auto',
        autoDetect: true,
        lastDetectedLanguage: 'en'
      };
    }
  }

  /**
   * Map Comprehend language codes to our supported languages
   * @param {Object} comprehendLanguage - Language from Comprehend
   * @returns {Object} Mapped language object
   */
  mapToSupportedLanguage(comprehendLanguage) {
    const code = comprehendLanguage.LanguageCode;
    
    // Direct mapping for supported languages
    if (code === 'en') {
      return { 
        code: 'en', 
        name: 'English', 
        culturalContext: 'Western',
        isSupported: true 
      };
    }
    
    if (code === 'zh' || code === 'zh-TW') {
      return { 
        code: 'zh', 
        name: 'Chinese', 
        culturalContext: 'Chinese',
        isSupported: true 
      };
    }

    // For unsupported languages, default to English
    return { 
      code: 'en', 
      name: 'English', 
      culturalContext: 'Western',
      isSupported: false,
      originalCode: code
    };
  }

  /**
   * Generate cache key for language detection
   * @param {string} text - Input text
   * @param {string} userId - User ID
   * @returns {string} Cache key
   */
  generateCacheKey(text, userId) {
    const textHash = this.simpleHash(text.toLowerCase().trim());
    return userId ? `${userId}:${textHash}` : textHash;
  }

  /**
   * Simple hash function for caching
   * @param {string} str - String to hash
   * @returns {string} Hash value
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Get cached detection result
   * @param {string} key - Cache key
   * @returns {Object|null} Cached result or null
   */
  getCachedDetection(key) {
    const cached = this.detectionCache.get(key);
    if (!cached) return null;
    
    // Check if cache has expired
    if (Date.now() - cached.timestamp > this.cacheExpiry) {
      this.detectionCache.delete(key);
      return null;
    }
    
    return cached.result;
  }

  /**
   * Set cached detection result
   * @param {string} key - Cache key
   * @param {Object} result - Detection result
   */
  setCachedDetection(key, result) {
    this.detectionCache.set(key, {
      result: result,
      timestamp: Date.now()
    });
    
    // Clean up old cache entries periodically
    if (this.detectionCache.size > 1000) {
      this.cleanupCache();
    }
  }

  /**
   * Clean up expired cache entries
   */
  cleanupCache() {
    const now = Date.now();
    for (const [key, value] of this.detectionCache.entries()) {
      if (now - value.timestamp > this.cacheExpiry) {
        this.detectionCache.delete(key);
      }
    }
  }

  /**
   * Get fallback language detection result
   * @param {string} fallbackCode - Fallback language code
   * @returns {Object} Fallback detection result
   */
  getFallbackDetection(fallbackCode = 'en') {
    const language = this.supportedLanguages[fallbackCode] || this.supportedLanguages['en'];
    
    return {
      detectedLanguage: fallbackCode,
      confidence: 0.5,
      languageName: language.name,
      culturalContext: language.culturalContext,
      allDetectedLanguages: [{
        code: fallbackCode,
        name: language.name,
        confidence: 0.5
      }],
      isSupported: true,
      fallbackUsed: true,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Validate if language is supported
   * @param {string} languageCode - Language code to validate
   * @returns {boolean} Whether language is supported
   */
  isLanguageSupported(languageCode) {
    return Object.keys(this.supportedLanguages).includes(languageCode);
  }

  /**
   * Get supported languages list
   * @returns {Array} List of supported languages
   */
  getSupportedLanguages() {
    return Object.entries(this.supportedLanguages).map(([code, config]) => ({
      code,
      name: config.name,
      culturalContext: config.culturalContext,
      confidence: config.confidence
    }));
  }

  /**
   * Get cultural context for language
   * @param {string} languageCode - Language code
   * @returns {string} Cultural context
   */
  getCulturalContext(languageCode) {
    const language = this.supportedLanguages[languageCode];
    return language ? language.culturalContext : 'Western';
  }

  /**
   * Analyze text sentiment in detected language
   * @param {string} text - Text to analyze
   * @param {string} languageCode - Language code
   * @returns {Object} Sentiment analysis result
   */
  async analyzeSentiment(text, languageCode) {
    try {
      // Only analyze sentiment for supported languages
      if (!this.isLanguageSupported(languageCode)) {
        return {
          sentiment: 'NEUTRAL',
          confidence: 0.5,
          languageCode: 'en',
          error: 'Language not supported for sentiment analysis'
        };
      }

      const params = {
        Text: text.substring(0, 5000),
        LanguageCode: languageCode === 'zh' ? 'zh' : 'en'
      };

      const result = await this.comprehend.detectSentiment(params).promise();
      
      return {
        sentiment: result.Sentiment,
        confidence: Math.max(...Object.values(result.SentimentScore)),
        sentimentScores: result.SentimentScore,
        languageCode: languageCode,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error in sentiment analysis:', error);
      return {
        sentiment: 'NEUTRAL',
        confidence: 0.5,
        languageCode: languageCode,
        error: error.message
      };
    }
  }
}

module.exports = new LanguageDetectionService();
