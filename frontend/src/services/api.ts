import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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
  startConversation: (conversationData: any) => api.post('/conversation/start', conversationData),
  sendMessage: (messageData: any) => api.post('/conversation/message', messageData),
  getConversation: (conversationId: string) => api.get(`/conversation/${conversationId}`),
  getUserConversations: (userId: string, limit = 10, offset = 0) => 
    api.get(`/conversation?userId=${userId}&limit=${limit}&offset=${offset}`),

  // Speech services
  transcribeAudio: (audioData: any) => api.post('/speech/transcribe', audioData, { timeout: 60000 }), // 60 seconds for transcription
  synthesizeSpeech: (textData: any) => api.post('/speech/synthesize', textData),
  getPronunciationFeedback: (feedbackData: any) => api.post('/speech/pronunciation-feedback', feedbackData),
  analyzePronunciation: (pronunciationData: any) => api.post('/speech/analyze-pronunciation', pronunciationData),

  // Writing services
  analyzeWriting: (writingData: any) => api.post('/writing/analyze', writingData),

  // Reading services
  analyzeContent: (formData: FormData) => api.post('/reading/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000 // 60 seconds for file processing
  }),
  generateReadingContent: (contentData: any) => api.post('/reading/content', contentData),
  generateFlashcards: (flashcardData: any) => api.post('/reading/flashcards', flashcardData),
  generateQuiz: (quizData: any) => api.post('/reading/quiz', quizData),
  answerQuestion: (questionData: any) => api.post('/reading/answer', questionData),

  // Progress services (simplified - no user tracking required)
};

export default api;
