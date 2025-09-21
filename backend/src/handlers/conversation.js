const express = require('express');
const router = express.Router();
const conversationService = require('../services/conversationService');
const { validateConversationRequest } = require('../middleware/validation');
const { authenticateUser } = require('../middleware/auth');

// Start a new conversation
router.post('/start', async (req, res) => {
  try {
    const { scenario, language, proficiencyLevel } = req.body;
    const userId = req.user?.userId || 'anonymous';
    
    const conversation = await conversationService.startConversation({
      userId,
      scenario,
      language,
      proficiencyLevel
    });
    
    res.status(201).json({
      success: true,
      data: conversation
    });
  } catch (error) {
    console.error('Error starting conversation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start conversation'
    });
  }
});

// Send message in conversation
router.post('/message', async (req, res) => {
  try {
    const { conversationId, message, audioData, uiLanguage } = req.body;
    const userId = req.user?.userId || 'anonymous';
    
    const response = await conversationService.processMessage({
      conversationId,
      userId,
      message,
      audioData,
      uiLanguage
    });
    
    res.status(200).json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Error processing message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process message'
    });
  }
});

// Get conversation history
router.get('/:conversationId', authenticateUser, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.userId;
    
    const conversation = await conversationService.getConversation(conversationId, userId);
    
    res.status(200).json({
      success: true,
      data: conversation
    });
  } catch (error) {
    console.error('Error getting conversation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get conversation'
    });
  }
});

// Get user's conversation list
router.get('/', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 10, offset = 0 } = req.query;
    
    const conversations = await conversationService.getUserConversations(userId, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.status(200).json({
      success: true,
      data: conversations
    });
  } catch (error) {
    console.error('Error getting conversations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get conversations'
    });
  }
});

module.exports = router;
