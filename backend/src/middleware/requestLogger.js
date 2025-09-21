const winston = require('winston');

// Configure logger with cleaner output
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
      return `${timestamp} [${level}] ${message} ${metaStr}`;
    })
  ),
  transports: [
    new winston.transports.Console()
  ]
});

const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Only log important requests in development
  if (process.env.NODE_ENV === 'development' && !req.url.includes('/health')) {
    logger.info(`-> ${req.method} ${req.url}`);
  }

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - start;
    
    // Only log errors and slow requests
    if (res.statusCode >= 400 || duration > 1000) {
      logger.warn(`<- ${req.method} ${req.url} ${res.statusCode} (${duration}ms)`);
    }

    originalEnd.call(this, chunk, encoding);
  };

  next();
};

module.exports = { requestLogger };
