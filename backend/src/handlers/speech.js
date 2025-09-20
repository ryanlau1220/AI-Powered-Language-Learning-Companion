const express = require('express');
const router = express.Router();
const speechService = require('../services/speechService');
const { authenticateUser } = require('../middleware/auth');

// Convert speech to text
router.post('/transcribe', authenticateUser, async (req, res) => {
  try {
    const { audioData, languageCode } = req.body;
    const userId = req.user.userId;
    
    const transcription = await speechService.transcribeAudio({
      audioData,
      languageCode,
      userId
    });
    
    res.status(200).json({
      success: true,
      data: transcription
    });
  } catch (error) {
    console.error('Error transcribing audio:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to transcribe audio'
    });
  }
});

// Convert text to speech
router.post('/synthesize', authenticateUser, async (req, res) => {
  try {
    const { text, voiceId, languageCode } = req.body;
    const userId = req.user.userId;
    
    console.log('Speech synthesis request body:', req.body);
    console.log('Text parameter:', text);
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Text is required for speech synthesis'
      });
    }
    
    const audioData = await speechService.synthesizeSpeech({
      text,
      voiceId,
      languageCode,
      userId
    });
    
    res.status(200).json({
      success: true,
      data: { audioData }
    });
  } catch (error) {
    console.error('Error synthesizing speech:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to synthesize speech'
    });
  }
});

// Get pronunciation feedback
router.post('/pronunciation-feedback', authenticateUser, async (req, res) => {
  try {
    const { audioData, text, languageCode } = req.body;
    const userId = req.user.userId;
    
    const feedback = await speechService.getPronunciationFeedback({
      audioData,
      text,
      languageCode,
      userId
    });
    
    res.status(200).json({
      success: true,
      data: feedback
    });
  } catch (error) {
    console.error('Error getting pronunciation feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get pronunciation feedback'
    });
  }
});

// Analyze pronunciation with detailed feedback
router.post('/analyze-pronunciation', authenticateUser, async (req, res) => {
  try {
    const { audioData, text, language } = req.body;
    const userId = req.user.userId;
    
    const analysis = await speechService.analyzePronunciation({
      audioData,
      text,
      language,
      userId
    });
    
    res.status(200).json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Error analyzing pronunciation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze pronunciation'
    });
  }
});

module.exports = router;
