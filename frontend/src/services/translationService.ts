import { apiService } from './api';

export interface TranslationResult {
  success: boolean;
  translatedText?: string;
  error?: string;
}

export interface LanguagePreference {
  code: 'en' | 'zh';
  name: string;
  nativeName: string;
  culturalContext: 'Western' | 'Chinese';
}

class TranslationService {
  private cache = new Map<string, string>();
  private cacheDuration = 5 * 60 * 1000; // 5 minutes

  // Static translations for UI elements
  private staticTranslations = {
    en: {},
    zh: {}
  };

  // Language preferences
  public readonly languages: LanguagePreference[] = [
    {
      code: 'en',
      name: 'English',
      nativeName: 'English',
      culturalContext: 'Western'
    },
    {
      code: 'zh',
      name: 'Chinese',
      nativeName: '中文',
      culturalContext: 'Chinese'
    }
  ];

  constructor() {
    // Load static translations
    this.loadStaticTranslations();
  }

  private async loadStaticTranslations() {
    try {
      const enResponse = await fetch('/src/locales/en.json');
      const zhResponse = await fetch('/src/locales/zh.json');
      
      this.staticTranslations.en = await enResponse.json();
      this.staticTranslations.zh = await zhResponse.json();
    } catch (error) {
      console.error('Error loading static translations:', error);
    }
  }

  /**
   * Get static translation for UI elements
   */
  public getStaticTranslation(key: string, language: 'en' | 'zh' = 'en'): string {
    const keys = key.split('.');
    let value: any = this.staticTranslations[language];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to English if translation not found
        value = this.staticTranslations.en;
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object' && fallbackKey in value) {
            value = value[fallbackKey];
          } else {
            return key; // Return key if no translation found
          }
        }
        break;
      }
    }
    
    return typeof value === 'string' ? value : key;
  }

  /**
   * Translate dynamic content using AI
   */
  public async translateDynamicContent(
    text: string, 
    targetLanguage: 'en' | 'zh',
    sourceLanguage?: 'en' | 'zh'
  ): Promise<TranslationResult> {
    try {
      // Check cache first
      const cacheKey = `${sourceLanguage || 'auto'}-${targetLanguage}-${text}`;
      const cached = this.getCachedTranslation(cacheKey);
      if (cached) {
        return {
          success: true,
          translatedText: cached
        };
      }

      // Skip translation if source and target are the same
      if (sourceLanguage === targetLanguage) {
        return {
          success: true,
          translatedText: text
        };
      }

      // Use AI translation for dynamic content
      const response = await apiService.translateText({
        text,
        targetLanguage,
        sourceLanguage
      });

      if (response.data.success && response.data.translatedText) {
        // Cache the result
        this.setCachedTranslation(cacheKey, response.data.translatedText);
        
        return {
          success: true,
          translatedText: response.data.translatedText
        };
      } else {
        return {
          success: false,
          error: 'Translation failed'
        };
      }
    } catch (error) {
      console.error('Translation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Translation failed'
      };
    }
  }

  /**
   * Smart language detection and UI switching
   */
  public async detectAndSwitchLanguage(text: string): Promise<'en' | 'zh'> {
    try {
      // Use existing language detection service
      const response = await apiService.detectLanguage({ text });
      
      if (response.data.success && response.data.detectedLanguage) {
        const detectedLang = response.data.detectedLanguage;
        
        // Map detected language to UI language
        if (detectedLang === 'zh') {
          return 'zh';
        } else {
          return 'en'; // Default to English for other languages
        }
      }
    } catch (error) {
      console.error('Language detection error:', error);
    }
    
    return 'en'; // Default fallback
  }

  /**
   * Get cached translation
   */
  private getCachedTranslation(key: string): string | null {
    const entry = this.cache.get(key);
    if (entry && (Date.now() - JSON.parse(entry).timestamp < this.cacheDuration)) {
      return JSON.parse(entry).text;
    }
    return null;
  }

  /**
   * Set cached translation
   */
  private setCachedTranslation(key: string, text: string): void {
    this.cache.set(key, JSON.stringify({ text, timestamp: Date.now() }));
  }

  /**
   * Clear translation cache
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get language preference by code
   */
  public getLanguageByCode(code: 'en' | 'zh'): LanguagePreference | undefined {
    return this.languages.find(lang => lang.code === code);
  }

  /**
   * Format text based on language (for numbers, dates, etc.)
   */
  public formatText(text: string, _language: 'en' | 'zh'): string {
    // Add language-specific formatting here if needed
    return text;
  }
}

export const translationService = new TranslationService();
