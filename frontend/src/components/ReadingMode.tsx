import React, { useState, useEffect } from 'react'
import { BookOpen, XCircle, Loader2, RefreshCw } from 'lucide-react'
import { apiService } from '../services/api'
import { useLanguage } from '../contexts/LanguageContext'

interface ReadingModeProps {
  onBack: () => void
}

interface ReadingContent {
  id: string
  title: string
  content: string
  level: string
  wordCount: number
  estimatedTime: number
  vocabulary?: Array<{
    word: string
    definition: string
    example: string
  }>
  summary: string
  keyPoints?: string[]
}

interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
}

interface ReadingSession {
  content: ReadingContent
  quiz?: QuizQuestion[]
  flashcards?: Array<{
    id: string
    front: string
    back: string
    difficulty: 'easy' | 'medium' | 'hard'
  }>
  userAnswers: { [questionId: string]: number }
  score: number | null
  completed: boolean
}

const ReadingMode: React.FC<ReadingModeProps> = ({ onBack }) => {
  const { currentLanguage } = useLanguage()
  const [session, setSession] = useState<ReadingSession | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateReadingContent = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await apiService.generateReadingContent({
        level: 'intermediate',
        topic: 'general',
        language: currentLanguage.code
      })
      if (response.data.success) {
        const sessionData = response.data.data
        // Ensure userAnswers is always initialized
        if (!sessionData.userAnswers) {
          sessionData.userAnswers = {}
        }
        setSession(sessionData)
      } else {
        setError('Failed to generate reading content. Please try again.')
      }
    } catch (error) {
      console.error('Error generating reading content:', error)
      setError('Unable to connect to the server. Please check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnswerSelect = (questionId: string, answerIndex: number) => {
    if (!session) return
    setSession({
      ...session,
      userAnswers: {
        ...(session.userAnswers || {}),
        [questionId]: answerIndex
      }
    })
  }

  const submitQuiz = () => {
    if (!session || !session.quiz) return
    
    let correctAnswers = 0
    const totalQuestions = session.quiz.length
    
    session.quiz.forEach(question => {
      const userAnswer = session.userAnswers?.[question.id]
      if (userAnswer === question.correctAnswer) {
        correctAnswers++
      }
    })
    
    const score = Math.round((correctAnswers / totalQuestions) * 100)
    
    setSession({
      ...session,
      score,
      completed: true
    })
  }

  useEffect(() => {
    generateReadingContent()
  }, [currentLanguage.code])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
        <p className="text-lg text-gray-700">Generating your reading session...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Content</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-x-4">
            <button onClick={() => generateReadingContent()} className="btn-primary">
              <RefreshCw className="h-5 w-5 mr-2" />
              Try Again
            </button>
            <button onClick={onBack} className="btn-secondary">
              Back to Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-center">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reading Content</h3>
          <p className="text-gray-600 mb-4">Unable to load reading content at this time.</p>
          <button onClick={onBack} className="btn-secondary">
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reading Practice</h2>
          <p className="text-gray-600">Improve your reading comprehension with AI-generated content.</p>
        </div>
        <button onClick={onBack} className="btn-secondary">
          Back to Home
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6">
        {/* Content */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900">{session.content.title}</h3>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>{session.content.wordCount} words</span>
              <span>{session.content.estimatedTime} min read</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                {session.content.level}
              </span>
            </div>
          </div>
          
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {session.content.content}
            </p>
          </div>

          {/* Summary */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Summary</h4>
            <p className="text-blue-800">{session.content.summary}</p>
          </div>

          {/* Key Points */}
          {session.content.keyPoints && session.content.keyPoints.length > 0 && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-2">Key Points</h4>
              <ul className="list-disc list-inside text-green-800 space-y-1">
                {session.content.keyPoints.map((point, index) => (
                  <li key={`keypoint-${index}-${point.substring(0, 10)}`}>{point}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Vocabulary */}
          {session.content.vocabulary && session.content.vocabulary.length > 0 && (
            <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-semibold text-yellow-900 mb-2">Vocabulary</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {session.content.vocabulary.map((vocab, index) => (
                  <div key={`vocab-${index}-${vocab.word}`} className="border-l-4 border-yellow-400 pl-3">
                    <p className="font-medium text-yellow-900">{vocab.word}</p>
                    <p className="text-sm text-yellow-800">{vocab.definition}</p>
                    <p className="text-xs text-yellow-700 italic">Example: {vocab.example}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quiz */}
        {session.quiz && session.quiz.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Comprehension Quiz</h3>
            <div className="space-y-6">
              {session.quiz.map((question, index) => (
                <div key={question.id || `question-${index}`} className="border border-gray-200 rounded-lg p-4">
                  <p className="font-medium text-gray-800 mb-3">
                    {index + 1}. {question.question}
                  </p>
                  <div className="space-y-2">
                    {question.options.map((option, optionIndex) => (
                      <button
                        key={`${question.id}-option-${optionIndex}`}
                        onClick={() => handleAnswerSelect(question.id, optionIndex)}
                        disabled={session.completed}
                        className={`w-full text-left p-3 rounded-md border transition-colors duration-150 ${
                          (session.userAnswers && session.userAnswers[question.id]) === optionIndex
                            ? 'bg-blue-100 border-blue-400 text-blue-800'
                            : 'bg-white border-gray-300 hover:bg-gray-50'
                        } ${session.completed ? 'opacity-70 cursor-not-allowed' : ''}`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                  {session.completed && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Explanation:</span> {question.explanation}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {!session.completed && (
              <button onClick={submitQuiz} className="btn-primary mt-6 w-full">
                Submit Quiz
              </button>
            )}

            {session.completed && session.score !== null && (
              <div className="mt-6 p-4 bg-green-50 rounded-lg text-center">
                <h4 className="text-lg font-semibold text-green-900 mb-2">Quiz Complete!</h4>
                <p className="text-2xl font-bold text-green-600 mb-2">Score: {session.score}%</p>
                <p className="text-green-800">
                  {session.score >= 80 ? 'Excellent work!' : 
                   session.score >= 60 ? 'Good job!' : 
                   'Keep practicing!'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Flashcards */}
        {session.flashcards && session.flashcards.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Vocabulary Flashcards</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {session.flashcards.map((card) => (
                <div key={card.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="text-center">
                    <p className="font-medium text-gray-900 mb-2">{card.front}</p>
                    <p className="text-sm text-gray-600">{card.back}</p>
                    <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs ${
                      card.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                      card.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {card.difficulty}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ReadingMode