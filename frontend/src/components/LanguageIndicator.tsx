import React, { useState, useEffect } from 'react'
import { useLanguage } from '../contexts/LanguageContext'

interface LanguageDetectionResult {
  detectedLanguage: string
  confidence: number
  languageName: string
  culturalContext: string
  isSupported: boolean
  fallbackUsed: boolean
}

interface LanguageIndicatorProps {
  text?: string
  userId?: string
  onLanguageDetected?: (result: LanguageDetectionResult) => void
  showDetails?: boolean
  className?: string
}

export const LanguageIndicator: React.FC<LanguageIndicatorProps> = ({
  text,
  userId,
  onLanguageDetected,
  showDetails = false,
  className = ''
}) => {
  const { currentLanguage } = useLanguage()
  const [detectionResult, setDetectionResult] = useState<LanguageDetectionResult | null>(null)
  const [isDetecting, setIsDetecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const detectLanguage = async (inputText: string) => {
    if (!inputText || inputText.trim().length < 3) {
      setDetectionResult(null)
      return
    }

    setIsDetecting(true)
    setError(null)

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/language/detect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          text: inputText,
          userId: userId
        })
      })

      if (!response.ok) {
        throw new Error('Language detection failed')
      }

      const data = await response.json()
      if (data.success) {
        const result = data.data
        setDetectionResult(result)
        onLanguageDetected?.(result)
        
        console.log('🔍 Language detected:', {
          language: result.languageName,
          confidence: result.confidence,
          cultural: result.culturalContext
        })
      } else {
        throw new Error(data.message || 'Detection failed')
      }
    } catch (err) {
      console.error('❌ Language detection error:', err)
      setError(err instanceof Error ? err.message : 'Detection failed')
    } finally {
      setIsDetecting(false)
    }
  }

  useEffect(() => {
    if (text) {
      const timeoutId = setTimeout(() => {
        detectLanguage(text)
      }, 1000) // Debounce detection

      return () => clearTimeout(timeoutId)
    }
  }, [text, userId])

  const getLanguageFlag = (languageCode: string) => {
    const flags: Record<string, string> = {
      'en': '🇺🇸',
      'zh': '🇨🇳',
      'zh-CN': '🇨🇳',
      'zh-TW': '🇹🇼'
    }
    return flags[languageCode] || '🌐'
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600'
    if (confidence >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return 'High'
    if (confidence >= 0.6) return 'Medium'
    return 'Low'
  }

  if (isDetecting) {
    return (
      <div className={`flex items-center space-x-2 text-sm text-gray-500 ${className}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        <span>Detecting language...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`flex items-center space-x-2 text-sm text-red-500 ${className}`}>
        <span>⚠️</span>
        <span>Detection error</span>
      </div>
    )
  }

  if (!detectionResult) {
    return null
  }

  return (
    <div className={`flex items-center space-x-2 text-sm ${className}`}>
      {/* Language Flag and Name */}
      <div className="flex items-center space-x-1">
        <span className="text-lg">{getLanguageFlag(detectionResult.detectedLanguage)}</span>
        <span className="font-medium text-gray-700">
          {detectionResult.languageName}
        </span>
      </div>

      {/* Confidence Indicator */}
      <div className={`flex items-center space-x-1 ${getConfidenceColor(detectionResult.confidence)}`}>
        <div className={`w-2 h-2 rounded-full ${
          detectionResult.confidence >= 0.8 ? 'bg-green-500' :
          detectionResult.confidence >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
        }`}></div>
        <span className="text-xs">
          {getConfidenceText(detectionResult.confidence)} ({Math.round(detectionResult.confidence * 100)}%)
        </span>
      </div>

      {/* Cultural Context */}
      {showDetails && (
        <div className="flex items-center space-x-1 text-xs text-gray-500">
          <span>🏛️</span>
          <span>{detectionResult.culturalContext}</span>
        </div>
      )}

      {/* Fallback Indicator */}
      {detectionResult.fallbackUsed && (
        <div className="flex items-center space-x-1 text-xs text-orange-500">
          <span>🔄</span>
          <span>Fallback</span>
        </div>
      )}

      {/* Unsupported Language Warning */}
      {!detectionResult.isSupported && (
        <div className="flex items-center space-x-1 text-xs text-red-500">
          <span>⚠️</span>
          <span>Unsupported</span>
        </div>
      )}
    </div>
  )
}

export default LanguageIndicator
