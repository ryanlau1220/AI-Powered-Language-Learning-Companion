const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const conversationRoutes = require('./handlers/conversation');
const speechRoutes = require('./handlers/speech');
const userRoutes = require('./handlers/user');
const { errorHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/requestLogger');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    region: process.env.REGION || 'ap-southeast-5'
  });
});

// Routes
app.use('/conversation', conversationRoutes);
app.use('/speech', speechRoutes);
app.use('/user', userRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl 
  });
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`AWS Region: ${process.env.REGION || 'ap-southeast-5'}`);
  });
}

module.exports = app;
