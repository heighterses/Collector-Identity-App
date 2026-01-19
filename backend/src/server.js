import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import artworkRoutes from './routes/artwork.js';
import reflectionRoutes from './routes/reflection.js';
import s3Service from './services/s3Service.js';
import createLogger from './utils/logger.js';

// Load environment variables
dotenv.config();

// Initialize logger
const logger = createLogger('server');

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/artwork', artworkRoutes);
app.use('/api/reflection', reflectionRoutes);

// Serve images from S3 via backend (proxy route)
app.get('/api/images/:objectKey(*)', async (req, res) => {
  try {
    const objectKey = req.params.objectKey;
    
    if (!objectKey) {
      logger.warn('Image request missing object key', { objectKey });
      return res.status(400).json({ error: 'Object key is required' });
    }

    // Generate signed URL for the image
    const signedUrl = await s3Service.getSignedUrl(objectKey);
    
    // Redirect to signed URL
    res.redirect(signedUrl);
  } catch (error) {
    logger.error('Image serving failed', { 
      objectKey: req.params.objectKey, 
      error: error.message 
    });
    res.status(404).json({ error: 'Image not found' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Collector Identity API is running' });
});

// Global error handler
app.use((error, req, res, next) => {
  logger.serverError(error, {
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent')
  });
  
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// Start server with S3 initialization
const startServer = async () => {
  let s3Status = 'unavailable';
  
  try {
    // Try to initialize S3 service (create bucket if needed)
    try {
      await s3Service.initialize();
      s3Status = 'connected';
      logger.info('S3 service initialized successfully');
    } catch (s3Error) {
      logger.warn('S3 service initialization failed', { 
        error: s3Error.message,
        endpoint: process.env.S3_ENDPOINT 
      });
      s3Status = 'failed';
    }
    
    app.listen(PORT, () => {
      logger.serverStartup(PORT, s3Status);
    });
  } catch (error) {
    logger.serverError(error, { context: 'server_startup' });
    process.exit(1);
  }
};

startServer();

export default app;