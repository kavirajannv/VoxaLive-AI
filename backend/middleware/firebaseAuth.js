const admin = require('firebase-admin');
const User = require('../models/User');

/**
 * Firebase Auth middleware.
 * Verifies a Firebase ID token from the Authorization header.
 * Upserts the user into MongoDB on first login.
 */
const firebaseAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const idToken = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = await admin.auth().verifyIdToken(idToken);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired Firebase token.' });
    }

    // Find or create user in MongoDB
    let user = await User.findOne({ firebaseUid: decoded.uid });
    if (!user) {
      user = await User.findOne({ email: decoded.email });
      if (user) {
        // Migrate existing user — link their Firebase uid
        user.firebaseUid = decoded.uid;
        user.provider = decoded.firebase?.sign_in_provider === 'google.com' ? 'google' : 'email';
        await user.save();
      }
    }

    if (!user) {
      // Brand new user — create a stub (full profile created via /api/auth/firebase)
      user = await User.create({
        firebaseUid: decoded.uid,
        name: decoded.name || decoded.email?.split('@')[0] || 'User',
        email: decoded.email,
        photoURL: decoded.picture || '',
        provider: decoded.firebase?.sign_in_provider === 'google.com' ? 'google' : 'email',
        language: 'en'
      });
    }

    req.user = {
      id: user._id,
      firebaseUid: decoded.uid,
      name: user.name,
      email: user.email,
      language: user.language,
      photoURL: user.photoURL
    };
    next();
  } catch (error) {
    console.error('Firebase auth middleware error:', error);
    res.status(500).json({ error: 'Authentication error.' });
  }
};

module.exports = firebaseAuth;
