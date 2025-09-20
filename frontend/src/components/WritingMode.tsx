import React, { useState, useRef } from 'react'
import { Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'

interface WritingModeProps {
  onBack: () => void
}

interface GrammarSuggestion {
  text: string
  suggestion: string
  explanation: string
  severity: 'error' | 'warning' | 'info'
}

interface WritingAnalysis {
  grammarSuggestions: GrammarSuggestion[]
  overallScore: number
  wordCount: number
  readabilityScore: number
  vocabularyLevel: string
  improvements: string[]
}

const WritingMode: React.FC<WritingModeProps> = ({ onBack }) => {
  const { currentLanguage } = useLanguage()
  const [text, setText] = useState('')
  const [analysis, setAnalysis] = useState<WritingAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleAnalyzeText = async () => {
    if (!text.trim() || isAnalyzing) return

    setIsAnalyzing(true)
    
    try {
      const response = await apiService.analyzeWriting({
        text: text.trim(),
        language: currentLanguage.code
      })
      
      if (response.data.success) {
        setAnalysis(response.data.data)
      } else {
        console.error('Failed to analyze writing:', response.data.error)
        setAnalysis({
          grammarSuggestions: [],
          overallScore: 0,
          wordCount: text.trim().split(/\s+/).length,
          readabilityScore: 0,
          vocabularyLevel: 'Unknown',
          improvements: ['Unable to analyze text. Please try again.']
        })
      }
    } catch (error) {
      console.error('Error analyzing text:', error)
      setAnalysis({
        grammarSuggestions: [],
        overallScore: 0,
        wordCount: text.trim().split(/\s+/).length,
        readabilityScore: 0,
        vocabularyLevel: 'Unknown',
        improvements: ['Unable to connect to the server. Please check your connection and try again.']
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleTextSelection = () => {
    // Text selection handling can be implemented here if needed
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'info':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <AlertCircle className="h-4 w-4" />
      case 'warning':
        return <AlertCircle className="h-4 w-4" />
      case 'info':
        return <CheckCircle className="h-4 w-4" />
      default:
        return <CheckCircle className="h-4 w-4" />
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Writing Practice</h1>
          <p className="text-sm text-gray-500">Improve your grammar and writing skills</p>
        </div>
        <button
          onClick={onBack}
          className="btn-secondary"
        >
          Back to Home
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Writing Area */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Write Your Text</h2>
            <div className="flex space-x-2">
              <button
                onClick={handleAnalyzeText}
                disabled={!text.trim() || isAnalyzing}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Analyze Text
                  </>
                )}
              </button>
            </div>
          </div>

          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onSelect={handleTextSelection}
            placeholder="Start writing your text here... The AI will analyze your grammar, vocabulary, and writing style."
            className="flex-1 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={15}
          />

          {/* Text Statistics */}
          <div className="mt-4 flex space-x-4 text-sm text-gray-600">
            <span>Words: {text.trim().split(/\s+/).filter(word => word.length > 0).length}</span>
            <span>Characters: {text.length}</span>
            <span>Lines: {text.split('\n').length}</span>
          </div>
        </div>

        {/* Analysis Results */}
        <div className="flex flex-col">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Analysis Results</h2>
          
          {!analysis ? (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Write some text and click "Analyze Text" to get feedback</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 space-y-4 overflow-y-auto">
              {/* Overall Score */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">Overall Score</h3>
                  <span className="text-2xl font-bold text-blue-600">{analysis.overallScore}/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${analysis.overallScore}%` }}
                  ></div>
                </div>
              </div>

              {/* Writing Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-1">Readability</h4>
                  <p className="text-2xl font-bold text-green-600">{analysis.readabilityScore}/100</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-1">Vocabulary Level</h4>
                  <p className="text-lg font-semibold text-purple-600">{analysis.vocabularyLevel}</p>
                </div>
              </div>

              {/* Grammar Suggestions */}
              {analysis.grammarSuggestions && analysis.grammarSuggestions.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Grammar Suggestions</h3>
                  <div className="space-y-3">
                    {analysis.grammarSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border ${getSeverityColor(suggestion.severity)}`}
                      >
                        <div className="flex items-start space-x-2">
                          {getSeverityIcon(suggestion.severity)}
                          <div className="flex-1">
                            <p className="font-medium">{suggestion.text}</p>
                            <p className="text-sm mt-1">
                              <span className="font-medium">Suggestion:</span> {suggestion.suggestion}
                            </p>
                            <p className="text-sm mt-1">{suggestion.explanation}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Improvement Suggestions */}
              {analysis.improvements && analysis.improvements.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Improvement Suggestions</h3>
                  <ul className="space-y-2">
                    {analysis.improvements.map((improvement, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default WritingMode
