const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const conversationRoutes = require('./handlers/conversation');
const speechRoutes = require('./handlers/speech');
const readingRoutes = require('./handlers/reading');
const languageRoutes = require('./handlers/language');
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
    region: process.env.REGION || 'ap-southeast-1'
  });
});

// Routes
app.use('/api/conversation', conversationRoutes);
app.use('/api/speech', speechRoutes);
app.use('/api/reading', readingRoutes);
app.use('/api/language', languageRoutes);

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
  const server = app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`AWS Region: ${process.env.AWS_REGION || 'ap-southeast-1'}`);
    console.log(`Bedrock Region: ${process.env.BEDROCK_REGION || 'us-east-1'}`);
    console.log('The frontend is running on http://localhost:3001');
  });

  // Handle server errors
  server.on('error', (error) => {
    console.error('Server error:', error.message);
    process.exit(1);
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error.message);
    process.exit(1);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', reason);
    process.exit(1);
  });
}

module.exports = app;
