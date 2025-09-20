const express = require('express');
const router = express.Router();
const userService = require('../services/userService');
const { validateUserRegistration, validateUserUpdate } = require('../middleware/validation');

// Register new user
router.post('/register', validateUserRegistration, async (req, res) => {
  try {
    console.log('Registration request received:', req.body);
    const userData = req.body;
    
    console.log('Calling userService.createUser with:', userData);
    const user = await userService.createUser(userData);
    console.log('User created successfully:', user);
    
    res.status(201).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error creating user:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Failed to create user',
      details: error.message
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }
    
    const result = await userService.loginUser({ email, password });
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(401).json({
      success: false,
      error: error.message || 'Login failed'
    });
  }
});

// Get user profile
router.get('/profile', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }
    
    const user = await userService.getUser(userId);
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user'
    });
  }
});

// Update user profile
router.put('/profile', validateUserUpdate, async (req, res) => {
  try {
    const { userId, ...updateData } = req.body;
    
    const user = await userService.updateUser(userId, updateData);
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user'
    });
  }
});

// Get user learning progress
router.get('/progress', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }
    
    const progress = await userService.getUserProgress(userId);
    
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

module.exports = router;
