// User types
export interface User {
  userId: string;
  email: string;
  name: string;
  nativeLanguage: string;
  targetLanguages: string[];
  proficiencyLevels: Record<string, string>;
  interests: string[];
  learningGoals: string[];
  createdAt: string;
  lastActive: string;
  isActive: boolean;
  preferences: UserPreferences;
  progress: UserProgress;
}

export interface UserPreferences {
  voiceId: string;
  speakingSpeed: 'slow' | 'normal' | 'fast';
  feedbackLevel: 'minimal' | 'moderate' | 'detailed';
  scenarioPreferences: string[];
}

export interface UserProgress {
  totalConversations: number;
  totalMessages: number;
  averagePronunciationScore: number;
  averageGrammarScore: number;
  learningStreak: number;
  lastLearningDate: string | null;
}

// Conversation types
export interface Conversation {
  conversationId: string;
  userId: string;
  scenario: string;
  language: string;
  proficiencyLevel: string;
  status: 'active' | 'ended';
  createdAt: string;
  updatedAt: string;
  messages: Message[];
  metadata: ConversationMetadata;
}

export interface Message {
  messageId: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: string;
  audioData?: string;
  metadata?: MessageMetadata;
}

export interface MessageMetadata {
  confidence?: number;
  sentiment?: string;
  pronunciationScore?: number;
  grammarScore?: number;
  grammarSuggestions?: string[];
  pronunciationTips?: string[];
}

export interface ConversationMetadata {
  totalMessages: number;
  averageResponseTime: number;
  pronunciationScore: number;
  grammarScore: number;
  lastActivity: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string[];
}

// Speech types
export interface TranscriptionResult {
  transcriptionId: string;
  text: string;
  confidence: number;
  alternatives: string[];
  languageCode: string;
}

export interface SynthesisResult {
  audioData: string;
  format: string;
  voiceId: string;
  languageCode: string;
}

export interface PronunciationFeedback {
  transcription: string;
  expectedText: string;
  feedback: PronunciationAnalysis;
  pronunciationScore: number;
  wordLevelFeedback: WordLevelFeedback[];
  phonemeLevelFeedback: PhonemeLevelFeedback[];
}

export interface PronunciationAnalysis {
  overallScore: number;
  wordLevelFeedback: WordLevelFeedback[];
  phonemeLevelFeedback: PhonemeLevelFeedback[];
  suggestions: PronunciationSuggestion[];
}

export interface WordLevelFeedback {
  word: string;
  transcribed: string;
  correct: boolean;
  confidence: number;
}

export interface PhonemeLevelFeedback {
  phoneme: string;
  correct: boolean;
  confidence: number;
}

export interface PronunciationSuggestion {
  word: string;
  issue: string;
  tip: string;
}

// Scenario types
export interface Scenario {
  id: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  language: string;
  estimatedDuration: number;
}

// Language types
export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

// Voice types
export interface Voice {
  id: string;
  name: string;
  language: string;
  gender: 'male' | 'female';
  neural: boolean;
}
