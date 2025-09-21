import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://zkr9kgcmpu.ap-southeast-1.awsapprunner.com';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Simple response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// API endpoints
export const apiService = {
  // Health check
  health: () => api.get('/health'),

  // User management (simplified - no authentication required)

  // Conversation management
  startConversation: (conversationData: any) => api.post('/api/conversation/start', conversationData),
  sendMessage: (messageData: any) => api.post('/api/conversation/message', messageData),
  getConversation: (conversationId: string) => api.get(`/api/conversation/${conversationId}`),
  getUserConversations: (userId: string, limit = 10, offset = 0) => 
    api.get(`/api/conversation?userId=${userId}&limit=${limit}&offset=${offset}`),

  // Speech services
  transcribeAudio: (audioData: any) => api.post('/api/speech/transcribe', audioData, { timeout: 60000 }), // 60 seconds for transcription
  synthesizeSpeech: (textData: any) => api.post('/api/speech/synthesize', textData),
  getPronunciationFeedback: (feedbackData: any) => api.post('/api/speech/pronunciation-feedback', feedbackData),
  analyzePronunciation: (pronunciationData: any) => api.post('/api/speech/analyze-pronunciation', pronunciationData, { timeout: 60000 }), // 60 seconds for pronunciation analysis


  // Reading services
  analyzeContent: (formData: FormData) => api.post('/api/reading/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000 // 60 seconds for file processing
  }),
  generateReadingContent: (contentData: any) => api.post('/api/reading/content', contentData),
  generateFlashcards: (flashcardData: any) => api.post('/api/reading/flashcards', flashcardData),
  generateQuiz: (quizData: any) => api.post('/api/reading/quiz', quizData),
  answerQuestion: (questionData: any) => api.post('/api/reading/answer', questionData),

  // Language services
  detectLanguage: (languageData: any) => api.post('/api/language/detect', languageData),
  batchDetectLanguages: (languageData: any) => api.post('/api/language/batch-detect', languageData),
  getSupportedLanguages: () => api.get('/api/language/supported'),
  getUserLanguagePreferences: (userId: string) => api.get(`/api/language/preferences/${userId}`),
  updateUserLanguagePreferences: (userId: string, preferences: any) => api.put(`/api/language/preferences/${userId}`, preferences),
  analyzeSentiment: (sentimentData: any) => api.post('/api/language/sentiment', sentimentData),

  // Translation services
  translateText: (data: { text: string; targetLanguage: 'en' | 'zh'; sourceLanguage?: 'en' | 'zh' | 'auto' }) => 
    api.post('/api/language/translate', data),

  // Progress services (simplified - no user tracking required)
};

export default api;
