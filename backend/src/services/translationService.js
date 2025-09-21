const AWS = require('aws-sdk');
const languageDetectionService = require('./languageDetectionService');

class TranslationService {
  constructor() {
    // Initialize AWS Translate
    this.translate = new AWS.Translate({ 
      region: process.env.TRANSLATE_REGION || 'ap-southeast-1' 
    });
  }

  /**
   * Translate text using AWS Translate or fallback to pattern-based translation
   * @param {string} text - Text to translate
   * @param {string} targetLanguage - Target language code (en, zh)
   * @param {string} sourceLanguage - Source language code (en, zh) or 'auto'
   * @returns {Object} Translation result
   */
  async translateText(text, targetLanguage, sourceLanguage = 'auto') {
    try {
      console.log(`Translating text: "${text.substring(0, 50)}..." from ${sourceLanguage} to ${targetLanguage}`);

      // Skip translation if source and target are the same
      if (sourceLanguage === targetLanguage || (sourceLanguage === 'auto' && targetLanguage === 'en')) {
        return {
          success: true,
          translatedText: text,
          sourceLanguage: sourceLanguage,
          targetLanguage: targetLanguage,
          method: 'no_translation_needed'
        };
      }

      // If source is auto, detect the language first
      if (sourceLanguage === 'auto') {
        const detection = await languageDetectionService.detectLanguage(text);
        sourceLanguage = detection.detectedLanguage;
        console.log(`Auto-detected source language: ${sourceLanguage}`);
      }

      // Skip translation if detected source is same as target
      if (sourceLanguage === targetLanguage) {
        return {
          success: true,
          translatedText: text,
          sourceLanguage: sourceLanguage,
          targetLanguage: targetLanguage,
          method: 'no_translation_needed'
        };
      }

      // Use AWS Translate for actual translation
      const params = {
        Text: text,
        SourceLanguageCode: sourceLanguage,
        TargetLanguageCode: targetLanguage
      };

      const result = await this.translate.translateText(params).promise();
      
      console.log(`✅ Translation successful: ${sourceLanguage} → ${targetLanguage}`);
      
      return {
        success: true,
        translatedText: result.TranslatedText,
        sourceLanguage: sourceLanguage,
        targetLanguage: targetLanguage,
        method: 'aws_translate'
      };

    } catch (error) {
      console.error('❌ Translation error:', error);
      
      // Fallback to simple pattern-based translation for common phrases
      const fallbackTranslation = this.getFallbackTranslation(text, targetLanguage);
      
      if (fallbackTranslation) {
        console.log(`Using fallback translation`);
        return {
          success: true,
          translatedText: fallbackTranslation,
          sourceLanguage: sourceLanguage,
          targetLanguage: targetLanguage,
          method: 'fallback'
        };
      }

      return {
        success: false,
        error: 'Translation failed',
        message: error.message,
        fallbackUsed: false
      };
    }
  }

  /**
   * Fallback translation for common phrases
   * @param {string} text - Text to translate
   * @param {string} targetLanguage - Target language
   * @returns {string|null} Translated text or null if no fallback available
   */
  getFallbackTranslation(text, targetLanguage) {
    const commonPhrases = {
      'en': {
        'zh': {
          'Hello': '你好',
          'Thank you': '谢谢',
          'Goodbye': '再见',
          'Yes': '是',
          'No': '否',
          'Please': '请',
          'Sorry': '对不起',
          'Welcome': '欢迎',
          'Loading...': '加载中...',
          'Error': '错误',
          'Success': '成功'
        }
      },
      'zh': {
        'en': {
          '你好': 'Hello',
          '谢谢': 'Thank you',
          '再见': 'Goodbye',
          '是': 'Yes',
          '否': 'No',
          '请': 'Please',
          '对不起': 'Sorry',
          '欢迎': 'Welcome',
          '加载中...': 'Loading...',
          '错误': 'Error',
          '成功': 'Success'
        }
      }
    };

    // Simple word-by-word translation for common phrases
    const words = text.split(' ');
    const translatedWords = words.map(word => {
      const cleanWord = word.replace(/[.,!?;:]/, '');
      const translated = commonPhrases[targetLanguage === 'zh' ? 'en' : 'zh']?.[targetLanguage]?.[cleanWord];
      return translated || word;
    });

    return translatedWords.join(' ');
  }

  /**
   * Batch translate multiple texts
   * @param {Array} texts - Array of texts to translate
   * @param {string} targetLanguage - Target language
   * @param {string} sourceLanguage - Source language
   * @returns {Array} Array of translation results
   */
  async batchTranslate(texts, targetLanguage, sourceLanguage = 'auto') {
    const results = [];
    
    for (const text of texts) {
      const result = await this.translateText(text, targetLanguage, sourceLanguage);
      results.push(result);
    }
    
    return results;
  }

  /**
   * Get supported languages
   * @returns {Array} Array of supported language codes
   */
  getSupportedLanguages() {
    return [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'zh', name: 'Chinese', nativeName: '中文' }
    ];
  }
}

module.exports = new TranslationService();
