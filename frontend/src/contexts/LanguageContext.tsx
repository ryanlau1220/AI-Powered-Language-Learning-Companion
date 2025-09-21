import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { translationService } from '../services/translationService'

export interface Language {
  code: string
  name: string
  nativeName: string
  flag: string
}

export interface LanguageContextType {
  currentLanguage: Language
  availableLanguages: Language[]
  setLanguage: (language: Language) => void
  isRTL: boolean
  // UI Language features
  uiLanguage: 'en' | 'zh'
  setUILanguage: (language: 'en' | 'zh') => void
  autoSwitchUI: boolean
  setAutoSwitchUI: (enabled: boolean) => void
  translate: (key: string, fallback?: string) => string
  translateDynamic: (text: string, targetLanguage?: 'en' | 'zh') => Promise<string>
  detectAndSwitchUILanguage: (text: string) => Promise<void>
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const availableLanguages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' }
]

const rtlLanguages = ['ar', 'he', 'fa', 'ur']

interface LanguageProviderProps {
  children: ReactNode
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(() => {
    // Get saved language from localStorage or default to English
    const savedLanguage = localStorage.getItem('selectedLanguage')
    if (savedLanguage) {
      const parsed = JSON.parse(savedLanguage)
      return availableLanguages.find(lang => lang.code === parsed.code) || availableLanguages[0]
    }
    return availableLanguages[0]
  })

  // UI Language state
  const [uiLanguage, setUILanguage] = useState<'en' | 'zh'>(() => {
    const savedUILanguage = localStorage.getItem('uiLanguage') as 'en' | 'zh'
    return savedUILanguage || 'en'
  })

  const [autoSwitchUI, setAutoSwitchUI] = useState<boolean>(() => {
    const savedAutoSwitch = localStorage.getItem('autoSwitchUI')
    return savedAutoSwitch !== null ? savedAutoSwitch === 'true' : true
  })

  const isRTL = rtlLanguages.includes(currentLanguage.code)

  const setLanguage = (language: Language) => {
    setCurrentLanguage(language)
    localStorage.setItem('selectedLanguage', JSON.stringify(language))
    
    // Update document direction for RTL languages
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr'
    document.documentElement.lang = language.code
  }

  // Save UI language preference
  useEffect(() => {
    localStorage.setItem('uiLanguage', uiLanguage)
  }, [uiLanguage])

  // Save auto-switch preference
  useEffect(() => {
    localStorage.setItem('autoSwitchUI', autoSwitchUI.toString())
  }, [autoSwitchUI])

  useEffect(() => {
    // Set initial document attributes
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr'
    document.documentElement.lang = currentLanguage.code
  }, [currentLanguage, isRTL])

  // Smart language detection for UI switching
  const detectAndSwitchUILanguage = async (text: string) => {
    if (!autoSwitchUI) return

    try {
      const detectedLanguage = await translationService.detectAndSwitchLanguage(text)
      if (detectedLanguage !== uiLanguage) {
        setUILanguage(detectedLanguage)
        console.log(`🔄 Auto-switched UI language to: ${detectedLanguage}`)
      }
    } catch (error) {
      console.error('Error in auto language switching:', error)
    }
  }

  // Translation functions
  const translate = (key: string, fallback?: string): string => {
    const translated = translationService.getStaticTranslation(key, uiLanguage)
    return translated !== key ? translated : (fallback || key)
  }

  const translateDynamic = async (text: string, targetLanguage?: 'en' | 'zh'): Promise<string> => {
    try {
      const result = await translationService.translateDynamicContent(
        text, 
        targetLanguage || uiLanguage
      )
      
      if (result.success && result.translatedText) {
        return result.translatedText
      }
    } catch (error) {
      console.error('Dynamic translation error:', error)
    }
    
    return text // Return original text if translation fails
  }

  const value: LanguageContextType = {
    currentLanguage,
    availableLanguages,
    setLanguage,
    isRTL,
    uiLanguage,
    setUILanguage,
    autoSwitchUI,
    setAutoSwitchUI,
    translate,
    translateDynamic,
    detectAndSwitchUILanguage
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
