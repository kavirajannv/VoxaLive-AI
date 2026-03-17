import { createContext, useContext, useState, useEffect } from 'react'
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged
} from '../firebase'
import { api } from '../services/api'

const AuthContext = createContext(null)

/**
 * Sync Firebase user to our MongoDB backend and return the enriched profile.
 */
async function syncUserToBackend(firebaseUser, extraData = {}) {
  try {
    const idToken = await firebaseUser.getIdToken()
    const res = await api.post('/auth/firebase', {
      idToken,
      name: firebaseUser.displayName || extraData.name || 'User',
      language: extraData.language || 'en',
      photoURL: firebaseUser.photoURL || ''
    })
    // Store token for API calls
    localStorage.setItem('token', idToken)
    return res.data.user
  } catch (err) {
    console.error('Backend sync error:', err)
    // Fallback — return Firebase user shape
    return {
      id: firebaseUser.uid,
      name: firebaseUser.displayName || 'User',
      email: firebaseUser.email,
      language: extraData.language || 'en',
      photoURL: firebaseUser.photoURL || ''
    }
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Subscribe to Firebase auth state
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await syncUserToBackend(firebaseUser)
        setUser(profile)
      } else {
        localStorage.removeItem('token')
        setUser(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  // ── Email / Password ─────────────────────────────────────────
  const login = async (email, password) => {
    const { user: fbUser } = await signInWithEmailAndPassword(auth, email, password)
    const profile = await syncUserToBackend(fbUser)
    setUser(profile)
    return profile
  }

  const register = async (name, email, password, language = 'en') => {
    const { user: fbUser } = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(fbUser, { displayName: name })
    const profile = await syncUserToBackend(fbUser, { name, language })
    setUser(profile)
    return profile
  }

  // ── Google ───────────────────────────────────────────────────
  const loginWithGoogle = async () => {
    const { user: fbUser } = await signInWithPopup(auth, googleProvider)
    const profile = await syncUserToBackend(fbUser)
    setUser(profile)
    return profile
  }

  // ── Logout ───────────────────────────────────────────────────
  const logout = async () => {
    await signOut(auth)
    localStorage.removeItem('token')
    setUser(null)
  }

  const updateLanguage = (language) => {
    setUser(prev => prev ? { ...prev, language } : null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, logout, updateLanguage }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
