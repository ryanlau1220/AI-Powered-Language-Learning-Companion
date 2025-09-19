const Joi = require('joi');

// Lambda-compatible validation functions
const validateConversationRequest = (data) => {
  const schema = Joi.object({
    scenario: Joi.string().valid('restaurant', 'shopping', 'directions', 'general').required(),
    language: Joi.string().valid('en-US', 'es-ES', 'fr-FR', 'de-DE', 'it-IT', 'pt-PT', 'ja-JP', 'ko-KR', 'zh-CN').required(),
    proficiencyLevel: Joi.string().valid('beginner', 'intermediate', 'advanced').required()
  });

  return schema.validate(data);
};

const validateUserRequest = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    name: Joi.string().min(2).required(),
    nativeLanguage: Joi.string().valid('en-US', 'es-ES', 'fr-FR', 'de-DE', 'it-IT', 'pt-PT', 'ja-JP', 'ko-KR', 'zh-CN').required(),
    targetLanguage: Joi.string().valid('en-US', 'es-ES', 'fr-FR', 'de-DE', 'it-IT', 'pt-PT', 'ja-JP', 'ko-KR', 'zh-CN').required(),
    proficiencyLevel: Joi.string().valid('beginner', 'intermediate', 'advanced').required()
  });

  return schema.validate(data);
};

const validateMessageRequest = (data) => {
  const schema = Joi.object({
    conversationId: Joi.string().required(),
    message: Joi.string().min(1).required(),
    audioData: Joi.string().optional()
  });

  return schema.validate(data);
};

module.exports = {
  validateConversationRequest,
  validateUserRequest,
  validateMessageRequest
};
