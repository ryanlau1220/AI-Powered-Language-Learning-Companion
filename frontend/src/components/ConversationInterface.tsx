import React, { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Send, Volume2, VolumeX, Loader2, ArrowLeft, Globe } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { apiService } from '../services/api'
import LanguageIndicator from './LanguageIndicator'

interface ConversationInterfaceProps {
  conversationId?: string
  scenario?: string
  onMessageSent?: (message: string) => void
  onBack?: () => void
}

interface Message {
  messageId: string
  type: 'user' | 'ai'
  content: string
  timestamp: string
  language?: string
  culturalContext?: string
  detectedLanguage?: string
  languageConfidence?: number
  metadata?: {
    confidence?: number
    sentiment?: string
    grammarSuggestions?: string[]
    pronunciationTips?: string[]
  }
}

const ConversationInterface: React.FC<ConversationInterfaceProps> = ({
  conversationId,
  scenario = 'general',
  onMessageSent,
  onBack
}) => {
  const { currentLanguage, translate, detectAndSwitchUILanguage } = useLanguage()
  const [isRecording, setIsRecording] = useState(false)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isAnalyzingPronunciation, setIsAnalyzingPronunciation] = useState(false)
  const [pronunciationFeedback, setPronunciationFeedback] = useState<any>(null)
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null)
  const [languageDetectionResult, setLanguageDetectionResult] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Initialize conversation on component mount
  useEffect(() => {
    // Start with a scenario-specific welcome message
    const scenarioMessages = {
      restaurant: "Welcome to our restaurant! I'll be your server today. What would you like to order?",
      school: "Hello! Welcome to our school. I'm here to help you with any questions about our programs or campus life.",
      work: "Good morning! I'm here to discuss our project. How can I assist you with your work today?",
      general: "Hello! I'm your AI language learning tutor. Let's practice conversations. What would you like to talk about?"
    }
    
    setMessages([{
      messageId: '1',
      type: 'ai',
      content: scenarioMessages[scenario as keyof typeof scenarioMessages] || scenarioMessages.general,
      timestamp: new Date().toISOString()
    }])
  }, [scenario, currentLanguage.code])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleLanguageDetected = (result: any) => {
    setDetectedLanguage(result.detectedLanguage)
    setLanguageDetectionResult(result)
    console.log('🔍 Language detected:', result)
  }

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return

    // Smart language detection for UI switching
    await detectAndSwitchUILanguage(message)

    const userMessage: Message = {
      messageId: `user-${Date.now()}`,
      type: 'user',
      content: message,
      timestamp: new Date().toISOString(),
      detectedLanguage: detectedLanguage || undefined,
      languageConfidence: languageDetectionResult?.confidence
    }

    // Add user message immediately
    setMessages(prev => [...prev, userMessage])
    onMessageSent?.(message)
    const currentMessage = message
    setMessage('')
    setIsLoading(true)

    try {
      const response = await apiService.sendMessage({
        conversationId: conversationId || 'new',
        message: currentMessage,
        scenario: scenario
      })
      
      if (response.data.success) {
        const responseData = response.data.data
        const aiMessage: Message = {
          messageId: responseData.messageId || `ai-${Date.now()}`,
          type: 'ai',
          content: responseData.content || responseData.response,
          timestamp: new Date().toISOString(),
          language: responseData.language,
          culturalContext: responseData.culturalContext,
          metadata: responseData.metadata || {}
        }
        setMessages(prev => [...prev, aiMessage])
        
        // Show language detection info if available
        if (responseData.languageDetection) {
          console.log('🔄 Language switched:', responseData.languageDetection)
        }
      } else {
        console.error('Failed to get AI response:', response.data.error)
        const errorMessage: Message = {
          messageId: `error-${Date.now()}`,
          type: 'ai',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date().toISOString()
        }
        setMessages(prev => [...prev, errorMessage])
      }
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        messageId: `error-${Date.now()}`,
        type: 'ai',
        content: 'Unable to connect to the server. Please check your connection and try again.',
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      setDetectedLanguage(null)
      setLanguageDetectionResult(null)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const startRecording = async () => {
    try {
      setIsRecording(true)
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream)
      const audioChunks: Blob[] = []
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data)
      }
      
      mediaRecorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
        
        // Create audio blob with compression
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm;codecs=opus' })
        
        // Check if audio is too large (limit to 1MB)
        if (audioBlob.size > 1024 * 1024) {
          console.warn('Audio too large, using fallback')
          setMessage('Audio too long. Please try shorter recordings or type instead.')
          return
        }
        
        // Convert to base64 for API
        const reader = new FileReader()
        reader.onloadend = async () => {
          const base64Audio = reader.result as string
          const audioData = base64Audio.split(',')[1] // Remove data:audio/webm;base64, prefix
          
          try {
            // Send to backend for transcription
            const response = await apiService.transcribeAudio({
              audioData,
              languageCode: currentLanguage.code === 'en' ? 'en-US' : 'en-US'
            })
            
            if (response.data.success) {
              // Set the transcribed text as the message
              setMessage(response.data.data.text || 'Could not transcribe audio')
            } else {
              setMessage('Transcription failed. Please try again.')
            }
          } catch (error) {
            console.error('Error transcribing audio:', error)
            setMessage('Transcription failed. Please try typing instead.')
          }
        }
        reader.readAsDataURL(audioBlob)
      }
      
      // Start recording
      mediaRecorder.start()
      
      // Store mediaRecorder for stopping
      ;(window as any).currentMediaRecorder = mediaRecorder
      
    } catch (error) {
      console.error('Error accessing microphone:', error)
      setIsRecording(false)
      alert('Microphone access denied. Please allow microphone access to use voice input.')
    }
  }

  const stopRecording = () => {
    const mediaRecorder = (window as any).currentMediaRecorder
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop()
    }
    setIsRecording(false)
  }

  const playAudio = async (text?: string) => {
    try {
      setIsPlaying(true)
      
      const textToSpeak = text || message
      if (!textToSpeak.trim()) {
        setIsPlaying(false)
        return
      }
      
      // Send text to backend for speech synthesis
      const response = await apiService.synthesizeSpeech({
        text: textToSpeak,
        voiceId: 'Joanna', // Default English voice
        languageCode: currentLanguage.code === 'en' ? 'en-US' : 'en-US'
      })
      
      if (response.data.success && response.data.data.audioData) {
        try {
          // Convert base64 audio to blob
          const audioData = response.data.data.audioData
          
          // Handle both string and object formats
          let base64String
          if (typeof audioData === 'string') {
            base64String = audioData
          } else if (audioData && typeof audioData === 'object' && audioData.audioData) {
            base64String = audioData.audioData
          } else {
            throw new Error('Invalid audio data format')
          }
          
          // Ensure base64String is properly formatted
          let base64Data = String(base64String || '')
          if (!base64Data.startsWith('data:')) {
            base64Data = `data:audio/mpeg;base64,${base64Data}`
          }
          
          // Convert to blob
          const fetchResponse = await fetch(base64Data)
          if (!fetchResponse.ok) {
            throw new Error(`HTTP error! status: ${fetchResponse.status}`)
          }
          
          const audioBlob = await fetchResponse.blob()
          
          // Create audio element and play
          const audio = new Audio()
          audio.src = URL.createObjectURL(audioBlob)
          
          audio.onended = () => {
            setIsPlaying(false)
            URL.revokeObjectURL(audio.src)
          }
          
          audio.onerror = (error) => {
            setIsPlaying(false)
            console.error('Error playing audio:', error)
            URL.revokeObjectURL(audio.src)
          }
          
          await audio.play()
        } catch (audioError) {
          console.error('Error processing audio data:', audioError)
          setIsPlaying(false)
        }
      } else {
        setIsPlaying(false)
        console.error('Speech synthesis failed or no audio data received')
      }
    } catch (error) {
      console.error('Error playing audio:', error)
      setIsPlaying(false)
    }
  }

  const analyzePronunciation = async (text: string) => {
    try {
      setIsAnalyzingPronunciation(true)
      
      // Request microphone access for pronunciation recording
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream)
      const audioChunks: Blob[] = []
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data)
      }
      
      mediaRecorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
        
        // Create audio blob with compression
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm;codecs=opus' })
        
        // Check if audio is too large (limit to 1MB)
        if (audioBlob.size > 1024 * 1024) {
          console.warn('Audio too large for pronunciation analysis')
          setPronunciationFeedback({
            overallScore: 0,
            fluencyScore: 0,
            clarityScore: 0,
            improvements: ['Audio too long. Please try shorter recordings.']
          })
          setIsAnalyzingPronunciation(false)
          return
        }
        
        // Convert to base64 for API
        const reader = new FileReader()
        reader.onloadend = async () => {
          const base64Audio = reader.result as string
          const audioData = base64Audio.split(',')[1] // Remove data:audio/webm;base64, prefix
          
          try {
            // Send to backend for pronunciation analysis
            const response = await apiService.analyzePronunciation({
              audioData,
              text,
              language: currentLanguage.code
            })
            
            if (response.data.success) {
              setPronunciationFeedback(response.data.data)
            } else {
              console.error('Pronunciation analysis failed')
              setPronunciationFeedback({
                overallScore: 0,
                fluencyScore: 0,
                clarityScore: 0,
                improvements: ['Analysis failed. Please try again.']
              })
            }
          } catch (error) {
            console.error('Error analyzing pronunciation:', error)
            setPronunciationFeedback({
              overallScore: 0,
              fluencyScore: 0,
              clarityScore: 0,
              improvements: ['Analysis failed. Please try again.']
            })
          } finally {
            setIsAnalyzingPronunciation(false)
          }
        }
        reader.readAsDataURL(audioBlob)
      }
      
      // Start recording
      mediaRecorder.start()
      
      // Stop recording after 5 seconds
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop()
        }
      }, 5000)
      
    } catch (error) {
      console.error('Error accessing microphone for pronunciation analysis:', error)
      setIsAnalyzingPronunciation(false)
      alert('Microphone access denied. Please allow microphone access to analyze pronunciation.')
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      {onBack && (
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Home</span>
          </button>
          <h2 className="text-lg font-semibold text-gray-900 capitalize">
            {scenario} Conversation
          </h2>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.messageId}
            className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                msg.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              <p className="text-sm">{msg.content}</p>
              
              {/* Language and Cultural Context Info */}
              <div className={`mt-1 flex items-center space-x-2 text-xs ${
                msg.type === 'user' ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {msg.language && (
                  <span className="flex items-center space-x-1">
                    <Globe className="h-3 w-3" />
                    <span>{msg.language.toUpperCase()}</span>
                  </span>
                )}
                {msg.culturalContext && (
                  <span className="text-xs opacity-75">
                    {msg.culturalContext}
                  </span>
                )}
                {msg.detectedLanguage && msg.languageConfidence && (
                  <span className="text-xs opacity-75">
                    Detected: {msg.detectedLanguage} ({Math.round(msg.languageConfidence * 100)}%)
                  </span>
                )}
              </div>
              
              {/* AI message audio controls */}
              {msg.type === 'ai' && (
                <div className="mt-2 flex items-center space-x-2">
                  <button
                    onClick={() => playAudio(msg.content)}
                    disabled={isPlaying}
                    className={`p-1 rounded-full ${
                      isPlaying
                        ? 'bg-gray-400 text-gray-600'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    } transition-colors duration-200`}
                    title="Play audio"
                  >
                    {isPlaying ? (
                      <VolumeX className="h-3 w-3" />
                    ) : (
                      <Volume2 className="h-3 w-3" />
                    )}
                  </button>
                  <span className="text-xs text-gray-500">Listen</span>
                  
                  <button
                    onClick={() => analyzePronunciation(msg.content)}
                    disabled={isAnalyzingPronunciation}
                    className={`p-1 rounded-full ${
                      isAnalyzingPronunciation
                        ? 'bg-gray-400 text-gray-600'
                        : 'bg-green-500 text-white hover:bg-green-600'
                    } transition-colors duration-200`}
                    title="Practice pronunciation"
                  >
                    <Mic className="h-3 w-3" />
                  </button>
                  <span className="text-xs text-gray-500">Practice</span>
                </div>
              )}
              
              {/* Grammar and pronunciation tips */}
              {msg.metadata?.grammarSuggestions && msg.metadata.grammarSuggestions.length > 0 && (
                <div className="mt-2 p-2 bg-yellow-100 rounded text-xs">
                  <strong>Grammar Tip:</strong> {msg.metadata.grammarSuggestions[0]}
                </div>
              )}
              {msg.metadata?.pronunciationTips && msg.metadata.pronunciationTips.length > 0 && (
                <div className="mt-2 p-2 bg-green-100 rounded text-xs">
                  <strong>Pronunciation:</strong> {msg.metadata.pronunciationTips[0]}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg">
              <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
              AI is thinking...
            </div>
          </div>
        )}
        
        {isAnalyzingPronunciation && (
          <div className="flex justify-start">
            <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg">
              <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
              Analyzing pronunciation... Speak now!
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Pronunciation Feedback */}
      {pronunciationFeedback && (
        <div className="border-t border-gray-200 p-4 bg-green-50">
          <h3 className="text-sm font-semibold text-green-800 mb-2">Pronunciation Analysis</h3>
          <div className="space-y-2">
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <span className="font-medium">Overall Score: </span>
                <span className={`font-bold ${
                  pronunciationFeedback.overallScore >= 80 ? 'text-green-600' :
                  pronunciationFeedback.overallScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {pronunciationFeedback.overallScore}%
                </span>
              </div>
              <div className="text-sm">
                <span className="font-medium">Fluency: </span>
                <span className="text-blue-600">{pronunciationFeedback.fluencyScore}%</span>
              </div>
              <div className="text-sm">
                <span className="font-medium">Clarity: </span>
                <span className="text-purple-600">{pronunciationFeedback.clarityScore}%</span>
              </div>
            </div>
            
            {pronunciationFeedback.improvements && pronunciationFeedback.improvements.length > 0 && (
              <div className="mt-2">
                <h4 className="text-xs font-semibold text-gray-700 mb-1">Suggestions:</h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  {pronunciationFeedback.improvements.map((improvement: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-500 mr-1">•</span>
                      {improvement}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <button
              onClick={() => setPronunciationFeedback(null)}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Close feedback
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4">
        {/* Language Detection Indicator */}
        {message && (
          <div className="mb-2">
            <LanguageIndicator
              text={message}
              onLanguageDetected={handleLanguageDetected}
              className="text-sm"
            />
          </div>
        )}
        
        <div className="flex items-center space-x-2">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isLoading}
            className={`p-2 rounded-full transition-colors duration-200 ${
              isRecording
                ? 'bg-red-100 text-red-600 hover:bg-red-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={isRecording ? 'Stop recording' : 'Start voice input'}
          >
            {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>

          <div className="flex-1 relative">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={translate('conversation.inputPlaceholder', 'Type your message here...')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={1}
              disabled={isLoading}
            />
          </div>

          <button
            onClick={handleSendMessage}
            disabled={!message.trim() || isLoading}
            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <Send className="h-5 w-5" />
          </button>

          <button
            onClick={() => playAudio(message)}
            disabled={isPlaying || !message.trim()}
            className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            title="Play current message"
          >
            {isPlaying ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConversationInterface