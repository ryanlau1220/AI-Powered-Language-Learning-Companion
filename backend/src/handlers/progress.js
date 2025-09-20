const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const userService = require('../services/userService');

// Get user progress
router.get('/', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { timeframe = 'week' } = req.query;

    const progress = await userService.getUserProgress(userId, timeframe);

    res.status(200).json({
      success: true,
      data: progress
    });
  } catch (error) {
    console.error('Error getting user progress:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user progress'
    });
  }
});

// Update user progress
router.post('/update', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { 
      skill, 
      score, 
      timeSpent, 
      sessionType, 
      metadata = {} 
    } = req.body;

    if (!skill || score === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Skill and score are required'
      });
    }

    const updatedProgress = await userService.updateUserProgress(userId, {
      skill,
      score,
      timeSpent: timeSpent || 0,
      sessionType: sessionType || 'practice',
      metadata
    });

    res.status(200).json({
      success: true,
      data: updatedProgress
    });
  } catch (error) {
    console.error('Error updating user progress:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user progress'
    });
  }
});

// Get achievements
router.get('/achievements', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.userId;

    const achievements = await userService.getUserAchievements(userId);

    res.status(200).json({
      success: true,
      data: achievements
    });
  } catch (error) {
    console.error('Error getting achievements:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get achievements'
    });
  }
});

// Get learning statistics
router.get('/stats', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { period = 'week' } = req.query;

    const stats = await userService.getLearningStats(userId, period);

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting learning stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get learning stats'
    });
  }
});

// Get skill breakdown
router.get('/skills', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.userId;

    const skills = await userService.getSkillBreakdown(userId);

    res.status(200).json({
      success: true,
      data: skills
    });
  } catch (error) {
    console.error('Error getting skill breakdown:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get skill breakdown'
    });
  }
});

module.exports = router;
