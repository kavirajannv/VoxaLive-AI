/**
 * Speech Service - Web Speech API wrapper
 * Handles Speech-to-Text (STT) via SpeechRecognition
 * and Text-to-Speech (TTS) via SpeechSynthesis
 *
 * Improvements:
 * - Better TTS voice selection (prioritizes exact lang match, then region, then fallback)
 * - Confidence threshold filtering (ignores low-quality results)
 * - Smarter restart logic with backoff on error
 * - voiceschanged event for correct voice loading
 */

// BCP-47 codes for speech APIs
const SPEECH_LANG_MAP = {
  'en': 'en-US', 'ta': 'ta-IN', 'hi': 'hi-IN', 'ml': 'ml-IN',
  'fr': 'fr-FR', 'es': 'es-ES', 'zh': 'zh-CN', 'ja': 'ja-JP',
  'ar': 'ar-SA', 'de': 'de-DE', 'ko': 'ko-KR', 'pt': 'pt-BR',
  'ru': 'ru-RU', 'it': 'it-IT', 'te': 'te-IN', 'bn': 'bn-IN',
  'th': 'th-TH', 'vi': 'vi-VN', 'tr': 'tr-TR', 'nl': 'nl-NL'
}

// Minimum confidence score to accept a speech result (0.0–1.0)
const MIN_CONFIDENCE = 0.45

/**
 * Get the best available synthesis voice for a given language.
 * Priority: exact lang+region → region prefix → any available
 */
function getBestVoice(lang) {
  const voices = window.speechSynthesis.getVoices()
  if (!voices.length) return null
  const bcp47 = SPEECH_LANG_MAP[lang] || lang
  const [primary, region] = bcp47.toLowerCase().split('-')

  // 1. Exact match: en-US === en-US
  const exact = voices.find(v => v.lang.toLowerCase() === bcp47.toLowerCase())
  if (exact) return exact

  // 2. Region match: en-US starts with en-
  const regional = voices.find(v => v.lang.toLowerCase().startsWith(`${primary}-`))
  if (regional) return regional

  // 3. Primary language only: en
  const primary_only = voices.find(v => v.lang.toLowerCase().startsWith(primary))
  if (primary_only) return primary_only

  return null
}

// Pre-load voices (async on some browsers)
let voicesLoaded = false
function ensureVoices() {
  return new Promise((resolve) => {
    const voices = window.speechSynthesis.getVoices()
    if (voices.length > 0) { voicesLoaded = true; resolve(voices); return }
    window.speechSynthesis.onvoiceschanged = () => {
      voicesLoaded = true
      resolve(window.speechSynthesis.getVoices())
    }
    // Timeout fallback — some browsers don't fire the event
    setTimeout(() => resolve(window.speechSynthesis.getVoices()), 1000)
  })
}
// Kick off voice loading eagerly
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  ensureVoices()
}

/**
 * Clean up transcription for more natural output.
 * Removes filler words and repeated words.
 */
export function cleanTranscription(text) {
  if (!text) return ''
  const fillers = ['um', 'uh', 'er', 'ah', 'hmm', 'well', 'basically', 'actually', 'sort of', 'kind of', 'you know', 'i mean', 'like']
  let cleaned = text.trim()
  fillers.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi')
    cleaned = cleaned.replace(regex, '')
  })
  cleaned = cleaned.replace(/\b(\w+)\s+\1\b/gi, '$1')
  cleaned = cleaned.replace(/\s\s+/g, ' ').trim()
  if (cleaned.length > 0) cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
  return cleaned
}

/**
 * Check if speech recognition is supported in this browser.
 */
export function isSpeechRecognitionSupported() {
  return typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
}

/**
 * Create a continuous, auto-restarting speech recognition session.
 *
 * @param {string} lang - Language code (e.g. 'ta', 'en')
 * @param {Function} onInterim - Called on interim (in-progress) text
 * @param {Function} onFinalSentence - Called when a complete sentence is recognized
 * @param {Function} onError - Called on non-recoverable errors
 * @returns {{ recognition, stop }} or null if unsupported
 */
