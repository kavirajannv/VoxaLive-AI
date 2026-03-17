const express = require('express');
const User = require('../models/User');
const firebaseAuth = require('../middleware/firebaseAuth');

const router = express.Router();

/**
 * POST /api/auth/firebase
 * Called after Firebase login — syncs user profile to MongoDB.
 * Expects: { idToken, name?, language?, photoURL? }
 */
router.post('/firebase', async (req, res) => {
  try {
    const admin = require('firebase-admin');
    const { idToken, name, language, photoURL } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: 'idToken is required' });
    }

    let decoded;
    try {
      decoded = await admin.auth().verifyIdToken(idToken);
    } catch {
      return res.status(401).json({ error: 'Invalid Firebase token' });
    }

    const provider = decoded.firebase?.sign_in_provider === 'google.com' ? 'google' : 'email';
    const displayName = name || decoded.name || decoded.email?.split('@')[0] || 'User';
    const photo = photoURL || decoded.picture || '';

    // Upsert by firebaseUid
    let user = await User.findOneAndUpdate(
      { firebaseUid: decoded.uid },
      {
        $set: {
          firebaseUid: decoded.uid,
          email: decoded.email,
          name: displayName,
          photoURL: photo,
          provider
        },
        $setOnInsert: { language: language || 'en' }
      },
      { upsert: true, new: true, runValidators: false }
    );

    // Update language if explicitly provided
    if (language && user.language !== language) {
      user.language = language;
      await user.save();
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        language: user.language,
        photoURL: user.photoURL,
        provider: user.provider
      }
    });
  } catch (error) {
    console.error('Firebase auth sync error:', error);
    res.status(500).json({ error: 'Authentication sync failed' });
  }
});

/**
 * GET /api/auth/me
 * Returns the authenticated user's profile.
 */
router.get('/me', firebaseAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        language: user.language,
        photoURL: user.photoURL,
        provider: user.provider
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

/**
 * PATCH /api/auth/language
 * Update user's preferred language.
 */
router.patch('/language', firebaseAuth, async (req, res) => {
  try {
    const { language } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { language },
      { new: true }
    ).select('-password');
    res.json({ user: { id: user._id, name: user.name, email: user.email, language: user.language } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update language' });
  }
});

module.exports = router;
