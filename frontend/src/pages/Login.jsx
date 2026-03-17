import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FiMail, FiLock, FiGlobe, FiArrowRight, FiZap } from 'react-icons/fi'

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

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const { login, loginWithGoogle } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      const msg = err.code === 'auth/invalid-credential'
        ? 'Invalid email or password.'
        : err.code === 'auth/user-not-found'
          ? 'No account found with this email.'
          : err.code === 'auth/too-many-requests'
            ? 'Too many attempts. Please try again later.'
            : err.message || 'Login failed. Please try again.'
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
        setError('Google sign-in failed. Please try again.')
      }
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-950 relative overflow-hidden flex">
      {/* Background */}
      <div className="fixed inset-0 mesh-gradient pointer-events-none" />
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-primary-600/10 rounded-full blur-[80px] animate-float" />
        <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-accent-500/8 rounded-full blur-[80px] animate-float-reverse" />
      </div>

      {/* ===== LEFT: FORM ===== */}
      <div className="relative z-10 w-full lg:w-1/2 flex flex-col items-center justify-center px-5 sm:px-10 md:px-16 py-12">
        <div className="w-full max-w-md animate-slide-up">

          {/* Logo */}
          <Link to="/" className="inline-flex items-center gap-2.5 mb-10 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/30 group-hover:scale-105 transition-transform">
              <FiGlobe className="text-white text-lg" />
            </div>
            <span className="text-xl font-black text-white tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
              VoxaLive<span className="text-primary-400 text-xs font-bold ml-1 align-top mt-1.5 inline-block">ai</span>
            </span>
          </Link>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-2 tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>Welcome Back</h1>
            <p className="text-dark-400 text-base">Sign in to your translation hub</p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-2xl px-4 py-3 mb-6 text-sm flex items-center gap-3 animate-scale-in">
              <div className="w-5 h-5 shrink-0 rounded-full bg-rose-500/20 flex items-center justify-center border border-rose-500/30">
                <span className="text-rose-400 text-xs font-black">!</span>
              </div>
              {error}
            </div>
          )}

          {/* Google Sign-In */}
          <button
            id="google-signin"
            onClick={handleGoogle}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 h-12 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white font-bold text-sm transition-all mb-5 disabled:opacity-50"
          >
            {googleLoading ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <><GoogleIcon /><span>Continue with Google</span></>
            )}
          </button>

          {/* Divider */}
          <div className="relative flex items-center gap-4 mb-5">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-dark-600 text-xs font-bold uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          {/* Email Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-dark-300 text-xs font-bold uppercase tracking-wider block">Email Address</label>
              <div className="relative">
                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-500 pointer-events-none z-10" size={18} />
                <input id="login-email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="input-field !pl-11" placeholder="name@company.com" required style={{ paddingLeft: '2.75rem' }} />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-dark-300 text-xs font-bold uppercase tracking-wider">Password</label>
                <Link to="#" className="text-xs text-primary-400 font-semibold hover:text-white transition-colors">Forgot?</Link>
              </div>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-500 pointer-events-none z-10" size={18} />
                <input id="login-password" type="password" value={password} onChange={e => setPassword(e.target.value)}
                  className="input-field" placeholder="••••••••" required style={{ paddingLeft: '2.75rem' }} />
              </div>
            </div>

            <button id="login-submit" type="submit" disabled={loading || googleLoading}
              className="btn-primary w-full py-3.5 text-base font-semibold gap-2.5 mt-2 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                : <><span>Sign In</span><FiArrowRight size={18} /></>}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5">
            <p className="text-dark-400 text-sm text-center">
              Don't have an account?{' '}
              <Link to="/register" className="text-white font-bold hover:text-primary-400 transition-colors">Create Account</Link>
            </p>
          </div>
        </div>
      </div>

      {/* ===== RIGHT: VISUAL ===== */}
      <div className="hidden lg:flex w-1/2 relative flex-col items-center justify-center p-16 border-l border-white/5 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600/8 via-transparent to-accent-600/8" />
        <div className="relative z-10 w-full max-w-md animate-scale-in">
          <div className="glass-card rounded-3xl p-10 border-primary-500/15">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-2xl shadow-primary-500/30 mb-8 animate-pulse-glow">
              <FiZap className="text-white text-2xl" />
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
              World-Class<br /><span className="gradient-text-vibrant italic">Intelligence.</span>
            </h2>
            <p className="text-dark-300 text-base leading-relaxed mb-10">
              Break language barriers in real-time. Secure, fast, and remarkably accurate AI-powered translation.
            </p>
            <div className="grid grid-cols-2 gap-6">
              {[['20+', 'Languages'], ['99.9%', 'Accuracy'], ['< 1s', 'Latency'], ['E2E', 'Encrypted']].map(([val, lbl]) => (
                <div key={lbl} className="glass rounded-2xl p-4 text-center">
                  <p className="text-white text-2xl font-black mb-0.5">{val}</p>
                  <p className="text-dark-500 text-xs font-bold uppercase tracking-widest">{lbl}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
