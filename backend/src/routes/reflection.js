import express from 'express';
import prisma from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import reflectionService from '../services/reflectionService.js';
import createLogger from '../utils/logger.js';

const router = express.Router();
const logger = createLogger('reflection');

// Create reflection for user's artwork
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user's artwork
    const artwork = await prisma.artwork.findFirst({
      where: { userId },
      include: { reflection: true }
    });

    if (!artwork) {
      return res.status(404).json({ 
        error: 'No artwork found. Please create an artwork first.' 
      });
    }

    // MILESTONE 1 CONSTRAINT: Check if reflection already exists
    if (artwork.reflection) {
      return res.status(409).json({ 
        error: 'Reflection already exists for this artwork. Only one reflection allowed in Milestone 1.' 
      });
    }

    // Generate reflection using mock service
    const reflectionData = await reflectionService.generateInitialReflection(artwork);

    // Create reflection in database
    const reflection = await prisma.reflection.create({
      data: {
        artworkId: artwork.id,
        content: reflectionData.content,
        type: reflectionData.type
      },
      include: {
        artwork: {
          select: {
            id: true,
            title: true,
            description: true,
            imageUrl: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    // Log successful reflection creation
    logger.info('Reflection created successfully', {
      userId,
      artworkId: artwork.id,
      reflectionId: reflection.id,
      reflectionType: reflection.type
    });

    res.status(201).json({
      reflection: {
        id: reflection.id,
        content: reflection.content,
        type: reflection.type,
        createdAt: reflection.createdAt,
        artwork: reflection.artwork
      }
    });

  } catch (error) {
    logger.error('Reflection creation failed', { 
      userId: req.user.userId, 
      error: error.message 
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's reflection
router.get('/mine', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user's artwork with reflection
    const artwork = await prisma.artwork.findFirst({
      where: { userId },
      include: {
        reflection: true,
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
      return res.status(404).json({ 
        error: 'No artwork found for this user' 
      });
    }

    if (!artwork.reflection) {
      return res.status(404).json({ 
        error: 'No reflection found. Please generate a reflection first.' 
      });
    }

    res.json({
      reflection: {
        id: artwork.reflection.id,
        content: artwork.reflection.content,
        type: artwork.reflection.type,
        createdAt: artwork.reflection.createdAt,
        artwork: {
          id: artwork.id,
          title: artwork.title,
          description: artwork.description,
          imageUrl: artwork.imageUrl,
          user: artwork.user
        }
      }
    });

  } catch (error) {
    logger.error('Get reflection failed', { 
      userId: req.user.userId, 
      error: error.message 
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;