import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import prisma from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import createLogger from '../utils/logger.js';

const router = express.Router();
const logger = createLogger('auth');

// Initialize Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Signup endpoint
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user with authProvider = "email"
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        authProvider: 'email'
      }
    });

    // Log successful signup
    logger.userSignup(user.id, user.email, 'email');

    // Return success message WITHOUT logging user in
    // CRITICAL: No JWT token, no auth cookies, no authentication state
    res.status(201).json({
      message: 'Account created. Please sign in.'
    });

  } catch (error) {
    logger.error('Signup failed', { 
      email: req.body.email, 
      error: error.message 
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Log successful login
    logger.userLogin(user.id, user.email, 'email');

    // Return user data (without password) and token
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      token
    });

  } catch (error) {
    logger.error('Login failed', { 
      email: req.body.email, 
      error: error.message 
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Google Sign-In endpoint
router.post('/google', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: 'Google ID token is required' });
    }

    // Verify Google ID token server-side
    const ticket = await googleClient.verifyIdToken({
      idToken: idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const googleId = payload.sub;
    const email = payload.email;
    const name = payload.name;

    if (!email || !googleId) {
      return res.status(400).json({ error: 'Invalid Google token' });
    }

    // Check if user exists by email or googleId
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { googleId: googleId }
        ]
      }
    });

    if (user) {
      // EXISTING USER: Link Google account if not already linked
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { 
            googleId: googleId,
            authProvider: 'google' // Update auth provider to Google
          }
        });
      }
    } else {
      // NEW USER: Create user with Google data
      user = await prisma.user.create({
        data: {
          email: email,
          name: name,
          googleId: googleId,
          authProvider: 'google',
          password: null // No password for Google users
        }
      });
    }

    // Generate JWT token (same as email login)
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Log successful Google login
    logger.userLogin(user.id, user.email, 'google');

    // Return user data and token
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        authProvider: user.authProvider
      },
      token
    });

  } catch (error) {
    logger.error('Google Sign-In failed', { 
      error: error.message 
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        authProvider: true,
        onboardingCompleted: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });

  } catch (error) {
    logger.error('Get user profile failed', { 
      userId: req.user.userId, 
      error: error.message 
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark onboarding as completed
router.post('/complete-onboarding', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { onboardingCompleted: true },
      select: {
        id: true,
        email: true,
        name: true,
        authProvider: true,
        onboardingCompleted: true,
        createdAt: true
      }
    });

    res.json({ user });

  } catch (error) {
    logger.error('Complete onboarding failed', { 
      userId: req.user.userId, 
      error: error.message 
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;