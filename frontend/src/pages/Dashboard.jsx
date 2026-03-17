import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LANGUAGES } from '../services/speechService'
import { api } from '../services/api'
import { FiPlus, FiLogIn, FiLogOut, FiGlobe, FiMic, FiCopy, FiCheck, FiVideo, FiArrowRight, FiUser, FiShare2, FiZap, FiCalendar, FiClock, FiFileText, FiTrash2 } from 'react-icons/fi'

export default function Dashboard() {
  const { user, logout, updateLanguage } = useAuth()
  const [roomCode, setRoomCode] = useState('')
  const [createdCode, setCreatedCode] = useState('')
  const [selectedLang, setSelectedLang] = useState(user?.language || 'en')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [scheduledMeetings, setScheduledMeetings] = useState([])
  const [isScheduling, setIsScheduling] = useState(false)
  const [newMeeting, setNewMeeting] = useState({ title: '', date: '', time: '', description: '' })
  const navigate = useNavigate()

  useEffect(() => {
    fetchScheduledMeetings()
  }, [])

  const fetchScheduledMeetings = async () => {
    try {
      const res = await api.get('/conversations/scheduled')
      setScheduledMeetings(res.data.meetings)
    } catch (err) {
      console.error('Fetch meetings error:', err)
    }
  }

  const scheduleMeeting = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const scheduledAt = `${newMeeting.date}T${newMeeting.time}`
      await api.post('/conversations', {
        title: newMeeting.title,
        description: newMeeting.description,
        scheduledAt
      })
      setIsScheduling(false)
      setNewMeeting({ title: '', date: '', time: '', description: '' })
      fetchScheduledMeetings()
    } catch (err) {
      setError('Failed to schedule meeting')
    } finally {
      setLoading(false)
    }
  }

  const deleteMeeting = async (id) => {
    try {
      // Logic to delete or cancel meeting if needed
      // await api.delete(`/conversations/${id}`)
      setScheduledMeetings(scheduledMeetings.filter(m => m._id !== id))
    } catch (err) {
      console.error(err)
    }
  }

  const createRoom = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/conversations')
      setCreatedCode(res.data.roomCode)
    } catch {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
      let code = ''
      for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length))
      setCreatedCode(code)
    } finally {
      setLoading(false)
    }
  }

  const joinRoom = () => {
    const code = roomCode.trim().toUpperCase()
    if (code.length < 4) { setError('Please enter a valid room code'); return }
    updateLanguage(selectedLang)
    navigate(`/chat/${code}?lang=${selectedLang}`)
  }

  const joinCreatedRoom = () => {
    updateLanguage(selectedLang)
    navigate(`/chat/${createdCode}?lang=${selectedLang}`)
  }

  const copyCode = () => {
    navigator.clipboard.writeText(createdCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareWhatsApp = () => {
    const url = `${window.location.origin}/chat/${createdCode}?lang=en`
    const message = `🌐 Join my voice translation room!\n\n🔑 Room Code: *${createdCode}*\n\n👉 Click to join: ${url}\n\nPowered by VoxaLiveai — speak your language, we translate in real-time! 🎙️✨`
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
  }

  const handleLogout = () => { logout(); navigate('/') }
  const currentLang = LANGUAGES.find(l => l.code === selectedLang)

  return (
    <div className="min-h-screen bg-dark-950 relative overflow-hidden noise-overlay">
      <div className="fixed inset-0 mesh-gradient pointer-events-none" />
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary-600/[0.06] rounded-full blur-[120px] animate-float" />
        <div className="absolute bottom-1/3 right-1/4 w-[450px] h-[450px] bg-accent-600/[0.05] rounded-full blur-[120px] animate-float-reverse" />
      </div>

      {/* Nav */}
      <nav className="relative z-30 flex items-center justify-between px-4 sm:px-6 md:px-12 lg:px-16 py-4 sm:py-6 max-w-7xl mx-auto backdrop-blur-xl border-b border-white/[0.05]">
        <Link to="/" className="flex items-center gap-2 sm:gap-3 group">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-primary-500 via-accent-500 to-cyan-500 flex items-center justify-center shadow-2xl shadow-primary-500/20 animate-gradient group-hover:scale-105 transition-transform shrink-0">
            <FiGlobe className="text-white text-lg md:text-xl" />
          </div>
          <div className="flex items-baseline flex-col sm:flex-row sm:items-baseline">
            <span className="text-lg sm:text-xl md:text-2xl font-black text-white tracking-tight leading-none" style={{ fontFamily: 'var(--font-display)' }}>VoxaLiveai</span>
            <span className="text-[0.6rem] sm:text-[0.65rem] text-primary-400 font-black sm:ml-1.5 bg-primary-500/10 px-1.5 py-0.5 rounded-md uppercase tracking-widest mt-1 sm:mt-0 w-fit">AI</span>
          </div>
        </Link>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-dark-900/40 backdrop-blur-md border border-white/[0.05] rounded-[1.25rem] px-4 py-2 hover:bg-dark-800/40 transition-colors cursor-default">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-sm font-black shadow-lg">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-white text-xs font-black leading-none mb-1 uppercase tracking-wider">{user?.name}</p>
              <p className="text-dark-500 text-[10px] font-bold uppercase tracking-[0.1em] flex items-center gap-1.5">
                <span className="opacity-70">{currentLang?.flag}</span> {currentLang?.name}
              </p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-10 h-10 md:w-auto md:px-5 md:h-11 rounded-xl bg-dark-900/60 border border-white/[0.05] text-dark-300 hover:text-rose-400 hover:border-rose-500/30 hover:bg-rose-500/10 transition-all flex items-center justify-center gap-2">
            <FiLogOut size={18} />
            <span className="hidden md:inline font-bold text-sm">Logout</span>
          </button>
        </div>
      </nav>

      {/* Content */}
      <div className="relative z-20 max-w-7xl mx-auto px-6 py-12 md:py-20 lg:py-24">
        {/* Balanced Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-12 lg:gap-20 items-end mb-16 md:mb-28">
          <div className="animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 mb-8 backdrop-blur-md shadow-lg shadow-primary-500/5">
              <FiZap size={14} className="fill-primary-400 animate-pulse" />
              <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em]">Live Workspace</span>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-8xl font-black text-white mb-8 tracking-tighter leading-[0.95]" style={{ fontFamily: 'var(--font-display)' }}>
               Welcome back, <br />
               <span className="gradient-text-vibrant italic">{user?.name?.split(' ')[0]}</span>
            </h1>
            <p className="text-dark-300 text-lg md:text-2xl font-bold leading-relaxed opacity-90 max-w-2xl">
              Your translation engine is primed and ready. Start a new session or join an existing one to bridge the gap.
            </p>
          </div>
          
          {/* Quick Stats / Info Widget */}
          <div className="hidden lg:grid grid-cols-2 gap-4 animate-slide-in-right">
            {[
              { label: 'Active Rooms', value: '1,280', color: 'text-emerald-400' },
              { label: 'AI Latency', value: '85ms', color: 'text-primary-400' },
              { label: 'Secured Data', value: '100%', color: 'text-cyan-400' },
              { label: 'Global Uptime', value: '99.9%', color: 'text-accent-400' }
            ].map((stat, i) => (
              <div key={i} className="glass-card rounded-3xl p-6 border-white/5 flex flex-col items-center justify-center text-center">
                <span className={`text-2xl font-black mb-1 ${stat.color}`}>{stat.value}</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-dark-500">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Layout Grid - Centered & Balanced */}
        <div className="flex flex-col lg:flex-row gap-8 items-start justify-center max-w-6xl mx-auto">
          
          {/* Left Column: Actions */}
          <div className="w-full lg:w-3/5 space-y-12 shrink-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {/* Create Room */}
              <div className="glass-card rounded-[2.5rem] p-1.5 md:p-2 animate-slide-up shadow-3xl shadow-primary-500/5 group" style={{ animationDelay: '0.1s' }}>
                <div className="bg-dark-950/80 rounded-[2.25rem] p-8 md:p-10 border border-white/[0.05] h-full flex flex-col relative overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-500/[0.05] rounded-full blur-[40px] group-hover:bg-primary-500/[0.1] transition-colors" />
                  
                  <div className="flex items-center gap-6 mb-10">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-blue-600 flex items-center justify-center shadow-2xl shadow-primary-500/30 shrink-0 group-hover:scale-110 transition-transform duration-500">
                      <FiPlus className="text-white text-3xl" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-white mb-1 tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>New Session</h2>
                      <p className="text-dark-500 text-sm font-bold uppercase tracking-wider">Host a conversation</p>
                    </div>
                  </div>

                  <div className="mt-auto">
                    {createdCode ? (
                      <div className="space-y-6 animate-scale-in">
                        <div className="bg-dark-900/60 backdrop-blur-md rounded-[2rem] p-8 text-left border border-white/[0.05] shadow-inner relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/[0.02] to-transparent" />
                          <p className="text-dark-500 text-[10px] font-black uppercase tracking-[0.3em] mb-4 opacity-50 relative z-10">Access Code</p>
                          <p className="text-4xl md:text-5xl font-mono font-black gradient-text tracking-[0.3em] relative z-10">{createdCode}</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                          <button onClick={copyCode} className="h-14 rounded-2xl bg-dark-800/60 border border-white/[0.05] text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-dark-700/60 transition-all">
                            {copied ? <><FiCheck size={18} className="text-emerald-400" /> Done</> : <><FiCopy size={18} /> Copy</>}
                          </button>
                          <button onClick={shareWhatsApp} className="h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-500/20 transition-all">
                            <FiShare2 size={18} /> Share
                          </button>
                          <button onClick={joinCreatedRoom} className="btn-primary h-14 rounded-2xl shadow-2xl shadow-primary-500/20 text-sm">
                            <FiVideo size={20} /> Join
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={createRoom} disabled={loading} className="btn-primary w-full h-16 text-base font-black gap-3 disabled:opacity-50 rounded-[1.25rem] shadow-2xl shadow-primary-500/20 justify-center">
                        {loading ? <div className="w-6 h-6 border-3 border-white/20 border-t-white rounded-full animate-spin" /> : <><FiPlus size={24} /> Create New Room</>}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Join Room */}
              <div className="glass-card rounded-[2.5rem] p-1.5 md:p-2 animate-slide-up shadow-3xl shadow-accent-500/5 group" style={{ animationDelay: '0.2s' }}>
                <div className="bg-dark-950/80 rounded-[2.25rem] p-8 md:p-10 border border-white/[0.05] h-full flex flex-col relative overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-accent-500/[0.05] rounded-full blur-[40px] group-hover:bg-accent-500/[0.1] transition-colors" />
                  
                  <div className="flex items-center gap-6 mb-10">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-500 via-rose-500 to-rose-600 flex items-center justify-center shadow-2xl shadow-accent-500/30 shrink-0 group-hover:scale-110 transition-transform duration-500">
                      <FiLogIn className="text-white text-3xl" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-white mb-1 tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>Join Session</h2>
                      <p className="text-dark-500 text-sm font-bold uppercase tracking-wider">Connect to a host</p>
                    </div>
                  </div>

                  <div className="mt-auto space-y-6">
                    {error && (
                      <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-2xl px-5 py-3.5 text-xs animate-scale-in flex items-center gap-4 font-bold">
                        <div className="w-6 h-6 rounded-full bg-rose-500/20 flex items-center justify-center shrink-0 border border-rose-500/30">
                          <span className="text-rose-400 text-[10px] font-black leading-none">!</span>
                        </div>
                        {error}
                      </div>
                    )}
                    
                    <div className="relative">
                      <input id="join-room-code" type="text" value={roomCode} onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                        className="w-full h-16 text-left pl-8 text-3xl font-mono font-black tracking-[0.4em] uppercase bg-dark-900/60 border-2 border-white/[0.05] focus:border-accent-500/50 rounded-[1.25rem] placeholder:opacity-20 transition-all"
                        placeholder="CODE" maxLength={8} />
                    </div>
                    <button onClick={joinRoom} className="w-full h-16 rounded-[1.25rem] bg-gradient-to-r from-accent-500 via-rose-500 to-rose-600 text-white font-black text-base flex items-center justify-center gap-3 shadow-2xl shadow-accent-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                      <FiLogIn size={24} /> Join Room
                    </button>
                  </div>
                </div>
              </div>

              {/* Schedule Meeting */}
              <div className="glass-card rounded-[2.5rem] p-1.5 md:p-2 animate-slide-up shadow-3xl shadow-emerald-500/5 group md:col-span-2" style={{ animationDelay: '0.3s' }}>
                <div className="bg-dark-950/80 rounded-[2.25rem] p-8 md:p-10 border border-white/[0.05] h-full flex flex-col relative overflow-hidden">
                   <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/[0.05] rounded-full blur-[40px] group-hover:bg-emerald-500/[0.1] transition-colors" />
                   
                   <div className="flex items-center gap-6 mb-8">
                     <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 flex items-center justify-center shadow-2xl shadow-emerald-500/30 shrink-0 group-hover:scale-110 transition-transform duration-500">
                       <FiCalendar className="text-white text-3xl" />
                     </div>
                     <div>
                       <h2 className="text-2xl font-black text-white mb-1 tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>Schedule</h2>
                       <p className="text-dark-500 text-sm font-bold uppercase tracking-wider">Plan ahead</p>
                     </div>
                   </div>

                   <form onSubmit={scheduleMeeting} className="space-y-4">
                     <input type="text" placeholder="Meeting Title" required value={newMeeting.title}
                       onChange={e => setNewMeeting({...newMeeting, title: e.target.value})}
                       className="w-full h-12 px-5 bg-dark-900/60 border border-white/5 rounded-xl text-sm font-bold focus:border-emerald-500/50 transition-all" />
                     
                     <div className="grid grid-cols-2 gap-3">
                       <input type="date" required value={newMeeting.date}
                         onChange={e => setNewMeeting({...newMeeting, date: e.target.value})}
                         className="h-12 px-4 bg-dark-900/60 border border-white/5 rounded-xl text-xs font-bold focus:border-emerald-500/50 transition-all" />
                       <input type="time" required value={newMeeting.time}
                         onChange={e => setNewMeeting({...newMeeting, time: e.target.value})}
                         className="h-12 px-4 bg-dark-900/60 border border-white/5 rounded-xl text-xs font-bold focus:border-emerald-500/50 transition-all" />
                     </div>

                     <button type="submit" disabled={loading} className="w-full h-14 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/10 hover:scale-[1.02] transition-all">
                       {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <><FiPlus size={18} /> Schedule Session</>}
                     </button>
                   </form>
                </div>
              </div>
            </div>

            {/* How it works Banner moved to left column for balance */}
            <div className="glass-card rounded-[2.5rem] p-1.5 md:p-2 animate-slide-up shadow-3xl shadow-black/20" style={{ animationDelay: '0.3s' }}>
              <div className="bg-dark-950/80 rounded-[2.25rem] p-10 md:p-14 border border-white/[0.05]">
                <div className="text-left mb-16">
                  <h3 className="text-3xl font-black text-white mb-4 tracking-tight uppercase" style={{ fontFamily: 'var(--font-display)' }}>Seamless Communication</h3>
                  <div className="w-20 h-1 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full" />
                </div>
                {/* How it works content */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 relative">
                  <div className="hidden lg:block absolute top-[20%] left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-primary-500/20 via-accent-500/20 to-transparent -z-10" />
                  {[
                    { step: '01', title: 'Create', desc: 'Generate unique secure code', icon: '🏠', color: 'from-primary-400 to-blue-500', shadow: 'shadow-primary-500/20' },
                    { step: '02', title: 'Share', desc: 'Send direct invite links', icon: '📤', color: 'from-accent-400 to-fuchsia-500', shadow: 'shadow-accent-500/20' },
                    { step: '03', title: 'Connect', desc: 'Enable mic & camera access', icon: '🎥', color: 'from-emerald-400 to-teal-500', shadow: 'shadow-emerald-500/20' },
                    { step: '04', title: 'Speak', desc: 'Live neural translation', icon: '✨', color: 'from-amber-400 to-orange-500', shadow: 'shadow-amber-500/20' }
                  ].map((s, i) => (
                    <div key={i} className="relative group text-center lg:text-left">
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-[1.25rem] bg-gradient-to-br border border-white/10 flex items-center justify-center text-3xl mx-auto lg:mx-0 mb-6 transition-transform group-hover:-translate-y-2 group-hover:scale-110 duration-500 relative z-10 overflow-hidden shadow-2xl ${s.color} ${s.shadow}">
                        <div className={`absolute inset-0 bg-gradient-to-br ${s.color} opacity-80`} />
                        <span className="relative z-10 filter drop-shadow-lg">{s.icon}</span>
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-dark-900 rounded-full flex items-center justify-center border border-white/20">
                          <span className="text-[9px] font-black text-white">{s.step}</span>
                        </div>
                      </div>
                      <h4 className="text-white text-lg font-black mb-2 tracking-tight">{s.title}</h4>
                      <p className="text-dark-400 text-xs font-bold leading-relaxed">{s.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Dynamic Data (Language, Meetings) */}
          <div className="w-full lg:w-2/5 space-y-8 flex flex-col shrink-0">
            
            {/* Scheduled Meetings List */}
            {scheduledMeetings.length > 0 && (
              <div className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
                <div className="flex items-center justify-between mb-6 px-2">
                  <h3 className="text-xl font-black text-white tracking-tight uppercase" style={{ fontFamily: 'var(--font-display)' }}>Upcoming Meetings</h3>
                  <span className="bg-primary-500/10 text-primary-400 text-[10px] font-black px-3 py-1 rounded-full border border-primary-500/20">{scheduledMeetings.length} PLANNED</span>
                </div>
                
                <div className="flex flex-col gap-4">
                  {scheduledMeetings.map((meeting, i) => (
                    <div key={meeting._id} className="glass-card rounded-[2rem] p-6 border border-white/5 hover:border-primary-500/30 transition-all group relative overflow-hidden bg-dark-900/40">
                      <div className="flex items-start justify-between gap-4 relative z-10">
                        <div className="space-y-2 flex-1">
                          <h4 className="text-white font-black text-lg tracking-tight line-clamp-1">{meeting.title}</h4>
                          <div className="flex flex-wrap gap-3">
                            <span className="flex items-center gap-1.5 text-dark-500 text-[10px] font-black uppercase tracking-wider">
                              <FiCalendar size={12} className="text-primary-400" /> {new Date(meeting.scheduledAt).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1.5 text-dark-500 text-[10px] font-black uppercase tracking-wider">
                              <FiClock size={12} className="text-accent-400" /> {new Date(meeting.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                           <button onClick={() => {
                             const url = `${window.location.origin}/chat/${meeting.roomCode}?lang=en`
                             navigator.clipboard.writeText(url)
                           }} className="w-9 h-9 rounded-xl bg-dark-900/60 border border-white/5 flex items-center justify-center text-dark-300 hover:text-primary-400 transition-colors">
                             <FiShare2 size={16} />
                           </button>
                           <Link to={`/chat/${meeting.roomCode}?lang=${selectedLang}`} className="h-9 px-4 rounded-xl bg-primary-500 text-white font-black text-[10px] uppercase tracking-widest flex items-center justify-center hover:scale-105 transition-all">
                             Join
                           </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sidebar / Lang Selection */}
            <div className="glass-card rounded-[2.5rem] p-1.5 md:p-2 animate-slide-up shadow-3xl shadow-black/30" style={{ animationDelay: '0.4s' }}>
              <div className="bg-dark-950/80 rounded-[2.25rem] p-8 border border-white/[0.05]">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black text-white tracking-tight leading-none" style={{ fontFamily: 'var(--font-display)' }}>My Language</h3>
                  <div className="w-8 h-8 rounded-full bg-primary-500/10 flex items-center justify-center">
                    <FiGlobe className="text-primary-400 group-hover:rotate-180 transition-transform duration-1000" size={16} />
                  </div>
                </div>

                <div className="space-y-4 mb-10">
                  <div className="relative group">
                    <select 
                      value={selectedLang} 
                      onChange={(e) => setSelectedLang(e.target.value)} 
                      className="w-full h-14 pl-12 pr-10 text-base font-bold bg-dark-900/60 border-white/[0.05] appearance-none cursor-pointer rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
                    >
                      {LANGUAGES.map(lang => (<option key={lang.code} value={lang.code} className="bg-dark-900 text-white leading-loose">{lang.flag} &nbsp; {lang.name}</option>))}
                    </select>
                    <FiGlobe className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-400 pointer-events-none" size={18} />
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-dark-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4 opacity-50 px-1">Quick Select</p>
                  <div className="grid grid-cols-2 gap-3">
                    {LANGUAGES.slice(0, 10).map(lang => (
                      <button 
                        key={lang.code} 
                        onClick={() => setSelectedLang(lang.code)}
                        className={`group relative h-20 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-300 ${
                          selectedLang === lang.code
                            ? 'bg-primary-500/20 border-2 border-primary-500 text-white shadow-xl shadow-primary-500/10'
                            : 'bg-dark-900/40 border border-white/[0.05] text-dark-400 hover:border-white/20 hover:bg-dark-800/40'
                        }`}
                      >
                        <span className={`text-2xl transition-transform duration-500 ${selectedLang === lang.code ? 'scale-110 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'group-hover:scale-110'}`}>{lang.flag}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest">{lang.name}</span>
                        {selectedLang === lang.code && (
                          <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="mt-10 pt-8 border-t border-white/5 space-y-4">
                  <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-[0.1em]">
                    <span className="text-dark-500">Service Status</span>
                    <span className="text-emerald-400 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Operational</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-[0.1em]">
                    <span className="text-dark-500">AI Model</span>
                    <span className="text-primary-400">Neural-V4.2</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
