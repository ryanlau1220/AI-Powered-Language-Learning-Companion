const Joi = require('joi');

const validateUserRegistration = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    username: Joi.string().min(2).max(100).required(),
    password: Joi.string().min(6).required(),
    nativeLanguage: Joi.string().length(2).optional(),
    targetLanguages: Joi.array().items(Joi.string().length(2)).min(1).optional(),
    proficiencyLevels: Joi.object().pattern(
      Joi.string().length(2),
      Joi.string().valid('beginner', 'intermediate', 'advanced')
    ).optional(),
    interests: Joi.array().items(Joi.string()).optional(),
    learningGoals: Joi.array().items(Joi.string()).optional(),
    preferences: Joi.object({
      voiceId: Joi.string().optional(),
      speakingSpeed: Joi.string().valid('slow', 'normal', 'fast').optional(),
      feedbackLevel: Joi.string().valid('minimal', 'moderate', 'detailed').optional(),
      scenarioPreferences: Joi.array().items(Joi.string()).optional()
    }).optional()
  });

  const { error } = schema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: error.details.map(detail => detail.message)
    });
  }

  next();
};

const validateUserUpdate = (req, res, next) => {
  const schema = Joi.object({
    userId: Joi.string().required(),
    name: Joi.string().min(2).max(100).optional(),
    nativeLanguage: Joi.string().length(2).optional(),
    targetLanguages: Joi.array().items(Joi.string().length(2)).min(1).optional(),
    proficiencyLevels: Joi.object().pattern(
      Joi.string().length(2),
      Joi.string().valid('beginner', 'intermediate', 'advanced')
    ).optional(),
    interests: Joi.array().items(Joi.string()).optional(),
    learningGoals: Joi.array().items(Joi.string()).optional(),
    preferences: Joi.object({
      voiceId: Joi.string().optional(),
      speakingSpeed: Joi.string().valid('slow', 'normal', 'fast').optional(),
      feedbackLevel: Joi.string().valid('minimal', 'moderate', 'detailed').optional(),
      scenarioPreferences: Joi.array().items(Joi.string()).optional()
    }).optional()
  });

  const { error } = schema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: error.details.map(detail => detail.message)
    });
  }

  next();
};

const validateConversationRequest = (req, res, next) => {
  const schema = Joi.object({
    scenario: Joi.string().valid(
      'general', 'restaurant', 'shopping', 'directions', 
      'hotel', 'airport', 'hospital', 'school', 'work'
    ).optional(),
    language: Joi.string().length(2).optional(),
    proficiencyLevel: Joi.string().valid('beginner', 'intermediate', 'advanced').optional()
  });

  const { error } = schema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: error.details.map(detail => detail.message)
    });
  }

  next();
};

const validateMessageRequest = (req, res, next) => {
  const schema = Joi.object({
    conversationId: Joi.string().required(),
    message: Joi.string().min(1).max(1000).optional(),
    audioData: Joi.string().optional()
  });

  const { error } = schema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: error.details.map(detail => detail.message)
    });
  }

  next();
};

const validateSpeechRequest = (req, res, next) => {
  const schema = Joi.object({
    audioData: Joi.string().required(),
    languageCode: Joi.string().length(5).optional(), // e.g., 'en-US'
    text: Joi.string().optional(),
    voiceId: Joi.string().optional()
  });

  const { error } = schema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: error.details.map(detail => detail.message)
    });
  }

  next();
};

const validateLanguageDetection = (req, res, next) => {
  const schema = Joi.object({
    text: Joi.string().min(3).max(5000).required(),
    userId: Joi.string().optional()
  });

  const { error } = schema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: error.details.map(detail => detail.message)
    });
  }

  next();
};

const validateWritingRequest = (req, res, next) => {
  const schema = Joi.object({
    text: Joi.string().min(1).max(5000).required(),
    language: Joi.string().length(2).optional(),
    userId: Joi.string().optional(),
    context: Joi.string().optional()
  });

  const { error } = schema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: error.details.map(detail => detail.message)
    });
  }

  next();
};

const validateReadingRequest = (req, res, next) => {
  const schema = Joi.object({
    level: Joi.string().valid('beginner', 'intermediate', 'advanced').optional(),
    topic: Joi.string().optional(),
    language: Joi.string().length(2).optional(),
    userId: Joi.string().optional()
  });

  const { error } = schema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: error.details.map(detail => detail.message)
    });
  }

  next();
};

module.exports = {
  validateUserRegistration,
  validateUserUpdate,
  validateConversationRequest,
  validateMessageRequest,
  validateSpeechRequest,
  validateLanguageDetection,
  validateWritingRequest,
  validateReadingRequest
};
