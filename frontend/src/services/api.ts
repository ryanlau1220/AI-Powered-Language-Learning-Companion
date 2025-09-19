import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const apiService = {
  // Health check
  health: () => api.get('/health'),

  // User management
  registerUser: (userData: any) => api.post('/user/register', userData),
  getUser: (userId: string) => api.get(`/user/profile?userId=${userId}`),
  updateUser: (userId: string, userData: any) => api.put('/user/profile', { userId, ...userData }),
  getUserProgress: (userId: string) => api.get(`/user/progress?userId=${userId}`),

  // Conversation management
  startConversation: (conversationData: any) => api.post('/conversation/start', conversationData),
  sendMessage: (messageData: any) => api.post('/conversation/message', messageData),
  getConversation: (conversationId: string) => api.get(`/conversation/${conversationId}`),
  getUserConversations: (userId: string, limit = 10, offset = 0) => 
    api.get(`/conversation?userId=${userId}&limit=${limit}&offset=${offset}`),

  // Speech services
  transcribeAudio: (audioData: any) => api.post('/speech/transcribe', audioData),
  synthesizeSpeech: (textData: any) => api.post('/speech/synthesize', textData),
  getPronunciationFeedback: (feedbackData: any) => api.post('/speech/pronunciation-feedback', feedbackData),
};

export default api;
