import React, { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Play, Pause, RotateCcw, CheckCircle, Loader2 } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { apiService } from '../services/api'

interface SpeakingModeProps {
  onBack: () => void
}

interface PronunciationFeedback {
  overallScore: number
  wordScores: Array<{
    word: string
    score: number
    phonemes: string[]
    suggestions: string[]
  }>
  fluencyScore: number
  paceScore: number
  clarityScore: number
  improvements: string[]
}

interface SpeechScenario {
  id: string
  title: string
  description: string
  prompt: string
  expectedPhrases: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  category: string
}

const SpeakingMode: React.FC<SpeakingModeProps> = ({ onBack }) => {
  const { currentLanguage } = useLanguage()
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [transcription, setTranscription] = useState('')
  const [feedback, setFeedback] = useState<PronunciationFeedback | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [currentScenario, setCurrentScenario] = useState<SpeechScenario | null>(null)
  const [isLoadingScenario, setIsLoadingScenario] = useState(false)
  const [showScenario, setShowScenario] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<number | null>(null)

  const scenarios: SpeechScenario[] = [
    {
      id: '1',
      title: 'Job Interview',
      description: 'Practice answering common interview questions',
      prompt: 'Tell me about yourself and why you want this job.',
      expectedPhrases: ['experience', 'skills', 'passion', 'contribution'],
      difficulty: 'intermediate',
      category: 'Professional'
    },
    {
      id: '2',
      title: 'Restaurant Order',
      description: 'Practice ordering food at a restaurant',
      prompt: 'Order a meal and ask about the menu.',
      expectedPhrases: ['appetizer', 'main course', 'dessert', 'recommendation'],
      difficulty: 'beginner',
      category: 'Daily Life'
    },
    {
      id: '3',
      title: 'Travel Directions',
      description: 'Ask for and give directions while traveling',
      prompt: 'Ask for directions to the nearest train station.',
      expectedPhrases: ['straight ahead', 'turn left', 'on the right', 'next to'],
      difficulty: 'intermediate',
      category: 'Travel'
    },
    {
      id: '4',
      title: 'Business Presentation',
      description: 'Present a business idea or project',
      prompt: 'Present your business proposal to potential investors.',
      expectedPhrases: ['market analysis', 'revenue projection', 'competitive advantage', 'ROI'],
      difficulty: 'advanced',
      category: 'Professional'
    }
  ]

  useEffect(() => {
    // Initialize audio context
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio()
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder

      const audioChunks: Blob[] = []
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' })
        setAudioBlob(audioBlob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

    } catch (error) {
      console.error('Error accessing microphone:', error)
      alert('Please allow microphone access to use this feature.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }

  const playRecording = () => {
    if (audioBlob && audioRef.current) {
      const audioUrl = URL.createObjectURL(audioBlob)
      audioRef.current.src = audioUrl
      audioRef.current.play()
      setIsPlaying(true)

      audioRef.current.onended = () => {
        setIsPlaying(false)
        URL.revokeObjectURL(audioUrl)
      }
    }
  }

  const analyzeSpeech = async () => {
    if (!audioBlob || !currentScenario) return

    setIsAnalyzing(true)
    try {
      // Convert blob to base64 for API
      const reader = new FileReader()
      reader.onload = async () => {
        const base64Audio = (reader.result as string).split(',')[1]
        
        try {
          const response = await apiService.analyzePronunciation({
            audioData: base64Audio,
            text: currentScenario.prompt,
            language: currentLanguage.code
          })

          if (response.data.success) {
            setFeedback(response.data.data)
            setTranscription(response.data.data.transcription || '')
          }
        } catch (error) {
          console.error('Error analyzing speech:', error)
          setFeedback({
            overallScore: 0,
            wordScores: [],
            fluencyScore: 0,
            paceScore: 0,
            clarityScore: 0,
            improvements: ['Unable to analyze speech. Please check your connection and try again.']
          })
          setTranscription('Unable to transcribe audio. Please try again.')
        }
      }
      reader.readAsDataURL(audioBlob)
    } catch (error) {
      console.error('Error processing audio:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const loadScenario = async (scenario: SpeechScenario) => {
    setIsLoadingScenario(true)
    setCurrentScenario(scenario)
    setShowScenario(true)
    setTranscription('')
    setFeedback(null)
    setAudioBlob(null)
    setRecordingTime(0)
    
    // Simulate loading time
    setTimeout(() => {
      setIsLoadingScenario(false)
    }, 1000)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-50 border-green-200'
    if (score >= 60) return 'bg-yellow-50 border-yellow-200'
    return 'bg-red-50 border-red-200'
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Voice Mastry Hub</h1>
          <p className="text-sm text-gray-500">Voice practice with pronunciation feedback</p>
        </div>
        <button
          onClick={onBack}
          className="btn-secondary"
        >
          Back to Home
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Side - Scenario Selection & Recording */}
        <div className="space-y-6">
          {/* Scenario Selection */}
          {!showScenario && (
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Choose a Practice Scenario</h2>
              <div className="grid grid-cols-1 gap-3">
                {scenarios.map((scenario) => (
                  <button
                    key={scenario.id}
                    onClick={() => loadScenario(scenario)}
                    className="p-4 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{scenario.title}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        scenario.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                        scenario.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {scenario.difficulty}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{scenario.description}</p>
                    <p className="text-xs text-gray-500">{scenario.category}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Current Scenario */}
          {showScenario && currentScenario && (
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">{currentScenario.title}</h2>
                <button
                  onClick={() => setShowScenario(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
              
              <div className="mb-4">
                <h3 className="font-medium text-gray-900 mb-2">Practice Prompt:</h3>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                  "{currentScenario.prompt}"
                </p>
              </div>

              <div className="mb-4">
                <h3 className="font-medium text-gray-900 mb-2">Expected Phrases:</h3>
                <div className="flex flex-wrap gap-2">
                  {currentScenario.expectedPhrases.map((phrase, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                    >
                      {phrase}
                    </span>
                  ))}
                </div>
              </div>

              {/* Recording Controls */}
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-4">
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isLoadingScenario}
                    className={`p-4 rounded-full ${
                      isRecording
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isRecording ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                  </button>

                  {audioBlob && (
                    <button
                      onClick={playRecording}
                      disabled={isPlaying}
                      className="p-4 rounded-full bg-green-500 hover:bg-green-600 text-white disabled:opacity-50"
                    >
                      {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                    </button>
                  )}
                </div>

                {/* Recording Timer */}
                {isRecording && (
                  <div className="text-center">
                    <div className="text-2xl font-mono text-red-600">
                      {formatTime(recordingTime)}
                    </div>
                    <div className="text-sm text-gray-600">Recording...</div>
                  </div>
                )}

                {/* Analyze Button */}
                {audioBlob && !feedback && (
                  <div className="text-center">
                    <button
                      onClick={analyzeSpeech}
                      disabled={isAnalyzing}
                      className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Analyzing...
                        </>
                      ) : (
                        'Analyze My Speech'
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Side - Results & Feedback */}
        <div className="space-y-6">
          {/* Transcription */}
          {transcription && (
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">Transcription</h3>
              <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                "{transcription}"
              </p>
            </div>
          )}

          {/* Pronunciation Feedback */}
          {feedback && (
            <div className="space-y-4">
              {/* Overall Score */}
              <div className={`p-6 rounded-lg border ${getScoreBgColor(feedback.overallScore)}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Overall Pronunciation Score</h3>
                  <span className={`text-3xl font-bold ${getScoreColor(feedback.overallScore)}`}>
                    {feedback.overallScore}/100
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-500 ${
                      feedback.overallScore >= 80 ? 'bg-green-500' :
                      feedback.overallScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${feedback.overallScore}%` }}
                  ></div>
                </div>
              </div>

              {/* Detailed Scores */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                  <h4 className="font-medium text-gray-900 mb-1">Fluency</h4>
                  <p className={`text-2xl font-bold ${getScoreColor(feedback.fluencyScore)}`}>
                    {feedback.fluencyScore}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                  <h4 className="font-medium text-gray-900 mb-1">Pace</h4>
                  <p className={`text-2xl font-bold ${getScoreColor(feedback.paceScore)}`}>
                    {feedback.paceScore}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                  <h4 className="font-medium text-gray-900 mb-1">Clarity</h4>
                  <p className={`text-2xl font-bold ${getScoreColor(feedback.clarityScore)}`}>
                    {feedback.clarityScore}
                  </p>
                </div>
              </div>

              {/* Word-by-word Analysis */}
              {feedback.wordScores && feedback.wordScores.length > 0 && (
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-4">Word Analysis</h3>
                  <div className="space-y-3">
                    {feedback.wordScores.map((word, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">{word.word}</span>
                          <span className={`font-bold ${getScoreColor(word.score)}`}>
                            {word.score}/100
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          Phonemes: {word.phonemes.join(' - ')}
                        </div>
                        {word.suggestions && word.suggestions.length > 0 && (
                          <div className="text-sm">
                            <span className="font-medium text-gray-700">Suggestions:</span>
                            <ul className="mt-1 space-y-1">
                              {word.suggestions.map((suggestion, suggestionIndex) => (
                                <li key={suggestionIndex} className="text-gray-600">
                                  • {suggestion}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Improvement Suggestions */}
              {feedback.improvements && feedback.improvements.length > 0 && (
                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-3">Improvement Suggestions</h3>
                  <ul className="space-y-2">
                    {feedback.improvements.map((improvement, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span className="text-blue-800">{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Try Again Button */}
              <div className="text-center">
                <button
                  onClick={() => {
                    setAudioBlob(null)
                    setTranscription('')
                    setFeedback(null)
                    setRecordingTime(0)
                  }}
                  className="btn-secondary"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SpeakingMode
