/**
 * Translation Service
 * Uses free Google Translate API (unofficial) for translation.
 * For production, replace with Google Cloud Translation API or Azure Translator.
 */

const https = require('https');
const http = require('http');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini if key exists
let genAI = null;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

/**
 * Make an HTTP request with timeout
 */
function requestWithTimeout(url, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (response) => {
      let data = '';
      response.on('data', (chunk) => { data += chunk; });
      response.on('end', () => {
        if (response.statusCode === 200) {
          resolve(data);
        } else {
          reject(new Error(`HTTP status ${response.statusCode}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.setTimeout(timeoutMs, () => {
      req.destroy();
      reject(new Error('Request Timeout'));
    });
  });
}

/**
 * Translate text using Google Translate (free endpoint)
 * @param {string} text - Text to translate
 * @param {string} sourceLang - Source language code (e.g., 'ta', 'en', 'auto')
 * @param {string} targetLang - Target language code (e.g., 'en', 'ta')
 * @returns {Promise<string>} Translated text
 */
async function translate(text, sourceLang = 'auto', targetLang = 'en') {
  if (!text || !text.trim()) {
    return '';
  }

  // If source and target are the same, return as-is
  if (sourceLang === targetLang && sourceLang !== 'auto') {
    return text;
  }

  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      const encodedText = encodeURIComponent(text);
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodedText}`;

      const data = await requestWithTimeout(url, 5000); // 5 second timeout
      const result = JSON.parse(data);

      if (result && result[0]) {
        const translated = result[0]
          .filter(item => item && item[0])
          .map(item => item[0])
          .join('');
        return translated || text;
      } else {
        return text;
      }
    } catch (error) {
      attempts++;
      console.warn(`Translation attempt ${attempts} failed:`, error.message);
      if (attempts >= maxAttempts) {
        console.error('All translation attempts failed. Falling back to original text.');
        return text; // Fallback to original text on repeated failure
      }
      // Small delay before retry
      await new Promise(res => setTimeout(res, 500));
    }
  }
  return text;
}

/**
 * Translates text using an LLM (Gemini) for context-aware, natural translation.
 * Understands slang, corrects speech-to-text artifacts, and sounds human.
 */
async function nlpTranslate(text, sourceLang, targetLang) {
  if (!text || !text.trim()) return '';
  if (sourceLang === targetLang && sourceLang !== 'auto') return text;
  
  if (!genAI) {
    console.warn('GEMINI_API_KEY not found. Falling back to standard translation.');
    return translate(text, sourceLang, targetLang);
  }

  const sourceName = SUPPORTED_LANGUAGES.find(l => l.code === sourceLang)?.name || sourceLang;
  const targetName = SUPPORTED_LANGUAGES.find(l => l.code === targetLang)?.name || targetLang;

  const prompt = `Translate the following conversational text from ${sourceName} to ${targetName}.
This is from a live voice/text chat. The input might have Speech-to-Text errors, slang, idiomatic expressions, or run-on sentences. 
Your goal is to provide a natural, fluent, and emotionally accurate translation in ${targetName} that sounds like how a native speaker would actually talk in a casual conversation.

Rules:
1. ONLY return the translated text. No quotes, no explanations.
2. If the input is broken, infer the context and fix it in the translation.
3. Preserve the original tone (e.g., if it's casual, keep it casual; if excited, keep the exclamation marks).

Text to translate:
"${text}"`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    let translatedText = result.response.text().trim();
    
    // Clean up any potential wrapping quotes the LLM might hallucinate
    if (translatedText.startsWith('"') && translatedText.endsWith('"')) {
      translatedText = translatedText.slice(1, -1).trim();
    }
    
    return translatedText || text;
  } catch (error) {
    console.error('NLP Translation error:', error);
    // Fallback to standard translation
    return translate(text, sourceLang, targetLang);
  }
}

/**
 * Supported languages with their codes and names
 */
const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'ta', name: 'Tamil', flag: '🇮🇳' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'ml', name: 'Malayalam', flag: '🇮🇳' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'te', name: 'Telugu', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', flag: '🇮🇳' },
  { code: 'th', name: 'Thai', flag: '🇹🇭' },
  { code: 'vi', name: 'Vietnamese', flag: '🇻🇳' },
  { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
  { code: 'nl', name: 'Dutch', flag: '🇳🇱' }
];

module.exports = { translate, nlpTranslate, SUPPORTED_LANGUAGES };
