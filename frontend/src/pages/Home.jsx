import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  FiMic, FiGlobe, FiMessageCircle, FiZap, FiShield,
  FiUsers, FiVideo, FiArrowRight, FiPlay, FiTwitter,
  FiGithub, FiLinkedin, FiMail, FiMenu, FiX, FiCheck,
  FiCpu, FiLayers, FiActivity, FiCloudLightning, FiLock, FiStar
} from 'react-icons/fi'
import { RiTranslate2, RiVidiconLine, RiQuestionAnswerLine, RiEarthLine, RiFlashlightLine, RiFingerprintLine } from 'react-icons/ri'

export default function Home() {
  const { user } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const features = [
    { icon: <RiTranslate2 size={24} />, title: 'Voice-to-Voice', desc: 'Speak naturally and hear instant translations in crystal-clear AI voice.', color: 'from-blue-500 to-cyan-400' },
    { icon: <RiVidiconLine size={24} />, title: 'Video Meetings', desc: 'Face-to-face video calls with real-time translated subtitles and voice.', color: 'from-purple-500 to-pink-400' },
    { icon: <RiQuestionAnswerLine size={24} />, title: 'Live Transcript', desc: 'Original text and translation displayed side-by-side elegantly.', color: 'from-emerald-500 to-teal-400' },
    { icon: <RiEarthLine size={24} />, title: '20+ Languages', desc: 'Tamil, Hindi, Japanese, Arabic, French, Spanish, Chinese and more.', color: 'from-orange-500 to-amber-400' },
    { icon: <RiFlashlightLine size={24} />, title: 'Instant Processing', desc: 'Zero-lag AI engine translates as quickly as you speak.', color: 'from-rose-500 to-pink-400' },
    { icon: <RiFingerprintLine size={24} />, title: 'Private & Secure', desc: 'Secure RTC channels with industry-standard E2E encryption.', color: 'from-indigo-500 to-blue-400' },
  ]

  const languages = [
    { lang: 'English', flag: '🇬🇧', hot: true }, { lang: 'Tamil', flag: '🇮🇳', hot: true },
    { lang: 'Hindi', flag: '🇮🇳' }, { lang: 'Malayalam', flag: '🇮🇳' },
    { lang: 'French', flag: '🇫🇷' }, { lang: 'Spanish', flag: '🇪🇸' },
    { lang: 'Chinese', flag: '🇨🇳' }, { lang: 'Japanese', flag: '🇯🇵', hot: true },
    { lang: 'Arabic', flag: '🇸🇦' }, { lang: 'German', flag: '🇩🇪' },
    { lang: 'Korean', flag: '🇰🇷' }, { lang: 'Portuguese', flag: '🇵🇹' },
    { lang: 'Russian', flag: '🇷🇺' }, { lang: 'Italian', flag: '🇮🇹' },
    { lang: 'Telugu', flag: '🇮🇳' }, { lang: 'Bengali', flag: '🇧🇩' },
    { lang: 'Thai', flag: '🇹🇭' }, { lang: 'Vietnamese', flag: '🇻🇳' },
    { lang: 'Turkish', flag: '🇹🇷' }, { lang: 'Dutch', flag: '🇳🇱' }
  ]

  return (
    <div className="min-h-screen bg-dark-950 relative overflow-hidden">
      {/* ── Background effects ── */}
      <div className="fixed inset-0 mesh-gradient pointer-events-none" />
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 -left-32 w-72 h-72 sm:w-96 sm:h-96 md:w-[500px] md:h-[500px] bg-blue-600/10 rounded-full blur-[80px] animate-float" />
        <div className="absolute top-1/2 -right-16 w-60 h-60 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-violet-500/8 rounded-full blur-[80px] animate-float-reverse" />
        <div className="absolute -bottom-16 left-1/3 w-80 h-80 md:w-[450px] md:h-[450px] bg-cyan-500/5 rounded-full blur-[100px] animate-float" style={{ animationDelay: '4s' }} />
      </div>

      {/* ── NAVIGATION ── */}
      <header className="relative z-50 sticky top-0">
        <nav
          className="border-b border-white/5 bg-dark-950/80 backdrop-blur-2xl"
          role="navigation"
          aria-label="Main Navigation"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14 sm:h-16 md:h-18">

              {/* Logo */}
              <Link to="/" className="flex items-center gap-2 sm:gap-3 shrink-0 group">
                <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform">
                  <FiGlobe className="text-white text-sm sm:text-base" />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-base sm:text-lg md:text-xl font-black text-white tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                    VoxaLiveai
                  </span>
                  <span className="text-[10px] sm:text-xs text-blue-400 font-bold bg-blue-500/10 px-1.5 py-0.5 rounded-md uppercase tracking-widest">AI</span>
                </div>
              </Link>

              {/* Desktop nav */}
              <div className="hidden sm:flex items-center gap-2 md:gap-3">
                {user ? (
                  <Link to="/dashboard" className="btn-primary text-sm px-4 md:px-5 py-2 md:py-2.5 gap-1.5">
                    Dashboard <FiArrowRight size={14} />
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="text-slate-300 hover:text-white font-medium text-sm px-3 py-2 rounded-lg hover:bg-white/5 transition-all"
                    >
                      Sign In
                    </Link>
                    <Link to="/register" className="btn-primary text-sm px-4 md:px-5 py-2 md:py-2.5 gap-1.5">
                      Get Started <FiArrowRight size={14} />
                    </Link>
                  </>
                )}
              </div>

              {/* Mobile hamburger */}
              <button
                className="sm:hidden w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800/70 text-white border border-white/10 transition-all active:scale-95"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <FiX size={18} /> : <FiMenu size={18} />}
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile menu drawer */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-white/5 bg-slate-950/95 backdrop-blur-2xl animate-fade-in">
            <div className="max-w-7xl mx-auto px-4 py-4 space-y-3">
              {user ? (
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between w-full bg-slate-800/60 border border-white/10 rounded-2xl px-4 py-3 text-white font-semibold hover:bg-slate-700/60 transition-colors"
                >
                  <span>Dashboard</span>
                  <FiArrowRight size={16} className="text-blue-400" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center w-full bg-slate-800/40 border border-white/8 rounded-2xl px-4 py-3 text-white font-medium transition-colors hover:bg-slate-700/40"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn-primary w-full py-3 justify-center gap-2 text-sm"
                  >
                    Get Started Free <FiArrowRight size={16} />
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ── HERO ── */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 md:pt-20 lg:pt-28 pb-12 sm:pb-16 md:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

          {/* Left: Content */}
          <div className="animate-slide-up text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 mb-6 sm:mb-8">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-recording shrink-0" />
              <span className="text-blue-300 text-[10px] sm:text-xs font-bold uppercase tracking-widest">Live AI Translation</span>
            </div>

            {/* Headline */}
            <h1
              className="font-black leading-[1.05] tracking-tight mb-5 sm:mb-6 text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-5xl xl:text-6xl 2xl:text-7xl"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <span className="text-white block">Speak Any</span>
              <span className="text-white block">Language,</span>
              <span className="gradient-text-vibrant italic block mt-1">Connect Everywhere.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-slate-300 text-sm sm:text-base md:text-lg lg:text-base xl:text-lg max-w-xl mx-auto lg:mx-0 mb-8 sm:mb-10 leading-relaxed">
              Break language barriers instantly with AI-driven voice and video translation.
              Speak naturally, stay connected everywhere in the world.
            </p>

            {/* CTAs */}
            <div className="flex flex-col xs:flex-row sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
              <Link
                to={user ? '/dashboard' : '/register'}
                className="btn-primary btn-pulse text-sm sm:text-base px-6 sm:px-8 py-3 sm:py-3.5 gap-2 rounded-2xl justify-center w-full xs:w-auto"
              >
                <FiMic size={18} /> Get Started Free
              </Link>
              <a
                href="#demo"
                className="btn-secondary text-sm sm:text-base px-6 sm:px-8 py-3 sm:py-3.5 gap-2 rounded-2xl justify-center w-full xs:w-auto"
              >
                <FiPlay size={16} /> Watch Demo
              </a>
            </div>

            {/* Social proof stats */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-6 sm:gap-8 mt-8 sm:mt-10 pt-8 sm:pt-10 border-t border-white/5">
              {[['20+', 'Languages'], ['99.9%', 'Uptime'], ['< 100ms', 'Latency'], ['E2E', 'Encrypted']].map(([val, lbl]) => (
                <div key={lbl} className="text-center">
                  <p className="text-white text-lg sm:text-xl font-black">{val}</p>
                  <p className="text-slate-500 text-[10px] sm:text-xs font-medium uppercase tracking-wider">{lbl}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Demo Card (desktop only) */}
          <div id="demo" className="relative hidden lg:block animate-slide-in-right">
            <div className="absolute -inset-8 bg-blue-500/10 rounded-full blur-[80px]" />
            <div className="relative glass-card rounded-3xl p-1.5 border-blue-500/15 shadow-2xl">
              <div className="bg-slate-900/90 rounded-[calc(1.5rem-6px)] p-6 xl:p-8">
                {/* Window chrome */}
                <div className="flex items-center justify-between mb-6 xl:mb-8">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
                  </div>
                  <div className="flex items-center gap-2 bg-emerald-500/10 rounded-full px-3 py-1 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Real-time</span>
                  </div>
                </div>
                {/* Translation bubbles */}
                <div className="space-y-5">
                  <div>
                    <div className="flex items-center gap-2 mb-2 text-slate-500 text-xs font-bold uppercase tracking-widest">
                      <span>🇮🇳</span> Speaker A
                    </div>
                    <div className="glass rounded-2xl p-4 border-blue-500/15">
                      <p className="text-white font-semibold">நான் எப்படி இருக்கிறேன்</p>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg animate-pulse-glow">
                      <FiZap className="text-white" size={16} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-end gap-2 mb-2 text-slate-500 text-xs font-bold uppercase tracking-widest">
                      Speaker B <span>🇬🇧</span>
                    </div>
                    <div className="glass rounded-2xl p-4 border-violet-500/15 text-right">
                      <p className="text-white font-semibold">How am I doing?</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Floating badge */}
            <div className="absolute -top-4 -left-4 xl:-top-6 xl:-left-6 glass rounded-2xl px-4 py-3 shadow-xl animate-float hidden xl:block">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                  <FiMic className="text-emerald-400" size={16} />
                </div>
                <div>
                  <p className="text-emerald-400 text-xs font-bold uppercase tracking-wider">Voice Active</p>
                  <p className="text-slate-300 text-xs font-medium">Encrypted</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 lg:py-24">
        {/* Section header */}
        <div className="text-center mb-10 sm:mb-14 md:mb-16 animate-slide-up">
          <span className="tag bg-blue-500/10 border border-blue-500/20 text-blue-300 mb-4 sm:mb-5 inline-flex">✨ Features</span>
          <h2
            className="font-black tracking-tight text-white mb-4 text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            The New Standard for{' '}
            <span className="gradient-text-vibrant italic">Global Intelligence.</span>
          </h2>
          <p className="text-slate-400 text-sm sm:text-base md:text-lg max-w-xl sm:max-w-2xl mx-auto leading-relaxed text-center">
            Powerful AI tools designed to bridge the gap between languages and people around the world.
          </p>
        </div>

        {/* Features grid: 1 col → 2 cols (sm) → 3 cols (lg) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
          {features.map((f, idx) => (
            <div
              key={idx}
              className="glass-card rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-7 group animate-slide-up flex flex-col items-center text-center"
              style={{ animationDelay: `${idx * 0.07}s` }}
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                <span className="text-white">{f.icon}</span>
              </div>
              <h3
                className="text-white text-lg font-bold mb-2 sm:mb-3 tracking-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {f.title}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed max-w-[250px]">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── VIDEO CALL SHOWCASE ── */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 md:py-16">
        <div className="glass-card rounded-2xl sm:rounded-3xl overflow-hidden border-violet-500/10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Text */}
            <div className="p-6 sm:p-8 md:p-10 lg:p-12 flex flex-col items-center text-center justify-center order-2 lg:order-1">
              <span className="tag bg-violet-500/10 border border-violet-500/20 text-violet-300 mb-5 inline-flex w-fit text-xs">🎥 New Feature</span>
              <h3
                className="font-black text-white mb-4 leading-tight tracking-tight text-2xl sm:text-3xl md:text-4xl"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Video Calls with{' '}
                <span className="gradient-text-vibrant">Live Translation</span>
              </h3>
              <p className="text-slate-300 text-sm sm:text-base md:text-lg leading-relaxed mb-6 sm:mb-8 max-w-lg">
                Experience seamless international communication. See your partner face-to-face while AI handles translation in real-time.
              </p>
              <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-8 bg-white/5 p-4 rounded-2xl">
                {['HD Audio & Video', 'Smart Subtitles', 'Auto-speech Sync', 'Zero Data Logging'].map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-slate-200 text-sm font-medium">
                    <div className="w-5 h-5 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shrink-0">
                      <FiCheck className="text-blue-400 text-[10px]" size={10} />
                    </div>
                    {item}
                  </div>
                ))}
              </div>
              <Link
                to={user ? '/dashboard' : '/register'}
                className="btn-primary w-full sm:w-auto text-sm sm:text-base px-10 py-3.5 rounded-2xl gap-2 justify-center"
              >
                <FiVideo size={17} /> Try Video Meetings
              </Link>
            </div>

            {/* Visual */}
            <div className="order-1 lg:order-2 bg-gradient-to-br from-slate-900 to-slate-950 flex items-center justify-center min-h-48 sm:min-h-56 md:min-h-64 lg:min-h-0 relative overflow-hidden border-b border-white/5 lg:border-b-0 lg:border-l">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-violet-500/5" />
              <div className="video-container w-4/5 sm:w-3/5 lg:w-4/5 max-w-xs mx-auto aspect-[4/3] relative z-10 flex items-center justify-center">
                <div className="text-center px-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 flex items-center justify-center mx-auto mb-3 border border-white/8">
                    <FiVideo className="text-blue-300 text-xl sm:text-2xl" />
                  </div>
                  <p className="text-white text-xs sm:text-sm font-bold uppercase tracking-wider">Live Video Hub</p>
                  <p className="text-slate-600 text-[10px] tracking-widest mt-1 font-mono">ENCRYPTED</p>
                </div>
                <div className="absolute top-3 left-3 glass rounded-full px-2.5 py-1.5 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-white text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">Secure</span>
                </div>
                <div className="absolute bottom-3 right-3 w-12 h-9 sm:w-14 sm:h-11 rounded-xl bg-slate-800/80 backdrop-blur-md border border-white/10 flex items-center justify-center">
                  <FiUsers className="text-slate-500 text-sm sm:text-base" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── LANGUAGES ── */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 md:py-16">
        <div className="text-center mb-8 sm:mb-12 md:mb-14">
          <span className="tag bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 mb-4 sm:mb-5 inline-flex text-xs items-center gap-1.5"><RiEarthLine className="text-cyan-400" size={14} /> Global Coverage</span>
          <h2
            className="font-black text-white mb-3 sm:mb-4 tracking-tight text-2xl sm:text-3xl md:text-4xl lg:text-5xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Powered for <span className="gradient-text-cyan">Anyone, Anywhere</span>
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-md sm:max-w-xl mx-auto leading-relaxed">
            Connect instantly in over 20 global languages with perfect voice synthesis.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2 sm:gap-2.5 md:gap-3">
          {languages.map((l, i) => (
            <span
              key={i}
              className={`rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold flex items-center gap-1.5 sm:gap-2 transition-all duration-200 hover:-translate-y-0.5 cursor-default
                ${l.hot
                  ? 'bg-blue-500/15 text-white border border-blue-500/30'
                  : 'bg-slate-800/60 border border-white/8 text-slate-300 hover:bg-slate-700/60 hover:border-white/15'
                }`}
            >
              <span className="text-lg sm:text-xl">{l.flag}</span>
              {l.lang}
            </span>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 md:py-16 lg:py-20">
        <div className="glass-card rounded-2xl sm:rounded-3xl overflow-hidden animate-border-glow">
          <div className="relative p-8 sm:p-12 md:p-16 lg:p-20 text-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/15 via-transparent to-violet-600/15 pointer-events-none" />
            <h2
              className="font-black text-white mb-4 sm:mb-6 tracking-tight text-2xl sm:text-4xl md:text-5xl lg:text-6xl relative z-10"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Ready to Speak<br />
              <span className="gradient-text-vibrant">Without Limits?</span>
            </h2>
            <p className="text-slate-300 text-sm sm:text-base md:text-lg mb-7 sm:mb-8 max-w-lg mx-auto relative z-10 leading-relaxed">
              Join private, encrypted translation rooms and start connecting globally right now.
            </p>
            <Link
              to={user ? '/dashboard' : '/register'}
              className="btn-primary btn-pulse text-sm sm:text-base md:text-lg px-8 sm:px-10 py-3 sm:py-4 rounded-2xl gap-2.5 sm:gap-3 relative z-10 inline-flex"
            >
              Get Started Free <FiArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t border-white/5 pt-10 sm:pt-14 pb-8 sm:pb-10" role="contentinfo">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Grid: 1 col mobile → 4 cols desktop, fully centered */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 sm:gap-10 mb-10 sm:mb-14 text-center">
            {/* Brand */}
            <div className="md:col-span-1 space-y-3 sm:space-y-4 flex flex-col items-center">
              <Link to="/" className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
                  <FiGlobe className="text-white text-lg" />
                </div>
                <span className="text-xl font-black text-white tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>VoxaLiveai</span>
              </Link>
              <p className="text-slate-500 text-sm leading-relaxed max-w-[200px]">The world's most intuitive real-time voice and video translation platform.</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                {[FiTwitter, FiGithub, FiLinkedin, FiMail].map((Icon, i) => (
                  <a key={i} href="#" aria-label="Social link" className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-800 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all hover:-translate-y-0.5">
                    <Icon size={15} />
                  </a>
                ))}
              </div>
            </div>

            {/* Product links */}
            <div className="flex flex-col items-center">
              <h4 className="text-white font-bold mb-3 sm:mb-4 text-xs uppercase tracking-widest">Product</h4>
              <ul className="space-y-2.5 sm:space-y-3">
                {['Voice Translator', 'Video Meetings', 'API', 'Enterprise'].map((l, i) => (
                  <li key={i}><a href="#" className="text-slate-500 hover:text-blue-400 text-sm transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>

            {/* Company links */}
            <div className="flex flex-col items-center">
              <h4 className="text-white font-bold mb-3 sm:mb-4 text-xs uppercase tracking-widest">Company</h4>
              <ul className="space-y-2.5 sm:space-y-3">
                {['About', 'Careers', 'Privacy', 'Terms'].map((l, i) => (
                  <li key={i}><a href="#" className="text-slate-500 hover:text-blue-400 text-sm transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>

            {/* Newsletter */}
            <div className="md:col-span-1 flex flex-col items-center">
              <h4 className="text-white font-bold mb-3 sm:mb-4 text-xs uppercase tracking-widest">Newsletter</h4>
              <p className="text-slate-500 text-sm mb-3 sm:mb-4 max-w-[250px]">Stay updated with the latest AI translation features.</p>
              <div className="relative w-full max-w-[250px]">
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="input-field text-sm py-3 w-full text-center"
                  style={{ paddingRight: '2.5rem', paddingLeft: '1rem' }}
                />
                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 hover:text-white transition-colors" aria-label="Subscribe">
                  <FiArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 pt-6 sm:pt-8 border-t border-white/5">
            <p className="text-slate-600 text-xs font-medium order-2 sm:order-1">© 2026 VoxaLiveai. All rights reserved.</p>
            <div className="flex items-center gap-2 text-emerald-500 text-xs font-semibold order-1 sm:order-2">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              All systems operational
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
