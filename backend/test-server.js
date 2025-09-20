const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString()
  });
});

// Test user registration
app.post('/user/register', (req, res) => {
  console.log('Registration request received:', req.body);
  res.status(201).json({
    success: true,
    data: {
      userId: 'test-123',
      username: req.body.username,
      email: req.body.email
    }
  });
});

// Test user login
app.post('/user/login', (req, res) => {
  console.log('Login request received:', req.body);
  res.status(200).json({
    success: true,
    data: {
      user: {
        userId: 'test-123',
        username: 'testuser',
        email: req.body.email
      },
      token: 'test-token-123'
    }
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
