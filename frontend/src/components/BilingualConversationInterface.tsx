import React, { useState, useRef, useEffect } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import LanguageIndicator from './LanguageIndicator'
import LanguageSwitcher from './LanguageSwitcher'

interface Message {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: string
  language?: string
  culturalContext?: string
  confidence?: number
  detectedLanguage?: string
  languageConfidence?: number
}

interface BilingualConversationInterfaceProps {
  onMessageSend?: (message: string, language: string) => void
  messages?: Message[]
  isProcessing?: boolean
  className?: string
}

export const BilingualConversationInterface: React.FC<BilingualConversationInterfaceProps> = ({
  onMessageSend,
  messages = [],
  isProcessing = false,
  className = ''
}) => {
  const { currentLanguage } = useLanguage()
  const [inputText, setInputText] = useState('')
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = () => {
    if (inputText.trim() && onMessageSend) {
      onMessageSend(inputText.trim(), detectedLanguage || currentLanguage.code)
      setInputText('')
      setDetectedLanguage(null)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleLanguageDetected = (result: any) => {
    setDetectedLanguage(result.detectedLanguage)
  }

  const getLanguageFlag = (languageCode?: string) => {
    const flags: Record<string, string> = {
      'en': '🇺🇸',
      'zh': '🇨🇳',
      'zh-CN': '🇨🇳',
      'zh-TW': '🇹🇼'
    }
    return flags[languageCode || ''] || '🌐'
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  return (
    <div className={`flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-semibold text-gray-800">AI Language Tutor</h3>
          <LanguageSwitcher />
        </div>
        <div className="text-sm text-gray-500">
          Current: {currentLanguage.flag} {currentLanguage.name}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <div className="text-6xl mb-4">🤖</div>
            <h4 className="text-xl font-medium mb-2">Start a conversation</h4>
            <p className="text-center max-w-md">
              Type a message in English or Chinese and I'll respond in the same language. 
              I'll automatically detect your language and adapt my responses accordingly.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`
                  max-w-xs lg:max-w-md px-4 py-2 rounded-lg
                  ${message.type === 'user' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-800'
                  }
                `}
              >
                {/* Message Content */}
                <div className="mb-1">
                  {message.content}
                </div>
                
                {/* Message Metadata */}
                <div className={`
                  flex items-center justify-between text-xs
                  ${message.type === 'user' ? 'text-blue-100' : 'text-gray-500'}
                `}>
                  <div className="flex items-center space-x-2">
                    {/* Language Flag */}
                    <span>{getLanguageFlag(message.language || message.detectedLanguage)}</span>
                    
                    {/* Cultural Context */}
                    {message.culturalContext && (
                      <span className="text-xs opacity-75">
                        {message.culturalContext}
                      </span>
                    )}
                    
                    {/* Confidence Score */}
                    {message.confidence && (
                      <span className="text-xs opacity-75">
                        {Math.round(message.confidence * 100)}%
                      </span>
                    )}
                  </div>
                  
                  <span>{formatTimestamp(message.timestamp)}</span>
                </div>

                {/* Language Detection Info for User Messages */}
                {message.type === 'user' && message.detectedLanguage && (
                  <div className="mt-2 pt-2 border-t border-blue-400">
                    <LanguageIndicator
                      text={message.content}
                      showDetails={true}
                      className="text-xs"
                    />
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        
        {/* Processing Indicator */}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                <span>AI is thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
        <div className="flex flex-col space-y-2">
          {/* Language Detection Indicator */}
          {inputText && (
            <LanguageIndicator
              text={inputText}
              onLanguageDetected={handleLanguageDetected}
              className="text-sm"
            />
          )}
          
          {/* Input Field */}
          <div className="flex space-x-2">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Type your message in ${currentLanguage.name} or Chinese...`}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={2}
              disabled={isProcessing}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isProcessing}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          
          {/* Helpful Tips */}
          <div className="text-xs text-gray-500">
            <p>
              💡 <strong>Tip:</strong> I automatically detect English and Chinese. 
              Try switching between languages mid-conversation!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BilingualConversationInterface
