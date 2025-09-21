import React, { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { 
  Mic, 
  MicOff, 
  Volume2, 
  BookOpen, 
  PenTool, 
  Headphones, 
  MessageCircle,
  Pause,
  RotateCcw,
  CheckCircle,
  Loader2,
  Sparkles,
  TrendingUp
} from 'lucide-react'
import { apiService } from '../services/api'
import { useLanguage } from '../contexts/LanguageContext'

interface AITutorRoomProps {
  onBack: () => void
}

interface LearningCard {
  id: string
  type: 'speaking' | 'reading' | 'writing' | 'listening'
  title: string
  description: string
  content?: string
  prompt?: string
  isActive: boolean
  progress?: number
  speakingPrompt?: string
  expectedPhrases?: string[]
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
}

interface AIResponse {
  text: string
  confidence: number
  sentiment: string
  suggestedCards?: LearningCard[]
  currentMode?: 'speaking' | 'reading' | 'writing' | 'listening'
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
  overall?: number
  fluency?: number
  clarity?: number
  strengths: string[]
}

interface ReadingPassage {
  id: string
  title: string
  content: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  vocabulary: Array<{
    word: string
    definition: string
    context: string
    pronunciation?: string
  }>
  comprehensionQuestions: Array<{
    question: string
    options: string[]
    correctAnswer: number
    explanation: string
  }>
  readingTime: number // in minutes
}

interface WritingExercise {
  id: string
  title: string
  prompt: string
  type: 'email' | 'essay' | 'story' | 'letter' | 'report'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  wordLimit?: number
  timeLimit?: number // in minutes
  requirements: string[]
}

interface WritingFeedback {
  overallScore: number
  grammarScore: number
  vocabularyScore: number
  structureScore: number
  styleScore: number
  suggestions: Array<{
    type: 'grammar' | 'vocabulary' | 'structure' | 'style'
    message: string
    position?: number
    suggestion?: string
  }>
  strengths: string[]
  improvements: string[]
}

const AITutorRoom: React.FC<AITutorRoomProps> = ({ onBack }) => {
  const { translate } = useLanguage()
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [currentMode, setCurrentMode] = useState<'speaking' | 'reading' | 'writing' | 'listening' | 'flashcards' | 'quiz' | 'qa' | null>(null)
  const [learningCards, setLearningCards] = useState<LearningCard[]>([])
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null)
  const [conversationHistory, setConversationHistory] = useState<Array<{type: 'user' | 'ai', content: string, timestamp: Date}>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [pronunciationFeedback, setPronunciationFeedback] = useState<PronunciationFeedback | null>(null)
  const [currentSpeakingPrompt, setCurrentSpeakingPrompt] = useState<string>('')
  const [speakingChallenges] = useState<Array<{id: string, title: string, prompt: string, difficulty: 'easy' | 'medium' | 'hard', category: string}>>([
    { id: '1', title: 'Self Introduction', prompt: 'Hello! Please introduce yourself and tell me about your hobbies.', difficulty: 'easy', category: 'Personal' },
    { id: '2', title: 'Daily Routine', prompt: 'Describe your typical day from morning to evening.', difficulty: 'easy', category: 'Daily Life' },
    { id: '3', title: 'Travel Story', prompt: 'Tell me about your most memorable travel experience.', difficulty: 'medium', category: 'Travel' },
    { id: '4', title: 'Future Goals', prompt: 'What are your career goals and how do you plan to achieve them?', difficulty: 'medium', category: 'Career' },
    { id: '5', title: 'Environmental Issues', prompt: 'Discuss the most important environmental challenge facing our world today.', difficulty: 'hard', category: 'Society' },
    { id: '6', title: 'Technology Impact', prompt: 'How has technology changed the way we communicate and work?', difficulty: 'hard', category: 'Technology' }
  ])

  // Function to get translated speaking challenges
  const getTranslatedSpeakingChallenges = () => {
    return speakingChallenges.map(challenge => ({
      ...challenge,
      title: translate(`aiTutorRoom.speakingChallenges.${challenge.id === '1' ? 'selfIntroduction' : 
                                                          challenge.id === '2' ? 'dailyRoutine' :
                                                          challenge.id === '3' ? 'travelStory' :
                                                          challenge.id === '4' ? 'futureGoals' :
                                                          challenge.id === '5' ? 'environmentalIssues' :
                                                          'technologyImpact'}`, challenge.title),
      prompt: translate(`aiTutorRoom.speakingChallenges.${challenge.id === '1' ? 'selfIntroductionPrompt' : 
                                                           challenge.id === '2' ? 'dailyRoutinePrompt' :
                                                           challenge.id === '3' ? 'travelStoryPrompt' :
                                                           challenge.id === '4' ? 'futureGoalsPrompt' :
                                                           challenge.id === '5' ? 'environmentalIssuesPrompt' :
                                                           'technologyImpactPrompt'}`, challenge.prompt),
      difficulty: translate(`aiTutorRoom.difficultyLabels.${challenge.difficulty}`, challenge.difficulty),
      category: translate(`aiTutorRoom.categories.${challenge.category.toLowerCase().replace(' ', '')}`, challenge.category)
    }))
  }
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [currentChallenge, setCurrentChallenge] = useState<any>(null)
  const [speakingStats, setSpeakingStats] = useState({
    totalRecordings: 0,
    averageScore: 0,
    bestScore: 0,
    challengesCompleted: 0
  })
  const [achievements, setAchievements] = useState<string[]>([])
  const [currentReadingPassage, setCurrentReadingPassage] = useState<ReadingPassage | null>(null)
  const [, setUploadedFile] = useState<File | null>(null)
  const [contentAnalysis, setContentAnalysis] = useState<any>(null)
  const [flashcards, setFlashcards] = useState<any[]>([])
  const [quiz, setQuiz] = useState<any[]>([])
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0)
  const [showFlashcardAnswer, setShowFlashcardAnswer] = useState(false)
  const [quizAnswers, setQuizAnswers] = useState<{[key: number]: string}>({})
  const [quizScore, setQuizScore] = useState<number | null>(null)
  const [showQuizResults, setShowQuizResults] = useState(false)
  const [quizResults, setQuizResults] = useState<any[]>([])
  const [showVocabulary, setShowVocabulary] = useState(false)
  const [readingPrompt, setReadingPrompt] = useState('')
  const [speakingPrompt, setSpeakingPrompt] = useState('')
  const [showComprehension, setShowComprehension] = useState(false)
  const [readingAnswers, setReadingAnswers] = useState<number[]>([])
  const [readingScore, setReadingScore] = useState<number | null>(null)
  const [currentWritingExercise, setCurrentWritingExercise] = useState<WritingExercise | null>(null)
  const [writingText, setWritingText] = useState<string>('')
  const [writingFeedback, setWritingFeedback] = useState<WritingFeedback | null>(null)
  const [, setShowWritingEditor] = useState(false)
  const [currentTranscript, setCurrentTranscript] = useState('')
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Initialize with welcome message and default cards
  useEffect(() => {
    const initializeConversation = async () => {
      try {
        // Start a new conversation
        const response = await apiService.startConversation({
          scenario: 'general',
          language: 'en',
          proficiencyLevel: 'intermediate'
        })
        
        if (response.data.success) {
          setConversationId(response.data.data.conversationId)
          console.log('✅ Conversation started:', response.data.data.conversationId)
        }
      } catch (error) {
        console.error('❌ Failed to start conversation:', error)
        // Continue without conversation ID - will use fallback
      }
    }

    initializeConversation()

    const welcomeMessage = {
      type: 'ai' as const,
      content: translate('aiTutorRoom.aiMessages.welcomeMessage', "Hello! I'm your AI language learning tutor. I'm here to help you practice speaking, reading, writing, and listening. What would you like to work on today?"),
      timestamp: new Date()
    }
    setConversationHistory([welcomeMessage])
    
    // Initialize with enhanced learning cards
    setLearningCards([
      {
        id: 'speaking-1',
        type: 'speaking',
        title: 'Speaking Practice',
        description: 'Practice pronunciation and conversation',
        speakingPrompt: 'Hello! Please introduce yourself and tell me about your hobbies.',
        expectedPhrases: ['Hello', 'My name is', 'I like', 'I enjoy'],
        difficulty: 'beginner',
        isActive: false,
        progress: 0
      },
      {
        id: 'reading-1',
        type: 'reading',
        title: 'Reading Practice',
        description: 'Improve reading comprehension',
        content: 'Read engaging passages and test your understanding',
        difficulty: 'intermediate',
        isActive: false,
        progress: 0
      },
      {
        id: 'writing-1',
        type: 'writing',
        title: 'Writing Practice',
        description: 'Enhance writing skills with grammar and style feedback',
        content: 'Practice different writing styles and get real-time feedback',
        difficulty: 'intermediate',
        isActive: false,
        progress: 0
      },
      {
        id: 'listening-1',
        type: 'listening',
        title: 'Listening Practice',
        description: 'Develop listening skills',
        isActive: false,
        progress: 0
      }
    ])
  }, [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      
      mediaRecorderRef.current = mediaRecorder
      setIsRecording(true)
      setCurrentTranscript('Listening...')
      
      const audioChunks: Blob[] = []
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data)
      }
      
      mediaRecorder.onstop = async () => {
        setIsRecording(false)
        setCurrentTranscript('Processing...')
        
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm;codecs=opus' })
        
        // Check size limit (1MB)
        if (audioBlob.size > 1024 * 1024) {
          alert('Audio file too large. Please record a shorter message.')
          setCurrentTranscript('')
          return
        }
        
        // Convert to base64
        const reader = new FileReader()
        reader.onloadend = async () => {
          const base64Audio = reader.result as string
          // Remove the data:audio/webm;base64, prefix
          const cleanBase64 = base64Audio.split(',')[1] || base64Audio
          await processAudioInput(cleanBase64)
        }
        reader.readAsDataURL(audioBlob)
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorder.start()
    } catch (error) {
      console.error('Error starting recording:', error)
      alert('Could not access microphone. Please check permissions.')
      setIsRecording(false)
      setCurrentTranscript('')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const processAudioInput = async (base64Audio: string) => {
    setIsLoading(true)
    try {
      // Transcribe audio
      const transcriptionResponse = await apiService.transcribeAudio({
        audioData: base64Audio,
        languageCode: 'en-US'
      })
      console.log('Transcription response:', transcriptionResponse.data)
      const transcribedText = transcriptionResponse.data.data.text
      
      // Show the transcript
      setCurrentTranscript(transcribedText)
      
      // Handle based on current mode
      if (currentMode === 'reading') {
        // For reading practice, set the transcription as the reading prompt
        setReadingPrompt(transcribedText)
        // Auto-analyze the content
        await generateReadingFromPrompt()
      } else {
        // For other modes, add user message to conversation
        const userMessage = {
          type: 'user' as const,
          content: transcribedText,
          timestamp: new Date()
        }
        setConversationHistory(prev => [...prev, userMessage])
        
        // If in speaking mode, analyze pronunciation
        if (currentMode === 'speaking' && currentSpeakingPrompt) {
          await analyzePronunciation(base64Audio, transcribedText)
        }
        
        // Process with AI
        await processTextInput(transcribedText)
      }
    } catch (error) {
      console.error('Error processing audio:', error)
      alert('Error processing audio. Please try again.')
      setCurrentTranscript('')
    } finally {
      setIsLoading(false)
    }
  }

  const processTextInput = async (text: string) => {
    setIsLoading(true)
    try {
      // Ensure we have a conversation ID
      if (!conversationId) {
        console.error('❌ No conversation ID available')
        alert('Error: No active conversation. Please refresh the page and try again.')
        setIsLoading(false)
        return
      }

      // Send to conversation API with proper message format
      const response = await apiService.sendMessage({
        conversationId: conversationId,
        message: text
      })
      
      const aiMessage = {
        type: 'ai' as const,
        content: response.data.data.content || response.data.data.text || '',
        timestamp: new Date()
      }
      setConversationHistory(prev => [...prev, aiMessage])
      
      // Update AI response state
      setAiResponse({
        text: response.data.data.content || response.data.data.text || '',
        confidence: response.data.data.metadata?.confidence || 0.8,
        sentiment: response.data.data.metadata?.sentiment || 'neutral'
      })
      
      // Detect learning mode from AI response
      console.log('AI Response:', response.data);
      console.log('Response data keys:', Object.keys(response.data));
      console.log('Response content:', response.data.data.content);
      detectLearningMode(response.data.data.content || response.data.data.text || '')
      
      // Auto-speak AI response
      const aiText = response.data.data.content || response.data.data.text || ''
      if (aiText) {
        await playAudio(aiText)
      }
      
    } catch (error) {
      console.error('Error processing text:', error)
      alert('Error processing message. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const analyzePronunciation = async (base64Audio: string, transcribedText: string) => {
    setIsAnalyzing(true)
    try {
      const response = await apiService.analyzePronunciation({
        audioData: base64Audio,
        text: transcribedText,
        expectedText: currentSpeakingPrompt
      })
      
      const feedback = response.data
      setPronunciationFeedback(feedback)
      
      // Update speaking stats
      const currentScore = feedback.overall || feedback.overallScore || 0
      setSpeakingStats(prev => {
        const newStats = {
          totalRecordings: prev.totalRecordings + 1,
          averageScore: Math.round(((prev.averageScore * prev.totalRecordings) + currentScore) / (prev.totalRecordings + 1)),
          bestScore: Math.max(prev.bestScore, currentScore),
          challengesCompleted: currentScore >= 7 ? prev.challengesCompleted + 1 : prev.challengesCompleted
        }
        
        // Check for achievements
        checkAchievements(newStats)
        
        return newStats
      })
    } catch (error) {
      console.error('Error analyzing pronunciation:', error)
      // Set fallback feedback
      setPronunciationFeedback({
        overallScore: 7,
        wordScores: [],
        fluencyScore: 7,
        paceScore: 7,
        clarityScore: 7,
        improvements: ['Keep practicing! Your pronunciation is improving.'],
        strengths: ['Good pace and clarity!']
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const generateReadingPassage = async (topic?: string) => {
    setIsLoading(true)
    try {
      const response = await apiService.generateReadingContent({
        topic: topic || 'general interest',
        level: 'intermediate',
        language: 'en'
      })
      
      const passage: ReadingPassage = {
        id: `passage-${Date.now()}`,
        title: response.data.title || 'Reading Passage',
        content: response.data.content || 'No content available',
        difficulty: response.data.difficulty || 'intermediate',
        vocabulary: response.data.vocabulary || [],
        comprehensionQuestions: response.data.questions || [],
        readingTime: response.data.readingTime || 5
      }
      
      setCurrentReadingPassage(passage)
      setShowVocabulary(false)
      setShowComprehension(false)
      setReadingAnswers([])
      setReadingScore(null)
    } catch (error) {
      console.error('Error generating reading passage:', error)
      // Fallback passage
      setCurrentReadingPassage({
        id: 'fallback-passage',
        title: 'The Benefits of Learning Languages',
        content: 'Learning a new language opens doors to new cultures, improves cognitive abilities, and enhances career opportunities. Studies show that bilingual individuals have better problem-solving skills and memory retention. Language learning also promotes cultural understanding and global communication.',
        difficulty: 'intermediate',
        vocabulary: [
          { word: 'cognitive', definition: 'relating to mental processes', context: 'cognitive abilities' },
          { word: 'bilingual', definition: 'speaking two languages fluently', context: 'bilingual individuals' },
          { word: 'retention', definition: 'the ability to remember information', context: 'memory retention' }
        ],
        comprehensionQuestions: [
          {
            question: 'What are the main benefits of learning languages?',
            options: ['Career opportunities only', 'Cultural understanding only', 'Cognitive abilities and cultural understanding', 'Memory only'],
            correctAnswer: 2,
            explanation: 'The passage mentions cognitive abilities, cultural understanding, and career opportunities as benefits.'
          }
        ],
        readingTime: 3
      })
    } finally {
      setIsLoading(false)
    }
  }

  const generateWritingExercise = async (type?: string) => {
    setIsLoading(true)
    try {
      // For now, use fallback exercise since we don't have a generate endpoint
      console.log('Generating writing exercise for type:', type || 'essay')
      
      const exercise: WritingExercise = {
        id: `writing-${Date.now()}`,
        title: 'Writing Exercise',
        prompt: 'Write about your favorite hobby and explain why you enjoy it.',
        type: (type as any) || 'essay',
        difficulty: 'intermediate',
        wordLimit: 200,
        timeLimit: 15,
        requirements: ['Use proper grammar', 'Include specific examples', 'Write in complete sentences']
      }
      
      setCurrentWritingExercise(exercise)
      setWritingText('')
      setWritingFeedback(null)
      setShowWritingEditor(true)
    } catch (error) {
      console.error('Error generating writing exercise:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const analyzeWriting = async (text: string) => {
    setIsLoading(true)
    try {
      const response = await apiService.analyzeWriting({
        text: text,
        language: 'en'
      })
      
      setWritingFeedback(response.data)
      
      // Update progress
      setLearningCards(prev => prev.map(card => 
        card.type === 'writing' 
          ? { ...card, progress: Math.min(100, (card.progress || 0) + 15) }
          : card
      ))
    } catch (error) {
      console.error('Error analyzing writing:', error)
      // Fallback feedback
      setWritingFeedback({
        overallScore: 7,
        grammarScore: 7,
        vocabularyScore: 7,
        structureScore: 7,
        styleScore: 7,
        suggestions: [
          { type: 'grammar', message: 'Check your sentence structure' },
          { type: 'vocabulary', message: 'Try using more varied vocabulary' }
        ],
        strengths: ['Good ideas', 'Clear communication'],
        improvements: ['Work on grammar', 'Expand vocabulary']
      })
    } finally {
      setIsLoading(false)
    }
  }

  const detectLearningMode = (text: string) => {
    if (!text || typeof text !== 'string') {
      console.warn('detectLearningMode: Invalid text parameter:', text)
      return
    }
    const lowerText = text.toLowerCase()
    
    if (lowerText.includes('speak') || lowerText.includes('pronunciation') || lowerText.includes('say')) {
      setCurrentMode('speaking')
      updateActiveCard('speaking')
      // Set speaking prompt when entering speaking mode
      const speakingCard = learningCards.find(card => card.type === 'speaking')
      if (speakingCard?.speakingPrompt) {
        setCurrentSpeakingPrompt(speakingCard.speakingPrompt)
      }
    } else if (lowerText.includes('read') || lowerText.includes('passage') || lowerText.includes('text')) {
      setCurrentMode('reading')
      updateActiveCard('reading')
      // Generate reading passage when entering reading mode
      generateReadingPassage()
    } else if (lowerText.includes('write') || lowerText.includes('grammar') || lowerText.includes('email')) {
      setCurrentMode('writing')
      updateActiveCard('writing')
      // Generate writing exercise when entering writing mode
      generateWritingExercise()
    } else if (lowerText.includes('listen') || lowerText.includes('audio') || lowerText.includes('hear')) {
      setCurrentMode('listening')
      updateActiveCard('listening')
    }
  }

  const updateActiveCard = (type: 'speaking' | 'reading' | 'writing' | 'listening') => {
    setLearningCards(prev => prev.map(card => ({
      ...card,
      isActive: card.type === type,
      progress: card.type === type ? Math.min((card.progress || 0) + 20, 100) : card.progress
    })))
  }

  const playAudio = async (text: string) => {
    if (!text || text.trim().length === 0) {
      console.warn('playAudio: No text provided');
      return;
    }
    
    try {
      console.log('Playing audio for text:', text);
      console.log('AI Response object:', aiResponse);
      const response = await apiService.synthesizeSpeech({ text })
      console.log('Speech synthesis response:', response.data);
      const audioData = response.data.data.audioData
      console.log('Audio data type:', typeof audioData);
      console.log('Audio data value:', audioData);
      
      // Handle both string and object formats
      const audioString = typeof audioData === 'string' ? audioData : audioData?.audioData;
      
      if (audioString && typeof audioString === 'string') {
        console.log('Audio data received, creating blob...');
        // Convert base64 to blob
        const audioBlob = await fetch(`data:audio/mpeg;base64,${audioString}`).then(r => r.blob())
        const audioUrl = URL.createObjectURL(audioBlob)
        console.log('Audio URL created:', audioUrl);
        
        if (audioRef.current) {
          audioRef.current.src = audioUrl
          audioRef.current.play()
          setIsPlaying(true)
          console.log('Audio playing...');
        } else {
          console.error('Audio ref is null, retrying...');
          // Retry after a short delay
          setTimeout(() => {
            if (audioRef.current) {
              audioRef.current.src = audioUrl
              audioRef.current.play()
              setIsPlaying(true)
              console.log('Audio playing after retry...');
            } else {
              console.error('Audio ref still null after retry');
            }
          }, 100);
        }
      } else {
        console.error('No valid audio data in response. Type:', typeof audioData, 'Value:', audioData);
      }
    } catch (error) {
      console.error('Error playing audio:', error)
    }
  }

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
      console.log('Audio paused');
    }
  }

  const toggleAudio = () => {
    if (isPlaying) {
      pauseAudio()
    } else {
      if (aiResponse && aiResponse.text) {
        playAudio(aiResponse.text)
      }
    }
  }

  const checkAchievements = (stats: any) => {
    const newAchievements: string[] = []
    
    if (stats.totalRecordings === 1 && !achievements.includes('first-recording')) {
      newAchievements.push('first-recording')
    }
    if (stats.totalRecordings === 10 && !achievements.includes('persistent-learner')) {
      newAchievements.push('persistent-learner')
    }
    if (stats.bestScore >= 9 && !achievements.includes('pronunciation-master')) {
      newAchievements.push('pronunciation-master')
    }
    if (stats.challengesCompleted >= 3 && !achievements.includes('challenge-champion')) {
      newAchievements.push('challenge-champion')
    }
    if (stats.averageScore >= 8 && stats.totalRecordings >= 5 && !achievements.includes('consistent-excellence')) {
      newAchievements.push('consistent-excellence')
    }
    
    if (newAchievements.length > 0) {
      setAchievements(prev => [...prev, ...newAchievements])
      
      // Show achievement notification
      const achievementMessages = {
        'first-recording': '🎉 First Recording! You\'ve taken the first step in your speaking journey!',
        'persistent-learner': '🔥 Persistent Learner! You\'ve completed 10 recordings!',
        'pronunciation-master': '⭐ Pronunciation Master! You achieved a perfect 9+ score!',
        'challenge-champion': '🏆 Challenge Champion! You\'ve completed 3 challenges!',
        'consistent-excellence': '💎 Consistent Excellence! You maintain high scores across multiple recordings!'
      }
      
      newAchievements.forEach(achievement => {
        const message = {
          type: 'ai' as const,
          content: `**Achievement Unlocked!** 🎊\n\n${achievementMessages[achievement as keyof typeof achievementMessages]}`,
          timestamp: new Date()
        }
        setConversationHistory(prev => [...prev, message])
      })
    }
  }

  const startSpeakingChallenge = (challenge: any) => {
    setCurrentChallenge(challenge)
    setCurrentSpeakingPrompt(challenge.prompt)
    setCurrentMode('speaking')
    setPronunciationFeedback(null)
    setCurrentTranscript('')
    
    // Add AI message about the challenge
    const challengeMessage = {
      type: 'ai' as const,
      content: `${translate('aiTutorRoom.aiMessages.speakingChallengeIntro', "Great! Let's work on your speaking skills. Here's your challenge:")}\n\n**${challenge.title}**\n\n${challenge.prompt}\n\n${translate('aiTutorRoom.aiMessages.speakingChallengeInstructions', "Take your time and speak clearly. I'll provide feedback on your pronunciation and fluency.")}`,
      timestamp: new Date()
    }
    setConversationHistory(prev => [...prev, challengeMessage])
  }

  const generateSpeakingFromPrompt = async () => {
    if (!speakingPrompt.trim()) return

    setIsLoading(true)
    try {
      // Set the speaking prompt and mode
      setCurrentSpeakingPrompt(speakingPrompt)
      setCurrentMode('speaking')
      setPronunciationFeedback(null)
      setCurrentTranscript('')

      const promptMessage = {
        type: 'ai' as const,
        content: `🎤 **${translate('aiTutorRoom.speakingPracticeReady', 'Speaking Practice Ready!')}**\n\nI've prepared a speaking exercise for you:\n\n**"${speakingPrompt}"**\n\n**${translate('aiTutorRoom.speakingInstructions', 'Instructions:')}**\n1. ${translate('aiTutorRoom.speakingInstruction1', 'Click "Start Recording" when you\'re ready')}\n2. ${translate('aiTutorRoom.speakingInstruction2', 'Speak clearly and naturally')}\n3. ${translate('aiTutorRoom.speakingInstruction3', 'Click "Stop Recording" when finished')}\n4. ${translate('aiTutorRoom.speakingInstruction4', 'I\'ll provide pronunciation feedback')}\n\n${translate('aiTutorRoom.speakingConfidence', 'Take your time and speak with confidence!')}`,
        timestamp: new Date()
      }
      setConversationHistory(prev => [...prev, promptMessage])

    } catch (error) {
      console.error('Error generating speaking prompt:', error)
      alert('Error generating speaking prompt. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadedFile(file)
    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('userId', 'default')

      const response = await apiService.analyzeContent(formData)
      const analysis = response.data.data

      setContentAnalysis(analysis)
      setCurrentMode('reading')

      // Auto-set flashcards and quiz if available
      if (analysis.flashcards && analysis.flashcards.length > 0) {
        setFlashcards(analysis.flashcards)
      }
      if (analysis.quiz && analysis.quiz.length > 0) {
        setQuiz(analysis.quiz)
      }

      // Add AI message about the uploaded content
      const uploadMessage = {
        type: 'ai' as const,
        content: `📄 **File Uploaded Successfully!**\n\nI've analyzed your file: **${file.name}**\n\nHere's what I found:\n\n${analysis.analysis}\n\nYou can now:\n- 📚 **Read the summary** I've created\n- 🃏 **Study with flashcards** I'll generate\n- 🧠 **Take a quiz** to test your understanding\n- ❓ **Ask questions** about the content\n\nWhat would you like to do first?`,
        timestamp: new Date()
      }
      setConversationHistory(prev => [...prev, uploadMessage])

    } catch (error) {
      console.error('Error analyzing file:', error)
      alert('Error analyzing file. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }


  const generateQuiz = async () => {
    if (!contentAnalysis) return

    setIsLoading(true)
    try {
      const response = await apiService.generateQuiz({
        content: contentAnalysis.analysis,
        analysis: contentAnalysis.analysis,
        userId: 'default'
      })

      const questions = response.data.data.questions
      setQuiz(questions)
      setQuizAnswers({})
      setQuizScore(null)
      setShowQuizResults(false)
      setQuizResults([])

      const quizMessage = {
        type: 'ai' as const,
        content: `🧠 **${translate('aiTutorRoom.quizGenerated', 'New Quiz Generated!')}**\n\nI've created a fresh quiz with ${questions.length} questions to test your understanding. Take your time and answer each question carefully!\n\n**${translate('aiTutorRoom.quizGoodLuck', 'Good luck!')}** 🍀`,
        timestamp: new Date()
      }
      setConversationHistory(prev => [...prev, quizMessage])

    } catch (error) {
      console.error('Error generating quiz:', error)
      alert('Error generating quiz. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const submitQuiz = () => {
    if (!quiz || quiz.length === 0) return

    let correctAnswers = 0
    const quizResults = quiz.map((question, index) => {
      const userAnswer = quizAnswers[index]
      const correctAnswer = question.correctAnswer
      let isCorrect = false
      let userAnswerText = ''

      if (question.type === 'multiple_choice') {
        // For multiple choice, compare with option index
        const correctIndex = question.options?.findIndex((option: string) => option === correctAnswer)
        const userIndex = parseInt(userAnswer || '-1')
        isCorrect = userIndex === correctIndex
        userAnswerText = question.options?.[userIndex] || 'Not answered'
      } else if (question.type === 'true_false') {
        // For true/false, compare directly
        isCorrect = userAnswer === correctAnswer
        userAnswerText = userAnswer || 'Not answered'
      }

      if (isCorrect) correctAnswers++

      return {
        question: question.question,
        userAnswer: userAnswerText,
        correctAnswer: correctAnswer,
        isCorrect: isCorrect,
        explanation: question.explanation,
        type: question.type,
        options: question.options
      }
    })

    const score = Math.round((correctAnswers / quiz.length) * 100)
    setQuizScore(score)
    setShowQuizResults(true)

    // Store detailed results for display
    setQuizResults(quizResults)

    const resultMessage = {
      type: 'ai' as const,
      content: `🎯 **Quiz Results!**\n\n**Your Score: ${score}%** (${correctAnswers}/${quiz.length} correct)\n\n${score >= 80 ? '🌟 Excellent work! You have a great understanding of the content.' : score >= 60 ? '👍 Good job! You understand most of the content.' : '📚 Keep studying! Review the content and try again.'}\n\nWould you like to review the flashcards or ask me any questions about the content?`,
      timestamp: new Date()
    }
    setConversationHistory(prev => [...prev, resultMessage])
  }

  const askQuestion = async (question: string) => {
    if (!contentAnalysis || !question.trim()) return

    setIsLoading(true)
    try {
      const response = await apiService.answerQuestion({
        question: question,
        content: contentAnalysis.analysis,
        analysis: contentAnalysis.analysis,
        userId: 'default'
      })

      const answer = response.data.data.answer

      const questionMessage = {
        type: 'user' as const,
        content: question,
        timestamp: new Date()
      }

      const answerMessage = {
        type: 'ai' as const,
        content: `❓ **Your Question:** ${question}\n\n${answer}`,
        timestamp: new Date()
      }

      setConversationHistory(prev => [...prev, questionMessage, answerMessage])

    } catch (error) {
      console.error('Error answering question:', error)
      alert('Error answering question. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const generateReadingFromPrompt = async () => {
    if (!readingPrompt.trim()) return

    setIsLoading(true)
    try {
      // Create FormData with the prompt as content
      const formData = new FormData()
      formData.append('content', readingPrompt)
      formData.append('userId', 'default')

      const analysisResponse = await apiService.analyzeContent(formData)
      const analysis = analysisResponse.data.data

      setContentAnalysis(analysis)
      setCurrentMode('reading')

      // Auto-set flashcards and quiz if available
      if (analysis.flashcards && analysis.flashcards.length > 0) {
        setFlashcards(analysis.flashcards)
      }
      if (analysis.quiz && analysis.quiz.length > 0) {
        setQuiz(analysis.quiz)
      }

      const promptMessage = {
        type: 'ai' as const,
        content: `📝 **${translate('aiTutorRoom.contentGenerated', 'Content Generated!')}**\n\nI've analyzed your prompt: **"${readingPrompt}"**\n\nHere's what I found:\n\n${analysis.analysis}\n\n${translate('aiTutorRoom.contentOptions', 'You can now:')}\n- 📚 **${translate('aiTutorRoom.contentOption1', 'Read the summary')}** I've created\n- 🃏 **${translate('aiTutorRoom.contentOption2', 'Study with flashcards')}** I'll generate\n- 🧠 **${translate('aiTutorRoom.contentOption3', 'Take a quiz')}** to test your understanding\n- ❓ **${translate('aiTutorRoom.contentOption4', 'Ask questions')}** about the content\n\n${translate('aiTutorRoom.whatWouldYouLike', 'What would you like to do first?')}`,
        timestamp: new Date()
      }
      setConversationHistory(prev => [...prev, promptMessage])

    } catch (error) {
      console.error('Error generating reading content:', error)
      alert('Error generating reading content. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReadingAnswer = (questionIndex: number, answerIndex: number) => {
    const newAnswers = [...readingAnswers]
    newAnswers[questionIndex] = answerIndex
    setReadingAnswers(newAnswers)
  }

  const submitReadingAnswers = () => {
    if (!currentReadingPassage) return
    
    let correct = 0
    currentReadingPassage.comprehensionQuestions.forEach((question, index) => {
      if (readingAnswers[index] === question.correctAnswer) {
        correct++
      }
    })
    
    const score = Math.round((correct / currentReadingPassage.comprehensionQuestions.length) * 100)
    setReadingScore(score)
    setShowComprehension(false)
    
    // Update progress
    setLearningCards(prev => prev.map(card => 
      card.type === 'reading' 
        ? { ...card, progress: Math.min(100, (card.progress || 0) + 20) }
        : card
    ))
  }

  const handleCardClick = (card: LearningCard) => {
    if (card.type === 'speaking') {
      setCurrentMode('speaking')
      updateActiveCard('speaking')
      
      // Start with the default speaking challenge if available
      if (card.speakingPrompt) {
        const challenge = {
          id: card.id,
          title: card.title,
          prompt: card.speakingPrompt,
          difficulty: card.difficulty || 'beginner',
          category: 'Speaking Practice'
        }
        startSpeakingChallenge(challenge)
      } else {
        // Fallback to generic speaking practice
        const prompt = `I want to practice ${card.type}. ${card.description}`
        processTextInput(prompt)
      }
    } else if (card.type === 'reading') {
      setCurrentMode('reading')
      updateActiveCard('reading')
      generateReadingPassage()
    } else if (card.type === 'writing') {
      setCurrentMode('writing')
      updateActiveCard('writing')
      generateWritingExercise()
    } else {
      const prompt = `I want to practice ${card.type}. ${card.description}`
      processTextInput(prompt)
    }
  }

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'speaking': return <Mic className="w-5 h-5" />
      case 'reading': return <BookOpen className="w-5 h-5" />
      case 'writing': return <PenTool className="w-5 h-5" />
      case 'listening': return <Headphones className="w-5 h-5" />
      default: return <MessageCircle className="w-5 h-5" />
    }
  }

  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'speaking': return 'bg-orange-500'
      case 'reading': return 'bg-purple-500'
      case 'writing': return 'bg-green-500'
      case 'listening': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
        >
          <RotateCcw className="w-5 h-5 mr-2" />
          Back to Home
        </button>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            AI Learning Studio
          </div>
          <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* AI Tutor Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
              {/* AI Tutor Avatar */}
              <div className="flex items-start space-x-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{translate('aiTutor.tutorName', 'AI Tutor')}</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {conversationHistory.length > 0 && (
                      <div className="text-gray-700 leading-relaxed prose prose-sm max-w-none">
                        <ReactMarkdown
                          components={{
                            h1: ({children}) => <h1 className="text-xl font-bold text-gray-800 mb-3">{children}</h1>,
                            h2: ({children}) => <h2 className="text-lg font-semibold text-gray-800 mb-2">{children}</h2>,
                            h3: ({children}) => <h3 className="text-base font-semibold text-gray-800 mb-2">{children}</h3>,
                            p: ({children}) => <p className="mb-3">{children}</p>,
                            strong: ({children}) => <strong className="font-semibold text-gray-800">{children}</strong>,
                            em: ({children}) => <em className="italic text-gray-600">{children}</em>,
                            ul: ({children}) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
                            ol: ({children}) => <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>,
                            li: ({children}) => <li className="text-gray-700">{children}</li>,
                            code: ({children}) => <code className="bg-gray-200 px-1 py-0.5 rounded text-sm font-mono">{children}</code>,
                            pre: ({children}) => <pre className="bg-gray-200 p-3 rounded-lg overflow-x-auto mb-3">{children}</pre>,
                            blockquote: ({children}) => <blockquote className="border-l-4 border-indigo-300 pl-4 italic text-gray-600 mb-3">{children}</blockquote>,
                            hr: () => <hr className="border-gray-300 my-4" />
                          }}
                        >
                          {(() => {
                            const lastMessage = conversationHistory[conversationHistory.length - 1];
                            // Hide welcome message if there are multiple messages or if it's not the welcome message
                            const isWelcomeMessage = lastMessage.content.includes("Hello! I'm your AI language learning tutor") && 
                                                   lastMessage.content.includes("What would you like to work on today?");
                            
                            if (isWelcomeMessage && conversationHistory.length === 1) {
                              return lastMessage.content;
                            } else if (!isWelcomeMessage) {
                              return lastMessage.content;
                            } else {
                              return ""; // Hide welcome message if there are other messages
                            }
                          })()}
                        </ReactMarkdown>
                      </div>
                    )}
                    
              {/* Flashcards and Quiz Actions - Always show when content analysis exists */}
              {contentAnalysis && (flashcards.length > 0 || quiz.length > 0) && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3">{translate('aiTutor.interactiveTools', 'Interactive Learning Tools:')}</h4>
                  <div className="flex flex-wrap gap-2">
                    {flashcards.length > 0 && (
                      <button
                        onClick={() => setCurrentMode('flashcards')}
                        className={`flex items-center px-3 py-2 rounded-lg transition-colors text-sm ${
                          currentMode === 'flashcards' 
                            ? 'bg-purple-700 text-white' 
                            : 'bg-purple-600 text-white hover:bg-purple-700'
                        }`}
                      >
                        <span className="mr-1">🃏</span>
{translate('aiTutor.studyFlashcards', 'Study Flashcards')} ({flashcards.length})
                      </button>
                    )}
                    
                    {quiz.length > 0 && (
                      <button
                        onClick={() => setCurrentMode('quiz')}
                        className={`flex items-center px-3 py-2 rounded-lg transition-colors text-sm ${
                          currentMode === 'quiz' 
                            ? 'bg-indigo-700 text-white' 
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                      >
                        <span className="mr-1">🧠</span>
{translate('aiTutor.takeQuiz', 'Take Quiz')} ({quiz.length} {translate('aiTutor.questions', 'questions')})
                      </button>
                    )}
                    
                    <button
                      onClick={() => setCurrentMode('qa')}
                      className={`flex items-center px-3 py-2 rounded-lg transition-colors text-sm ${
                        currentMode === 'qa' 
                          ? 'bg-green-700 text-white' 
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      <span className="mr-1">❓</span>
{translate('aiTutor.askQuestions', 'Ask Questions')}
                    </button>
                    
                    <button
                      onClick={() => setCurrentMode('reading')}
                      className={`flex items-center px-3 py-2 rounded-lg transition-colors text-sm ${
                        currentMode === 'reading' 
                          ? 'bg-gray-700 text-white' 
                          : 'bg-gray-600 text-white hover:bg-gray-700'
                      }`}
                    >
                      <span className="mr-1">📖</span>
{translate('aiTutor.backToContent', 'Back to Content')}
                    </button>
                  </div>
                </div>
              )}

              {/* Flashcards Display */}
              {currentMode === 'flashcards' && flashcards.length > 0 && (
                <div className="mt-6 p-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-purple-800">{translate('aiTutor.flashcardsPractice', 'Flashcards Practice')}</h3>
                    <div className="text-sm text-purple-600">
                      {currentFlashcardIndex + 1} of {flashcards.length}
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <div className="text-center mb-6">
                      <h4 className="text-xl font-bold text-gray-800 mb-2">
{flashcards[currentFlashcardIndex]?.front || translate('aiTutor.question', 'Question')}
                      </h4>
                    </div>
                    
                    {showFlashcardAnswer && (
                      <div className="text-center mb-6">
                        <div className="bg-gray-50 rounded-lg p-4">
<h5 className="text-lg font-semibold text-gray-700 mb-2">{translate('aiTutor.answer', 'Answer:')}</h5>
                          <p className="text-gray-600">
{flashcards[currentFlashcardIndex]?.back || translate('aiTutor.answerNotAvailable', 'Answer not available')}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-center space-x-4">
                      <button
                        onClick={() => setShowFlashcardAnswer(!showFlashcardAnswer)}
                        className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
{showFlashcardAnswer ? translate('aiTutor.hideAnswer', 'Hide Answer') : translate('aiTutor.showAnswer', 'Show Answer')}
                      </button>
                      
                      <button
                        onClick={() => {
                          setCurrentFlashcardIndex((prev) => (prev + 1) % flashcards.length)
                          setShowFlashcardAnswer(false)
                        }}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                      >
{translate('aiTutor.nextCard', 'Next Card')}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Quiz Display */}
              {currentMode === 'quiz' && quiz.length > 0 && !showQuizResults && (
                <div className="mt-6 p-6 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border border-indigo-200">
                  <div className="flex items-center justify-between mb-4">
<h3 className="text-lg font-semibold text-indigo-800">{translate('aiTutor.quizPractice', 'Quiz Practice')}</h3>
                    <div className="text-sm text-indigo-600">
                      {Object.keys(quizAnswers).length} of {quiz.length} answered
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {quiz.map((question, index) => (
                      <div key={index} className="bg-white rounded-lg p-4 shadow-sm">
                        <h4 className="font-semibold text-gray-800 mb-3">
                          {index + 1}. {question.question || question.text || 'Question not available'}
                        </h4>
                        
                        <div className="space-y-2">
                          {question.type === 'true_false' ? (
                            <div className="space-y-2">
                              <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`question-${index}`}
                                  checked={quizAnswers[index] === 'True'}
                                  onChange={() => setQuizAnswers(prev => ({...prev, [index]: 'True'}))}
                                  className="text-indigo-600"
                                />
                                <span className="text-gray-700">True</span>
                              </label>
                              <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`question-${index}`}
                                  checked={quizAnswers[index] === 'False'}
                                  onChange={() => setQuizAnswers(prev => ({...prev, [index]: 'False'}))}
                                  className="text-indigo-600"
                                />
                                <span className="text-gray-700">False</span>
                              </label>
                            </div>
                          ) : (
                            question.options && question.options.map((option: string, optionIndex: number) => (
                              <label key={optionIndex} className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`question-${index}`}
                                  checked={quizAnswers[index] === optionIndex.toString()}
                                  onChange={() => setQuizAnswers(prev => ({...prev, [index]: optionIndex.toString()}))}
                                  className="text-indigo-600"
                                />
                                <span className="text-gray-700">{option}</span>
                              </label>
                            ))
                          )}
                        </div>
                      </div>
                    ))}
                    
                    <div className="flex justify-center space-x-4">
                      <button
                        onClick={submitQuiz}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        Submit Quiz
                      </button>
                      <button
                        onClick={generateQuiz}
                        disabled={isLoading}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isLoading ? 'Generating...' : 'Refresh Quiz'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Quiz Results Display */}
              {currentMode === 'quiz' && showQuizResults && quizResults.length > 0 && (
                <div className="mt-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-green-800">Quiz Results</h3>
                    <div className="text-2xl font-bold text-green-600">
                      {quizScore}%
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {quizResults.map((result, index) => (
                      <div key={index} className={`bg-white rounded-lg p-4 shadow-sm border-l-4 ${
                        result.isCorrect ? 'border-green-500' : 'border-red-500'
                      }`}>
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-semibold text-gray-800 flex-1">
                            {index + 1}. {result.question}
                          </h4>
                          <div className={`ml-4 px-2 py-1 rounded-full text-xs font-semibold ${
                            result.isCorrect 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {result.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-600">Your answer:</span>
                            <span className={`text-sm font-semibold ${
                              result.isCorrect ? 'text-green-700' : 'text-red-700'
                            }`}>
                              {result.userAnswer}
                            </span>
                          </div>
                          
                          {!result.isCorrect && (
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-600">Correct answer:</span>
                              <span className="text-sm font-semibold text-green-700">
                                {result.correctAnswer}
                              </span>
                            </div>
                          )}
                          
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-600">Explanation:</span>
                            <p className="text-sm text-gray-700 mt-1">{result.explanation}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <div className="flex justify-center space-x-4 mt-6">
                      <button
                        onClick={() => {
                          setShowQuizResults(false)
                          setQuizAnswers({})
                          setQuizResults([])
                          setQuizScore(null)
                        }}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        Retake Quiz
                      </button>
                      <button
                        onClick={generateQuiz}
                        disabled={isLoading}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isLoading ? 'Generating...' : 'Refresh Quiz'}
                      </button>
                      <button
                        onClick={() => setCurrentMode('flashcards')}
                        className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        Study Flashcards
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Q&A Display */}
              {currentMode === 'qa' && contentAnalysis && (
                <div className="mt-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-green-800">Ask Questions</h3>
                    <div className="text-sm text-green-600">
                      Ask me anything about the content
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Question Input */}
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={readingPrompt}
                          onChange={(e) => setReadingPrompt(e.target.value)}
                          placeholder="Ask a question about the content..."
                          className="flex-1 px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          onKeyPress={(e) => e.key === 'Enter' && askQuestion(readingPrompt)}
                        />
                        <button
                          onClick={() => askQuestion(readingPrompt)}
                          disabled={!readingPrompt.trim() || isLoading}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Ask
                        </button>
                      </div>
                    </div>
                    
                    {/* Q&A History */}
                    <div className="space-y-3">
                      {conversationHistory
                        .filter(msg => msg.type === 'user' && msg.content !== '')
                        .map((msg, index) => (
                          <div key={index} className="bg-white rounded-lg p-4 shadow-sm">
                            <div className="flex items-start space-x-3">
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <span className="text-green-600 text-sm font-semibold">Q</span>
                              </div>
                              <div className="flex-1">
                                <p className="text-gray-800 font-medium">{msg.content}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {new Date(msg.timestamp).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}
                  </div>
                </div>
              </div>

              {/* Current Mode Indicator */}
              {currentMode && (
                <div className="mb-4">
                  <div className={`inline-flex items-center px-4 py-2 rounded-full text-white ${getModeColor(currentMode)}`}>
                    {getModeIcon(currentMode)}
                    <span className="ml-2 font-medium capitalize">{currentMode} Practice</span>
                  </div>
                </div>
              )}

              {/* Speaking Stats Dashboard */}
              {currentMode === 'speaking' && (
                <div className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
                  <h4 className="text-lg font-semibold text-indigo-800 mb-3 flex items-center">
                    <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center mr-2">
                      <Sparkles className="w-3 h-3 text-white" />
                    </div>
                    {translate('aiTutorRoom.speakingProgress.title', 'Your Speaking Progress')}
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-indigo-600">{speakingStats.totalRecordings}</div>
                      <div className="text-sm text-indigo-700">{translate('aiTutorRoom.speakingProgress.recordings', 'Recordings')}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{speakingStats.averageScore}/10</div>
                      <div className="text-sm text-green-700">{translate('aiTutorRoom.speakingProgress.average', 'Average')}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{speakingStats.bestScore}/10</div>
                      <div className="text-sm text-purple-700">{translate('aiTutorRoom.speakingProgress.bestScore', 'Best Score')}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{speakingStats.challengesCompleted}</div>
                      <div className="text-sm text-orange-700">{translate('aiTutorRoom.speakingProgress.completed', 'Completed')}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Speaking Challenges */}
              {currentMode === 'speaking' && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-800">{translate('aiTutorRoom.speakingChallenges', 'Speaking Challenges')}</h4>
                    <div className="text-sm text-gray-500">{translate('aiTutorRoom.chooseTopic', 'Choose a topic to practice')}</div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {getTranslatedSpeakingChallenges().map((challenge) => (
                      <button
                        key={challenge.id}
                        onClick={() => startSpeakingChallenge(challenge)}
                        className={`p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                          currentChallenge?.id === challenge.id
                            ? 'border-indigo-500 bg-indigo-50 shadow-md'
                            : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            challenge.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                            challenge.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {challenge.difficulty}
                          </span>
                          <span className="text-xs text-gray-500">{challenge.category}</span>
                        </div>
                        <h5 className="font-medium text-gray-800 mb-1">{challenge.title}</h5>
                        <p className="text-sm text-gray-600 line-clamp-2">{challenge.prompt}</p>
                      </button>
                    ))}
                  </div>
                  
                  {/* Current Challenge Display */}
                  {currentChallenge && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg">
                      <div className="flex items-center mb-2">
                        <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center mr-2">
                          <Mic className="w-3 h-3 text-white" />
                        </div>
                        <h4 className="font-semibold text-indigo-800">{translate('aiTutorRoom.speakingChallenges.currentChallenge', 'Current Challenge:')} {currentChallenge.title}</h4>
                      </div>
                      <p className="text-indigo-700 leading-relaxed">{currentSpeakingPrompt}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Enhanced Pronunciation Feedback */}
              {pronunciationFeedback && (
                <div className="mb-6 p-6 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl shadow-sm">
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                      <Volume2 className="w-4 h-4 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold text-green-800">Pronunciation Analysis</h4>
                  </div>
                  
                  {/* Score Cards with Progress Bars */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600">Overall</span>
                        <span className="text-xl font-bold text-green-600">{pronunciationFeedback.overall || pronunciationFeedback.overallScore || 0}/10</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full transition-all duration-500"
                          style={{width: `${((pronunciationFeedback.overall || pronunciationFeedback.overallScore || 0) / 10) * 100}%`}}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600">Fluency</span>
                        <span className="text-xl font-bold text-blue-600">{pronunciationFeedback.fluency || pronunciationFeedback.fluencyScore || 0}/10</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-400 to-blue-500 h-2 rounded-full transition-all duration-500"
                          style={{width: `${((pronunciationFeedback.fluency || pronunciationFeedback.fluencyScore || 0) / 10) * 100}%`}}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600">Clarity</span>
                        <span className="text-xl font-bold text-purple-600">{pronunciationFeedback.clarity || pronunciationFeedback.clarityScore || 0}/10</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-purple-400 to-purple-500 h-2 rounded-full transition-all duration-500"
                          style={{width: `${((pronunciationFeedback.clarity || pronunciationFeedback.clarityScore || 0) / 10) * 100}%`}}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Strengths and Improvements */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pronunciationFeedback.strengths && pronunciationFeedback.strengths.length > 0 && (
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <h5 className="font-medium text-green-800 mb-2 flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          Strengths
                        </h5>
                        <ul className="text-sm text-green-700 space-y-1">
                          {pronunciationFeedback.strengths.map((strength: string, index: number) => (
                            <li key={index} className="flex items-center">
                              <div className="w-1 h-1 bg-green-400 rounded-full mr-2"></div>
                              {strength}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {pronunciationFeedback.improvements && pronunciationFeedback.improvements.length > 0 && (
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <h5 className="font-medium text-orange-800 mb-2 flex items-center">
                          <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                          Suggestions
                        </h5>
                        <ul className="text-sm text-orange-700 space-y-1">
                          {pronunciationFeedback.improvements.map((improvement, index) => (
                            <li key={index} className="flex items-center">
                              <div className="w-1 h-1 bg-orange-400 rounded-full mr-2"></div>
                              {improvement}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Reading Practice - File Upload and Text Input */}
              {currentMode === 'reading' && (
                <div className="mb-6 p-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BookOpen className="w-8 h-8 text-white" />
                    </div>
                    <h4 className="text-xl font-semibold text-purple-800 mb-2">{translate('aiTutorRoom.interfaceTitles.readingPractice', 'Reading Practice')}</h4>
                    <p className="text-purple-600 mb-6">{translate('aiTutorRoom.interfaceTitles.readingInstructions', "Upload a file or provide text to start your reading practice")}</p>
                    
                    {/* File Upload */}
                    <div className="mb-4">
                      <label className="block">
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.txt,.ppt,.pptx"
                          onChange={handleFileUpload}
                          className="hidden"
                          id="file-upload"
                        />
                        <span className="inline-flex items-center px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 cursor-pointer transition-colors">
                          <BookOpen className="w-5 h-5 mr-2" />
                          {translate('aiTutorRoom.readingInterface.uploadFile', 'Upload File (PDF, DOC, TXT, PPT)')}
                        </span>
                      </label>
                    </div>
                    
                    {/* Text Input */}
                    <div className="w-full max-w-md mx-auto">
                      <div className="text-sm text-purple-500 mb-3">
                        {translate('aiTutorRoom.readingInterface.orGenerateContent', "Or ask me to generate content about a topic you're interested in")}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={readingPrompt}
                          onChange={(e) => setReadingPrompt(e.target.value)}
                          placeholder={translate('aiTutorRoom.readingInterface.placeholder', "e.g., 'Tell me about artificial intelligence'")}
                          className="flex-1 px-3 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          onKeyPress={(e) => e.key === 'Enter' && generateReadingFromPrompt()}
                        />
                        <button
                          onClick={isRecording ? stopRecording : startRecording}
                          className={`px-3 py-2 rounded-lg transition-colors ${
                            isRecording 
                              ? 'bg-red-500 text-white hover:bg-red-600' 
                              : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                          }`}
                          title={isRecording ? 'Stop recording' : 'Start voice input'}
                        >
                          {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={generateReadingFromPrompt}
                          disabled={!readingPrompt.trim() || isLoading}
                          className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {translate('aiTutorRoom.readingInterface.analyze', 'Analyze')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Reading Passage - Removed */}
              {false && currentMode === 'reading' && currentReadingPassage && (
                <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-purple-800">{currentReadingPassage?.title}</h4>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        currentReadingPassage?.difficulty === 'beginner' ? 'bg-green-100 text-green-700' :
                        currentReadingPassage?.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {currentReadingPassage?.difficulty}
                      </span>
                      <span className="text-sm text-purple-600">
                        {currentReadingPassage?.readingTime} min read
                      </span>
                    </div>
                  </div>
                  
                  <div className="prose max-w-none mb-4">
                    <p className="text-gray-700 leading-relaxed">{currentReadingPassage?.content}</p>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowVocabulary(!showVocabulary)}
                      className="px-3 py-1 bg-purple-100 text-purple-700 rounded text-sm hover:bg-purple-200 transition-colors"
                    >
                      {showVocabulary ? 'Hide' : 'Show'} Vocabulary
                    </button>
                    <button
                      onClick={() => setShowComprehension(!showComprehension)}
                      className="px-3 py-1 bg-purple-100 text-purple-700 rounded text-sm hover:bg-purple-200 transition-colors"
                    >
                      {showComprehension ? 'Hide' : 'Show'} Questions
                    </button>
                  </div>
                  
                  {/* Vocabulary Section */}
                  {showVocabulary && currentReadingPassage?.vocabulary && (currentReadingPassage?.vocabulary?.length || 0) > 0 && (
                    <div className="mt-4 p-3 bg-white rounded border">
                      <h5 className="font-medium text-purple-800 mb-2">Key Vocabulary:</h5>
                      <div className="space-y-2">
                        {currentReadingPassage?.vocabulary?.map((vocab, index) => (
                          <div key={index} className="text-sm">
                            <span className="font-medium text-purple-700">{vocab.word}</span>
                            <span className="text-gray-600"> - {vocab.definition}</span>
                            <div className="text-xs text-gray-500 italic">"{vocab.context}"</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Comprehension Questions */}
                  {showComprehension && currentReadingPassage?.comprehensionQuestions && (currentReadingPassage?.comprehensionQuestions?.length || 0) > 0 && (
                    <div className="mt-4 p-3 bg-white rounded border">
                      <h5 className="font-medium text-purple-800 mb-3">Comprehension Questions:</h5>
                      <div className="space-y-3">
                        {currentReadingPassage?.comprehensionQuestions?.map((question, qIndex) => (
                          <div key={qIndex} className="text-sm">
                            <p className="font-medium text-gray-800 mb-2">{qIndex + 1}. {question.question}</p>
                            <div className="space-y-1">
                              {question.options.map((option: string, oIndex: number) => (
                                <label key={oIndex} className="flex items-center space-x-2 cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`question-${qIndex}`}
                                    checked={readingAnswers[qIndex] === oIndex}
                                    onChange={() => handleReadingAnswer(qIndex, oIndex)}
                                    className="text-purple-600"
                                  />
                                  <span className="text-gray-700">{option}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                        <button
                          onClick={submitReadingAnswers}
                          className="mt-3 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                        >
                          Submit Answers
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Reading Score */}
                  {readingScore !== null && (
                    <div className="mt-4 p-3 bg-green-50 rounded border border-green-200">
                      <h5 className="font-medium text-green-800 mb-1">Your Score:</h5>
                      <div className="text-2xl font-bold text-green-600">{readingScore || 0}%</div>
                      <p className="text-sm text-green-700">
                        {(readingScore || 0) >= 80 ? 'Excellent!' : (readingScore || 0) >= 60 ? 'Good job!' : 'Keep practicing!'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Writing Exercise */}
              {currentMode === 'writing' && currentWritingExercise && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-green-800">{currentWritingExercise.title}</h4>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        currentWritingExercise.difficulty === 'beginner' ? 'bg-green-100 text-green-700' :
                        currentWritingExercise.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {currentWritingExercise.difficulty}
                      </span>
                      <span className="text-sm text-green-600">
                        {currentWritingExercise.wordLimit && `${currentWritingExercise.wordLimit} words`}
                        {currentWritingExercise.timeLimit && ` • ${currentWritingExercise.timeLimit} min`}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h5 className="font-medium text-green-800 mb-2">Writing Prompt:</h5>
                    <p className="text-gray-700 mb-3">{currentWritingExercise.prompt}</p>
                    
                    <div className="mb-3">
                      <h6 className="font-medium text-green-800 mb-1">Requirements:</h6>
                      <ul className="text-sm text-gray-600 list-disc list-inside">
                        {currentWritingExercise.requirements.map((req, index) => (
                          <li key={index}>{req}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-green-800 mb-2">
                      Your Writing:
                    </label>
                    <textarea
                      value={writingText}
                      onChange={(e) => setWritingText(e.target.value)}
                      placeholder="Start writing your response here..."
                      className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    />
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-gray-500">
                        {writingText.length} words
                        {currentWritingExercise.wordLimit && ` / ${currentWritingExercise.wordLimit}`}
                      </span>
                      <button
                        onClick={() => analyzeWriting(writingText)}
                        disabled={writingText.trim().length < 10}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      >
                        Analyze Writing
                      </button>
                    </div>
                  </div>
                  
                  {/* Writing Feedback */}
                  {writingFeedback && (
                    <div className="mt-4 p-3 bg-white rounded border">
                      <h5 className="font-medium text-green-800 mb-3">Writing Analysis:</h5>
                      
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-xl font-bold text-green-600">{writingFeedback.overallScore}/10</div>
                          <div className="text-xs text-green-700">Overall</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-green-600">{writingFeedback.grammarScore}/10</div>
                          <div className="text-xs text-green-700">Grammar</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-green-600">{writingFeedback.vocabularyScore}/10</div>
                          <div className="text-xs text-green-700">Vocabulary</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-green-600">{writingFeedback.structureScore}/10</div>
                          <div className="text-xs text-green-700">Structure</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-green-600">{writingFeedback.styleScore}/10</div>
                          <div className="text-xs text-green-700">Style</div>
                        </div>
                      </div>
                      
                      {writingFeedback.strengths && writingFeedback.strengths.length > 0 && (
                        <div className="mb-3">
                          <h6 className="font-medium text-green-800 mb-1">Strengths:</h6>
                          <ul className="text-sm text-green-700 list-disc list-inside">
                            {writingFeedback.strengths.map((strength, index) => (
                              <li key={index}>{strength}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {writingFeedback.improvements && writingFeedback.improvements.length > 0 && (
                        <div className="mb-3">
                          <h6 className="font-medium text-orange-800 mb-1">Areas for Improvement:</h6>
                          <ul className="text-sm text-orange-700 list-disc list-inside">
                            {writingFeedback.improvements.map((improvement, index) => (
                              <li key={index}>{improvement}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {writingFeedback.suggestions && writingFeedback.suggestions.length > 0 && (
                        <div>
                          <h6 className="font-medium text-blue-800 mb-1">Specific Suggestions:</h6>
                          <div className="space-y-1">
                            {writingFeedback.suggestions.map((suggestion, index) => (
                              <div key={index} className="text-sm p-2 bg-blue-50 rounded">
                                <span className={`font-medium ${
                                  suggestion.type === 'grammar' ? 'text-red-700' :
                                  suggestion.type === 'vocabulary' ? 'text-purple-700' :
                                  suggestion.type === 'structure' ? 'text-green-700' :
                                  'text-blue-700'
                                }`}>
                                  {suggestion.type.charAt(0).toUpperCase() + suggestion.type.slice(1)}:
                                </span>
                                <span className="text-gray-700 ml-1">{suggestion.message}</span>
                                {suggestion.suggestion && (
                                  <div className="text-xs text-gray-600 mt-1 italic">
                                    Suggestion: {suggestion.suggestion}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              {/* Speaking Prompt Input - Only show in speaking mode */}
              {currentMode === 'speaking' && (
                <div className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
                  <h4 className="text-lg font-semibold text-indigo-800 mb-3">{translate('aiTutorRoom.customSpeakingPractice', 'Custom Speaking Practice')}</h4>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={speakingPrompt}
                      onChange={(e) => setSpeakingPrompt(e.target.value)}
                      placeholder="e.g., 'Describe your favorite hobby' or 'Tell me about your weekend'"
                      className="flex-1 px-3 py-2 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      onKeyPress={(e) => e.key === 'Enter' && generateSpeakingFromPrompt()}
                    />
                    <button
                      onClick={generateSpeakingFromPrompt}
                      disabled={!speakingPrompt.trim() || isLoading}
                      className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {translate('aiTutorRoom.generate', 'Generate')}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-4 mb-6">
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
                    isRecording 
                      ? 'bg-red-500 text-white hover:bg-red-600' 
                      : 'bg-indigo-500 text-white hover:bg-indigo-600'
                  }`}
                >
                  {isRecording ? <MicOff className="w-5 h-5 mr-2" /> : <Mic className="w-5 h-5 mr-2" />}
                  {isRecording ? translate('aiTutorRoom.stopRecording', 'Stop Recording') : translate('aiTutorRoom.startRecording', 'Start Recording')}
                </button>

                {aiResponse && (
                  <button
                    onClick={toggleAudio}
                    className="flex items-center px-6 py-3 rounded-lg font-medium bg-green-500 text-white hover:bg-green-600 transition-colors"
                  >
                    {isPlaying ? <Pause className="w-5 h-5 mr-2" /> : <Volume2 className="w-5 h-5 mr-2" />}
                    {isPlaying ? translate('aiTutorRoom.pause', 'Pause') : translate('aiTutorRoom.listen', 'Listen')}
                  </button>
                )}

                {(isLoading || isAnalyzing) && (
                  <div className="flex items-center text-gray-600">
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {isAnalyzing ? 'Analyzing pronunciation...' : translate('aiTutorRoom.processing', 'Processing...')}
                  </div>
                )}
              </div>

              {/* Real-time Transcript Display with Animation */}
              {currentTranscript && (
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg shadow-sm">
                  <div className="flex items-center mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                    <Mic className="w-4 h-4 mr-2 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">{translate('aiTutorRoom.liveSpeech', 'Live Speech:')}</span>
                  </div>
                  <p className="text-gray-700 italic leading-relaxed">"{currentTranscript}"</p>
                  {isRecording && (
                    <div className="mt-2 flex items-center text-sm text-blue-600">
                      <div className="w-1 h-1 bg-blue-500 rounded-full animate-ping mr-1"></div>
                      <div className="w-1 h-1 bg-blue-500 rounded-full animate-ping mr-1" style={{animationDelay: '0.2s'}}></div>
                      <div className="w-1 h-1 bg-blue-500 rounded-full animate-ping mr-2" style={{animationDelay: '0.4s'}}></div>
                      {translate('aiTutorRoom.listening', 'Listening...')}
                    </div>
                  )}
                </div>
              )}

              {/* Conversation History */}
              <div className="max-h-64 overflow-y-auto space-y-3">
                {conversationHistory.slice(0, -1).map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        message.type === 'user'
                          ? 'bg-indigo-500 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {message.type === 'ai' ? (
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown
                            components={{
                              h1: ({children}) => <h1 className="text-sm font-bold mb-1">{children}</h1>,
                              h2: ({children}) => <h2 className="text-sm font-semibold mb-1">{children}</h2>,
                              h3: ({children}) => <h3 className="text-sm font-semibold mb-1">{children}</h3>,
                              p: ({children}) => <p className="text-xs mb-1">{children}</p>,
                              strong: ({children}) => <strong className="font-semibold">{children}</strong>,
                              em: ({children}) => <em className="italic">{children}</em>,
                              ul: ({children}) => <ul className="list-disc list-inside text-xs space-y-0.5">{children}</ul>,
                              ol: ({children}) => <ol className="list-decimal list-inside text-xs space-y-0.5">{children}</ol>,
                              li: ({children}) => <li className="text-xs">{children}</li>,
                              code: ({children}) => <code className="bg-gray-200 px-1 py-0.5 rounded text-xs font-mono">{children}</code>
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        message.content
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Learning Cards Panel */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{translate('aiTutorRoom.learningActivities', 'Learning Activities')}</h3>
            
            {learningCards.map((card) => (
              <div
                key={card.id}
                onClick={() => handleCardClick(card)}
                className={`bg-white rounded-xl shadow-lg p-4 cursor-pointer transition-all duration-300 hover:shadow-xl ${
                  card.isActive ? 'ring-2 ring-indigo-500 bg-indigo-50' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg ${getModeColor(card.type)} flex items-center justify-center text-white`}>
                      {getModeIcon(card.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold text-gray-800">{translate(`aiTutorRoom.learningCards.${card.type}.title`, card.title)}</h4>
                        {card.difficulty && (
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            card.difficulty === 'beginner' ? 'bg-green-100 text-green-700' :
                            card.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {translate(`aiTutorRoom.difficultyLabels.${card.difficulty}`, card.difficulty)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{translate(`aiTutorRoom.learningCards.${card.type}.description`, card.description)}</p>
                      
                      {/* Speaking Prompt Preview */}
                      {card.type === 'speaking' && card.speakingPrompt && (
                        <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
                          <strong>{translate('aiTutorRoom.learningCards.speaking.tryPrompt', 'Try:')}</strong> {card.speakingPrompt}
                        </div>
                      )}
                      
                      {/* Expected Phrases */}
                      {card.type === 'speaking' && card.expectedPhrases && Array.isArray(card.expectedPhrases) && card.expectedPhrases.length > 0 && (
                        <div className="mt-2">
                          <div className="text-xs text-gray-500 mb-1">{translate('aiTutorRoom.learningCards.speaking.keyPhrases', 'Key phrases:')}</div>
                          <div className="flex flex-wrap gap-1">
                            {card.expectedPhrases.map((phrase, index) => (
                              <span key={index} className="px-2 py-1 bg-gray-200 text-xs rounded">
                                {phrase}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  {card.isActive && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                </div>
                
                {card.progress !== undefined && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                      <span>{translate(`aiTutorRoom.learningCards.${card.type}.progress`, 'Progress')}</span>
                      <span>{card.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${getModeColor(card.type)}`}
                        style={{ width: `${card.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Progress Summary */}
            <div className="bg-white rounded-xl shadow-lg p-4 mt-6">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                {translate('aiTutorRoom.learningProgress', 'Learning Progress')}
              </h4>
              <div className="space-y-2">
                {learningCards.map((card) => (
                  <div key={card.id} className="flex items-center justify-between text-sm">
                    <span className="capitalize text-gray-600">{translate(`aiTutorRoom.progressLabels.${card.type}`, card.type)}</span>
                    <span className="font-medium">{card.progress || 0}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onEnded={() => setIsPlaying(false)}
        className="hidden"
      />
    </div>
  )
}

export default AITutorRoom
