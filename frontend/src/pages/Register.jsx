import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LANGUAGES } from '../services/speechService'
import { FiUser, FiMail, FiLock, FiGlobe, FiArrowRight, FiCheck } from 'react-icons/fi'

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [language, setLanguage] = useState('en')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const { register, loginWithGoogle } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    try {
      await register(name, email, password, language)
      navigate('/dashboard')
    } catch (err) {
      const msg = err.code === 'auth/email-already-in-use'
        ? 'This email is already registered. Please sign in instead.'
        : err.code === 'auth/weak-password'
          ? 'Password is too weak. Use at least 6 characters.'
          : err.message || 'Registration failed. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError('')
    setGoogleLoading(true)
    try {
      await loginWithGoogle()
      navigate('/dashboard')
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Google sign-up failed. Please try again.')
      }
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-950 relative overflow-hidden flex">
      <div className="fixed inset-0 mesh-gradient pointer-events-none" />
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 -right-20 w-80 h-80 bg-accent-600/10 rounded-full blur-[80px] animate-float" />
        <div className="absolute bottom-1/4 -left-20 w-72 h-72 bg-primary-600/8 rounded-full blur-[80px] animate-float-reverse" />
      </div>

      {/* ===== LEFT: FORM ===== */}
      <div className="relative z-10 w-full lg:w-1/2 flex flex-col items-center justify-center px-5 sm:px-10 md:px-16 py-12">
        <div className="w-full max-w-md animate-slide-up">

          <Link to="/" className="inline-flex items-center gap-2.5 mb-10 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/30 group-hover:scale-105 transition-transform">
              <FiGlobe className="text-white text-lg" />
            </div>
            <span className="text-xl font-black text-white tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
              VoxaLive<span className="text-primary-400 text-xs font-bold ml-1 align-top mt-1.5 inline-block">ai</span>
            </span>
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-2 tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>Create Account</h1>
            <p className="text-dark-400 text-base">Join the global conversation today</p>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-2xl px-4 py-3 mb-6 text-sm flex items-center gap-3 animate-scale-in">
              <div className="w-5 h-5 shrink-0 rounded-full bg-rose-500/20 flex items-center justify-center border border-rose-500/30">
                <span className="text-rose-400 text-xs font-black">!</span>
              </div>
              {error}
            </div>
          )}

          {/* Google Sign-Up */}
          <button id="google-signup" onClick={handleGoogle} disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 h-12 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white font-bold text-sm transition-all mb-5 disabled:opacity-50">
            {googleLoading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              : <><GoogleIcon /><span>Sign up with Google</span></>}
          </button>

          <div className="relative flex items-center gap-4 mb-5">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-dark-600 text-xs font-bold uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-dark-300 text-xs font-bold uppercase tracking-wider block">Full Name</label>
              <div className="relative">
                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-500 pointer-events-none z-10" size={18} />
                <input id="register-name" type="text" value={name} onChange={e => setName(e.target.value)}
                  className="input-field" placeholder="John Doe" required style={{ paddingLeft: '2.75rem' }} />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-dark-300 text-xs font-bold uppercase tracking-wider block">Email Address</label>
              <div className="relative">
                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-500 pointer-events-none z-10" size={18} />
                <input id="register-email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="input-field" placeholder="name@company.com" required style={{ paddingLeft: '2.75rem' }} />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-dark-300 text-xs font-bold uppercase tracking-wider block">Password</label>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-500 pointer-events-none z-10" size={18} />
                <input id="register-password" type="password" value={password} onChange={e => setPassword(e.target.value)}
                  className="input-field" placeholder="••••••••" required minLength={6} style={{ paddingLeft: '2.75rem' }} />
              </div>
            </div>

            {/* Language */}
            <div className="space-y-1.5">
              <label className="text-dark-300 text-xs font-bold uppercase tracking-wider block">Native Language</label>
              <div className="relative">
                <FiGlobe className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-500 pointer-events-none z-10" size={18} />
                <select id="register-language" value={language} onChange={e => setLanguage(e.target.value)}
                  className="select-field w-full" style={{ paddingLeft: '2.75rem' }}>
                  {LANGUAGES.map(lang => (
                    <option key={lang.code} value={lang.code} className="bg-dark-900 text-white">{lang.flag} {lang.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-start gap-2.5 pt-1">
              <input id="terms" type="checkbox" required
                className="w-4 h-4 mt-0.5 rounded-md bg-dark-800 border-dark-600 cursor-pointer accent-accent-500 shrink-0" />
              <label htmlFor="terms" className="text-sm text-dark-400 cursor-pointer leading-relaxed">
                I agree to the{' '}
                <a href="#" className="text-white font-semibold hover:text-accent-400 transition-colors">Terms</a>
                {' '}&{' '}
                <a href="#" className="text-white font-semibold hover:text-accent-400 transition-colors">Privacy</a>
              </label>
            </div>

            <button id="register-submit" type="submit" disabled={loading || googleLoading}
              className="btn-primary w-full py-3.5 text-base font-semibold gap-2.5 mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>
              {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                : <><span>Create Account</span><FiArrowRight size={18} /></>}
            </button>
          </form>

          <div className="mt-7 pt-6 border-t border-white/5">
            <p className="text-dark-400 text-sm text-center">
              Already have an account?{' '}
              <Link to="/login" className="text-white font-bold hover:text-accent-400 transition-colors">Sign In</Link>
            </p>
          </div>
        </div>
      </div>

      {/* ===== RIGHT: VISUAL ===== */}
      <div className="hidden lg:flex w-1/2 relative flex-col items-center justify-center p-16 border-l border-white/5 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent-600/8 via-transparent to-primary-600/8" />
        <div className="relative z-10 w-full max-w-md animate-scale-in">
          <div className="glass-card rounded-3xl p-10 border-accent-500/15">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-500 to-primary-500 flex items-center justify-center shadow-2xl shadow-accent-500/30 mb-8 animate-pulse-glow">
              <FiCheck className="text-white text-2xl" />
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
              Limitless<br /><span className="gradient-text italic">Connection.</span>
            </h2>
            <p className="text-dark-300 text-base leading-relaxed mb-10">
              Your voice, translated instantly. Experience the future of communication with end-to-end encryption.
            </p>
            <div className="space-y-3">
              {['Real-time Voice Translation', 'HD Video with AI Subtitles', 'Emotion Detection & Notes', 'E2E Encrypted Channels'].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-dark-200 text-sm font-medium">
                  <div className="w-7 h-7 rounded-lg bg-accent-500/15 flex items-center justify-center border border-accent-500/25 shrink-0">
                    <FiCheck className="text-accent-400 text-xs" />
                  </div>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
