const jwt = require('jsonwebtoken');

const authenticateUser = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // For development, use a simple token validation
    // In production, implement proper JWT validation
    if (process.env.NODE_ENV === 'development') {
      // Mock user for development
      req.user = {
        userId: token || 'dev-user-123',
        email: 'dev@example.com',
        name: 'Development User'
      };
      return next();
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
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