export function createContinuousRecognition(lang, onInterim, onFinalSentence, onError) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SpeechRecognition) {
    onError?.('Speech recognition not supported in this browser')
    return null
  }

  let shouldKeepRunning = true
  let recognition = null
  let restartTimeout = null
  let restartDelay = 150
  const MAX_RESTART_DELAY = 3000

  function createAndStart() {
    recognition = new SpeechRecognition()
    recognition.lang = SPEECH_LANG_MAP[lang] || lang
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 3 // Get multiple alternatives for best-confidence pick

    recognition.onresult = (event) => {
      let interimText = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]

        if (result.isFinal) {
          // Pick the alternative with highest confidence above threshold
          let bestTranscript = ''
          let bestConfidence = 0
          for (let a = 0; a < result.length; a++) {
            const alt = result[a]
            if (alt.confidence > bestConfidence) {
              bestConfidence = alt.confidence
              bestTranscript = alt.transcript
            }
          }

          // Only accept if confidence is above minimum threshold
          if (bestConfidence >= MIN_CONFIDENCE && bestTranscript.trim()) {
            const cleaned = cleanTranscription(bestTranscript)
            if (cleaned) {
              onFinalSentence?.(cleaned)
              restartDelay = 150 // reset delay on success
            }
          } else if (bestTranscript.trim() && bestConfidence === 0) {
            // Some browsers always report 0 confidence — accept if not empty
            const cleaned = cleanTranscription(bestTranscript)
            if (cleaned) onFinalSentence?.(cleaned)
          }
          interimText = ''
        } else {
          interimText += result[0].transcript
          onInterim?.(interimText)
        }
      }
    }

    recognition.onend = () => {
      if (shouldKeepRunning) {
        restartTimeout = setTimeout(() => {
          if (shouldKeepRunning) {
            try { createAndStart() } catch (e) { console.error('Restart error:', e) }
          }
        }, restartDelay)
      }
    }

    recognition.onerror = (event) => {
      // Benign errors: ignore and let onend handle restart
      if (event.error === 'aborted' || event.error === 'no-speech') return

      if (event.error === 'network') {
        restartDelay = Math.min(restartDelay * 2, MAX_RESTART_DELAY)
        if (shouldKeepRunning) {
          restartTimeout = setTimeout(() => {
            if (shouldKeepRunning) createAndStart()
          }, restartDelay)
        }
        return
      }

      if (event.error === 'audio-capture') {
        onError?.('Microphone not available or permission denied')
        shouldKeepRunning = false
        return
      }

      if (event.error === 'not-allowed') {
        onError?.('Microphone permission denied. Please allow microphone access.')
        shouldKeepRunning = false
        return
      }

      // For other errors, try once more before giving up
      if (shouldKeepRunning) {
        restartDelay = Math.min(restartDelay * 2, MAX_RESTART_DELAY)
        restartTimeout = setTimeout(() => {
          if (shouldKeepRunning) createAndStart()
        }, restartDelay)
      }
    }

    try {
      recognition.start()
    } catch (e) {
      if (shouldKeepRunning) {
        restartTimeout = setTimeout(() => {
          if (shouldKeepRunning) createAndStart()
        }, restartDelay)
      }
    }
  }

  createAndStart()

  return {
    recognition,
    stop: () => {
      shouldKeepRunning = false
      if (restartTimeout) clearTimeout(restartTimeout)
      try { recognition?.stop() } catch (e) {}
      recognition = null
    }
  }
}

/**
 * Speak text via the browser's Speech Synthesis API.
 * Selects the best available voice for the language.
 *
 * @param {string} text - Text to speak
 * @param {string} lang - Language code
 * @param {{ rate?: number, pitch?: number, volume?: number }} opts - Optional overrides
 * @returns {Promise<void>}
 */
export async function speak(text, lang, opts = {}) {
  if (!text?.trim()) return
  if (!('speechSynthesis' in window)) throw new Error('Speech synthesis not supported')

  // Cancel any ongoing speech immediately
  window.speechSynthesis.cancel()

  // Ensure voices are loaded
  if (!voicesLoaded) await ensureVoices()

  return new Promise((resolve, reject) => {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = SPEECH_LANG_MAP[lang] || lang
    utterance.rate = opts.rate ?? 1.0
    utterance.pitch = opts.pitch ?? 1.0
    utterance.volume = opts.volume ?? 1.0

    const voice = getBestVoice(lang)
    if (voice) utterance.voice = voice

    utterance.onend = () => resolve()
    utterance.onerror = (e) => {
      if (e.error === 'interrupted' || e.error === 'canceled') resolve() // not a real error
      else reject(e)
    }

    // Workaround: some browsers silently stall; resume if paused
    window.speechSynthesis.speak(utterance)
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume()
    }
  })
}

/**
 * Stop any currently playing speech synthesis.
 */
export function stopSpeaking() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel()
}

/**
 * Supported languages list
 */
export const LANGUAGES = [
  { code: 'en', name: 'English',    flag: '🇬🇧', speechCode: 'en-US' },
  { code: 'ta', name: 'Tamil',      flag: '🇮🇳', speechCode: 'ta-IN' },
  { code: 'hi', name: 'Hindi',      flag: '🇮🇳', speechCode: 'hi-IN' },
  { code: 'ml', name: 'Malayalam',  flag: '🇮🇳', speechCode: 'ml-IN' },
  { code: 'fr', name: 'French',     flag: '🇫🇷', speechCode: 'fr-FR' },
  { code: 'es', name: 'Spanish',    flag: '🇪🇸', speechCode: 'es-ES' },
  { code: 'zh', name: 'Chinese',    flag: '🇨🇳', speechCode: 'zh-CN' },
  { code: 'ja', name: 'Japanese',   flag: '🇯🇵', speechCode: 'ja-JP' },
  { code: 'ar', name: 'Arabic',     flag: '🇸🇦', speechCode: 'ar-SA' },
  { code: 'de', name: 'German',     flag: '🇩🇪', speechCode: 'de-DE' },
  { code: 'ko', name: 'Korean',     flag: '🇰🇷', speechCode: 'ko-KR' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹', speechCode: 'pt-BR' },
  { code: 'ru', name: 'Russian',    flag: '🇷🇺', speechCode: 'ru-RU' },
  { code: 'it', name: 'Italian',    flag: '🇮🇹', speechCode: 'it-IT' },
  { code: 'te', name: 'Telugu',     flag: '🇮🇳', speechCode: 'te-IN' },
  { code: 'bn', name: 'Bengali',    flag: '🇧🇩', speechCode: 'bn-BD' },
  { code: 'th', name: 'Thai',       flag: '🇹🇭', speechCode: 'th-TH' },
  { code: 'vi', name: 'Vietnamese', flag: '🇻🇳', speechCode: 'vi-VN' },
  { code: 'tr', name: 'Turkish',    flag: '🇹🇷', speechCode: 'tr-TR' },
  { code: 'nl', name: 'Dutch',      flag: '🇳🇱', speechCode: 'nl-NL' }
]
