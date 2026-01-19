import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
      metaStr = ' ' + JSON.stringify(meta, null, 0);
    }
    return `${timestamp} [${level}] ${message}${metaStr}`;
  })
);

// Create Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // Write all logs to app.log
    new winston.transports.File({
      filename: path.join(logsDir, 'app.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // Write error logs to error.log
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

// Helper functions for structured logging
const createLogger = (module) => {
  return {
    info: (message, meta = {}) => {
      logger.info(message, { module, ...meta });
    },
    
    warn: (message, meta = {}) => {
      logger.warn(message, { module, ...meta });
    },
    
    error: (message, meta = {}) => {
      logger.error(message, { module, ...meta });
    },
    
    // Special methods for common events
    userSignup: (userId, email, authProvider = 'email') => {
      logger.info('User signed up', {
        module,
        event: 'user_signup',
        userId,
        email,
        authProvider,
        timestamp: new Date().toISOString()
      });
    },
    
    userLogin: (userId, email, authProvider = 'email') => {
      logger.info('User logged in', {
        module,
        event: 'user_login',
        userId,
        email,
        authProvider,
        timestamp: new Date().toISOString()
      });
    },
    
    artworkUpload: (userId, artworkId, hasImage, fileSize = null) => {
      logger.info('Artwork uploaded successfully', {
        module,
        event: 'artwork_upload_success',
        userId,
        artworkId,
        hasImage,
        fileSize,
        timestamp: new Date().toISOString()
      });
    },
    
    artworkUploadFailed: (userId, error, fileSize = null) => {
      logger.error('Artwork upload failed', {
        module,
        event: 'artwork_upload_failed',
        userId,
        error: error.message,
        fileSize,
        timestamp: new Date().toISOString()
      });
    },
    
    s3Error: (operation, error, userId = null) => {
      logger.error('S3 operation failed', {
        module,
        event: 's3_error',
        operation,
        error: error.message,
        userId,
        timestamp: new Date().toISOString()
      });
    },
    
    serverStartup: (port, s3Status) => {
      logger.info('Server started successfully', {
        module,
        event: 'server_startup',
        port,
        s3Status,
        timestamp: new Date().toISOString()
      });
    },
    
    serverError: (error, context = {}) => {
      logger.error('Unexpected server error', {
        module,
        event: 'server_error',
        error: error.message,
        stack: error.stack,
        ...context,
        timestamp: new Date().toISOString()
      });
    }
  };
};

export default createLogger;