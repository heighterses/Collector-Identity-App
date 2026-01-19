import express from 'express';
import multer from 'multer';
import path from 'path';
import prisma from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import s3Service from '../services/s3Service.js';
import createLogger from '../utils/logger.js';

const router = express.Router();
const logger = createLogger('artwork');

// Configure multer for memory storage (we'll upload to S3, not disk)
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Create artwork endpoint - ONE per user for Milestone 1
router.post('/', authenticateToken, upload.single('imageFile'), async (req, res) => {
  try {
    const { title, description } = req.body;
    const userId = req.user.userId;
    const imageFile = req.file;

    // Validate input
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    // Must have either description OR imageFile (or both)
    const hasDescription = description && description.trim();
    const hasImage = imageFile !== null;

    if (!hasDescription && !hasImage) {
      return res.status(400).json({ 
        error: 'Either description or image file is required' 
      });
    }

    // MILESTONE 1 CONSTRAINT: Check if user already has an artwork
    const existingArtwork = await prisma.artwork.findFirst({
      where: { userId }
    });

    if (existingArtwork) {
      return res.status(409).json({ 
        error: 'User already has an artwork. Only one artwork allowed in Milestone 1.' 
      });
    }

    // Upload image to S3 if provided
    let imageUrl = null;
    let s3ObjectKey = null;
    
    if (hasImage) {
      try {
        const uploadResult = await s3Service.uploadFile(
          imageFile.buffer,
          imageFile.originalname,
          imageFile.mimetype,
          userId
        );
        
        s3ObjectKey = uploadResult.objectKey;
        // Store the backend API URL that will serve the image
        imageUrl = `/api/images/${s3ObjectKey}`;
        
        logger.info('Image uploaded to S3 successfully', {
          userId,
          objectKey: s3ObjectKey,
          fileSize: imageFile.size,
          mimeType: imageFile.mimetype
        });
      } catch (uploadError) {
        logger.s3Error('upload', uploadError, userId);
        
        // Check if it's a connection error (MinIO not running)
        if (uploadError.message.includes('ECONNREFUSED') || uploadError.message.includes('connect')) {
          return res.status(503).json({ 
            error: 'Image storage service is unavailable. Please ensure MinIO is running and try again.' 
          });
        }
        
        logger.artworkUploadFailed(userId, uploadError, imageFile?.size);
        return res.status(500).json({ 
          error: 'Failed to upload image. Please try again.' 
        });
      }
    }

    // Create artwork data
    const artworkData = {
      userId,
      title: title.trim(),
      description: hasDescription ? description.trim() : null,
      imageUrl: imageUrl,
      s3ObjectKey: s3ObjectKey // Store S3 object key for future operations
    };

    // Create artwork
    const artwork = await prisma.artwork.create({
      data: artworkData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Log successful artwork creation
    logger.artworkUpload(
      userId, 
      artwork.id, 
      hasImage, 
      imageFile?.size
    );

    res.status(201).json({
      artwork: {
        id: artwork.id,
        title: artwork.title,
        description: artwork.description,
        imageUrl: artwork.imageUrl,
        createdAt: artwork.createdAt,
        user: artwork.user
      }
    });

  } catch (error) {
    logger.error('Artwork creation failed', { 
      userId: req.user.userId, 
      error: error.message 
    });
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size too large. Maximum 10MB allowed.' });
    }
    
    if (error.message === 'Only image files are allowed') {
      return res.status(400).json({ error: 'Only image files are allowed' });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's artwork
router.get('/mine', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const artwork = await prisma.artwork.findFirst({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!artwork) {
      return res.status(404).json({ error: 'No artwork found for this user' });
    }

    res.json({
      artwork: {
        id: artwork.id,
        title: artwork.title,
        description: artwork.description,
        imageUrl: artwork.imageUrl,
        createdAt: artwork.createdAt,
        user: artwork.user
      }
    });

  } catch (error) {
    logger.error('Get artwork failed', { 
      userId: req.user.userId, 
      error: error.message 
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;