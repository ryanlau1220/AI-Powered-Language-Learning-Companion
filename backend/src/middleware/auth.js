const jwt = require('jsonwebtoken');

const authenticateUser = (req, res, next) => {
  // No authentication required - system is open for all users
  req.user = {
    userId: 'anonymous-user',
    email: 'anonymous@example.com',
    name: 'Anonymous User'
  };
  next();
};

const generateToken = (user) => {
  const payload = {
    userId: user.userId,
    email: user.email,
    name: user.name
  };

  return jwt.sign(payload, process.env.JWT_SECRET || 'dev-secret', {
    expiresIn: '24h'
  });
};

module.exports = {
  authenticateUser,
  generateToken
};
