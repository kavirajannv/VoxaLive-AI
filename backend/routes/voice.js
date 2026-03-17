const express = require('express');
const { translate } = require('../services/translationService');
const auth = require('../middleware/auth');

const router = express.Router();

// Translate text
router.post('/translate', async (req, res) => {
  try {
    const { text, sourceLang, targetLang } = req.body;

    if (!text || !targetLang) {
      return res.status(400).json({ error: 'text and targetLang are required' });
    }

    const translatedText = await translate(text, sourceLang || 'auto', targetLang);
    res.json({ translatedText, sourceLang, targetLang });
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({ error: 'Translation failed' });
  }
});

module.exports = router;
