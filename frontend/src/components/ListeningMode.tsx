import React, { useState, useRef } from 'react'
import { Play, Pause, RotateCcw, Volume2, VolumeX, Loader2, CheckCircle } from 'lucide-react'

interface ListeningModeProps {
  onBack: () => void
}

interface AudioContent {
  id: string
  title: string
  description: string
  audioUrl: string
  transcript: string
  questions: Array<{
    question: string
    options: string[]
    correctAnswer: string
    explanation: string
  }>
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

const ListeningMode: React.FC<ListeningModeProps> = ({ onBack }) => {
  const [currentContent, setCurrentContent] = useState<AudioContent | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showTranscript, setShowTranscript] = useState(false)
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: string }>({})
  const [showResults, setShowResults] = useState(false)
  const [isLoadingContent, setIsLoadingContent] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const listeningContents: AudioContent[] = [
    {
      id: '1',
      title: 'Daily Conversations',
      description: 'Practice listening to everyday conversations',
      audioUrl: '/api/placeholder-audio-1', // Placeholder
      transcript: 'Hello, how are you today? I hope you\'re doing well. The weather is quite nice today, isn\'t it?',
      questions: [
        {
          question: 'What is the speaker asking about?',
          options: ['The weather', 'How you are', 'The time', 'The food'],
          correctAnswer: 'How you are',
          explanation: 'The speaker asks "how are you today?" which is asking about your well-being.'
        },
        {
          question: 'What does the speaker think about the weather?',
          options: ['It\'s bad', 'It\'s nice', 'It\'s cold', 'It\'s hot'],
          correctAnswer: 'It\'s nice',
          explanation: 'The speaker says "The weather is quite nice today" indicating they think it\'s pleasant.'
        }
      ],
      difficulty: 'beginner'
    },
    {
      id: '2',
      title: 'Business Meeting',
      description: 'Listen to professional business discussions',
      audioUrl: '/api/placeholder-audio-2',
      transcript: 'Good morning everyone. Let\'s start today\'s meeting by reviewing our quarterly results. We\'ve seen a 15% increase in sales compared to last quarter.',
      questions: [
        {
          question: 'What is the main topic of the meeting?',
          options: ['New products', 'Quarterly results', 'Employee benefits', 'Office renovation'],
          correctAnswer: 'Quarterly results',
          explanation: 'The speaker mentions "reviewing our quarterly results" as the main agenda item.'
        },
        {
          question: 'What was the sales increase?',
          options: ['10%', '15%', '20%', '25%'],
          correctAnswer: '15%',
          explanation: 'The speaker specifically states "a 15% increase in sales".'
        }
      ],
      difficulty: 'intermediate'
    },
    {
      id: '3',
      title: 'Academic Lecture',
      description: 'Advanced listening with academic content',
      audioUrl: '/api/placeholder-audio-3',
      transcript: 'Today we\'ll be discussing the impact of climate change on global ecosystems. Recent studies have shown that rising temperatures are causing significant shifts in migration patterns of various species.',
      questions: [
        {
          question: 'What is the main subject of the lecture?',
          options: ['Migration patterns', 'Climate change impact', 'Temperature studies', 'Global ecosystems'],
          correctAnswer: 'Climate change impact',
          explanation: 'The speaker introduces the topic as "the impact of climate change on global ecosystems".'
        },
        {
          question: 'What are rising temperatures affecting?',
          options: ['Migration patterns', 'Species extinction', 'Ocean levels', 'Weather patterns'],
          correctAnswer: 'Migration patterns',
          explanation: 'The speaker mentions that rising temperatures are "causing significant shifts in migration patterns".'
        }
      ],
      difficulty: 'advanced'
    }
  ]

  const loadContent = async (contentId: string) => {
    setIsLoadingContent(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      const content = listeningContents.find(c => c.id === contentId)
      if (content) {
        setCurrentContent(content)
        setSelectedAnswers({})
        setShowResults(false)
        setShowTranscript(false)
      }
    } catch (error) {
      console.error('Error loading content:', error)
    } finally {
      setIsLoadingContent(false)
    }
  }

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleAnswerSelect = (questionIndex: number, answer: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }))
  }

  const submitAnswers = () => {
    setShowResults(true)
  }

  const resetSession = () => {
    setCurrentContent(null)
    setSelectedAnswers({})
    setShowResults(false)
    setShowTranscript(false)
    setIsPlaying(false)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800'
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800'
      case 'advanced':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoadingContent) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
        <p className="text-lg text-gray-700">Loading listening content...</p>
      </div>
    )
  }

  if (!currentContent) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Listening Practice</h2>
            <p className="text-sm text-gray-500">Improve your listening skills with audio content and comprehension questions.</p>
          </div>
          <button onClick={onBack} className="btn-secondary">
            Back to Home
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Choose a Listening Exercise:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {listeningContents.map((content) => (
              <button
                key={content.id}
                onClick={() => loadContent(content.id)}
                className="flex flex-col items-start p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 ease-in-out transform hover:-translate-y-1"
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <h4 className="text-lg font-medium text-gray-900">{content.title}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(content.difficulty)}`}>
                    {content.difficulty}
                  </span>
                </div>
                <p className="text-sm text-gray-600 text-left mb-3">{content.description}</p>
                <div className="flex items-center text-sm text-gray-500">
                  <Volume2 className="h-4 w-4 mr-1" />
                  {content.questions.length} questions
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Listening Practice</h2>
          <p className="text-sm text-gray-500">Improve your listening skills with audio content and comprehension questions.</p>
        </div>
        <div className="flex space-x-2">
          <button onClick={onBack} className="btn-secondary">
            Back to Home
          </button>
          <button onClick={resetSession} className="btn-secondary btn-sm">
            <RotateCcw className="h-4 w-4 mr-2" />
            Change Exercise
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-white p-6 rounded-lg shadow-md overflow-y-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-semibold text-gray-900">{currentContent.title}</h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(currentContent.difficulty)}`}>
              {currentContent.difficulty}
            </span>
          </div>
          <p className="text-gray-700 mb-4">{currentContent.description}</p>

          {/* Audio Player */}
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={togglePlayPause}
                className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors duration-200"
              >
                {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
              </button>
              <div className="flex-1">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '0%' }}></div>
                </div>
                <p className="text-sm text-gray-600 mt-1">Click play to start listening</p>
              </div>
              <button
                onClick={() => setShowTranscript(!showTranscript)}
                className="p-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors duration-200"
              >
                {showTranscript ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                <span className="text-xs ml-1">{showTranscript ? 'Hide' : 'Show'} Transcript</span>
              </button>
            </div>
          </div>

          {/* Transcript */}
          {showTranscript && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2">Transcript:</h4>
              <p className="text-blue-700">{currentContent.transcript}</p>
            </div>
          )}
        </div>

        {/* Questions */}
        {!showResults ? (
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-gray-900">Comprehension Questions:</h4>
            {currentContent.questions.map((question, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                <p className="font-medium text-gray-800 mb-3">
                  {index + 1}. {question.question}
                </p>
                <div className="space-y-2">
                  {question.options.map((option, optionIndex) => (
                    <button
                      key={optionIndex}
                      onClick={() => handleAnswerSelect(index, option)}
                      className={`w-full text-left p-3 rounded-md border transition-colors duration-150 ${
                        selectedAnswers[index] === option
                          ? 'bg-blue-100 border-blue-400 text-blue-800'
                          : 'bg-white border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <button
              onClick={submitAnswers}
              className="btn-primary w-full"
              disabled={Object.keys(selectedAnswers).length !== currentContent.questions.length}
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              Submit Answers
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-gray-900">Results:</h4>
            {currentContent.questions.map((question, index) => {
              const selectedAnswer = selectedAnswers[index]
              const isCorrect = selectedAnswer === question.correctAnswer
              return (
                <div key={index} className={`p-4 rounded-lg border ${
                  isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-gray-800">Question {index + 1}</p>
                    {isCorrect ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <div className="h-5 w-5 rounded-full bg-red-600 flex items-center justify-center">
                        <span className="text-white text-xs">✕</span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{question.question}</p>
                  <p className="text-sm mb-1">
                    <span className="font-medium">Your answer:</span> {selectedAnswer}
                  </p>
                  <p className="text-sm mb-1">
                    <span className="font-medium">Correct answer:</span> {question.correctAnswer}
                  </p>
                  <p className="text-sm text-gray-600">{question.explanation}</p>
                </div>
              )
            })}

            <div className="flex space-x-4">
              <button onClick={resetSession} className="btn-primary flex-1">
                Try Another Exercise
              </button>
              <button onClick={() => setShowResults(false)} className="btn-secondary flex-1">
                Review Answers
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}

export default ListeningMode
