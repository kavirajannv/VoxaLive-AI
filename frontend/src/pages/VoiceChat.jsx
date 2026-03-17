import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { connectSocket, disconnectSocket } from '../services/socket'
import { createContinuousRecognition, speak, isSpeechRecognitionSupported, LANGUAGES } from '../services/speechService'
import { FiMic, FiMicOff, FiVolume2, FiVolumeX, FiArrowLeft, FiGlobe, FiSend, FiVideo, FiVideoOff, FiPhoneOff, FiMaximize2, FiMinimize2, FiUsers, FiCopy, FiInfo, FiLayers, FiRadio, FiSettings, FiMonitor, FiAirplay, FiLayout } from 'react-icons/fi'

const ICE_SERVERS = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] }

export default function VoiceChat() {
  const { roomCode } = useParams()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [myLang, setMyLang] = useState(searchParams.get('lang') || user?.language || 'en')
  const [isListening, setIsListening] = useState(false)
  const [currentTranscript, setCurrentTranscript] = useState('')
  const [messages, setMessages] = useState([])
  const [roomUsers, setRoomUsers] = useState([])
  const [isConnected, setIsConnected] = useState(false)
  const [autoSpeak, setAutoSpeak] = useState(true)
  const [typingUser, setTypingUser] = useState('')
  const [textInput, setTextInput] = useState('')
  const [speechSupported] = useState(isSpeechRecognitionSupported())
  const [isAudioOnly, setIsAudioOnly] = useState(false)
  const [speechError, setSpeechError] = useState('')
  const [nlpMode, setNlpMode] = useState(false)
  const [isPresentationMode, setIsPresentationMode] = useState(false)

  const isAudioOnlyRef = useRef(isAudioOnly)
  useEffect(() => { isAudioOnlyRef.current = isAudioOnly }, [isAudioOnly])

  // Video call state
  const [isVideoOn, setIsVideoOn] = useState(false)
  const [isRemoteVideoOn, setIsRemoteVideoOn] = useState(false)
  const [isVideoExpanded, setIsVideoExpanded] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [localStream, setLocalStream] = useState(null)
  const [screenStream, setScreenStream] = useState(null)

  const socketRef = useRef(null)
  const recognitionRef = useRef(null)
  const recognitionStopRef = useRef(null)
  const messagesEndRef = useRef(null)
  const lastSentRef = useRef('')
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const peerConnectionRef = useRef(null)
  // Ref keeps latest lang and mode without needing socket to reconnect
  const myLangRef = useRef(myLang)
  useEffect(() => { myLangRef.current = myLang }, [myLang])
  
  const nlpModeRef = useRef(nlpMode)
  useEffect(() => { nlpModeRef.current = nlpMode }, [nlpMode])

  const myLangInfo = LANGUAGES.find(l => l.code === myLang) || LANGUAGES[0]

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Socket.IO connection
  useEffect(() => {
    const socket = connectSocket()
    socketRef.current = socket

    socket.on('connect', () => {
      setIsConnected(true)
      socket.emit('join-room', {
        roomCode,
        userId: user?.id || 'guest-' + Date.now(),
        userName: user?.name || 'Guest',
        language: myLang
      })
    })

    socket.on('disconnect', () => setIsConnected(false))
    socket.on('room-users', (users) => setRoomUsers(users))

    socket.on('user-joined', ({ userName, language }) => {
      const langName = LANGUAGES.find(l => l.code === language)?.name || language
      setMessages(prev => [...prev, { type: 'system', text: `${userName} joined (${langName})`, timestamp: new Date().toISOString() }])
    })

    socket.on('user-left', ({ userName }) => {
      setMessages(prev => [...prev, { type: 'system', text: `${userName} left the room`, timestamp: new Date().toISOString() }])
      endVideoCall()
    })

    socket.on('receive-message', (data) => {
      setMessages(prev => [...prev, { type: 'received', ...data }])
      if (autoSpeak && data.translatedText) {
        speak(data.translatedText, data.targetLang).catch(() => {})
      }
    })

    socket.on('message-sent', (data) => {
      setMessages(prev => [...prev, { type: 'sent', ...data }])
    })

    socket.on('user-typing', ({ userName }) => {
      setTypingUser(userName)
      setTimeout(() => setTypingUser(''), 3000)
    })
    socket.on('user-stop-typing', () => setTypingUser(''))

    socket.on('video-offer', async ({ offer, senderId }) => {
      try {
        const pc = createPeerConnection()
        await pc.setRemoteDescription(new RTCSessionDescription(offer))
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: !isAudioOnlyRef.current, 
          audio: { 
            echoCancellation: true, 
            noiseSuppression: true, 
            autoGainControl: true 
          } 
        })
        setLocalStream(stream)
        if (localVideoRef.current) localVideoRef.current.srcObject = stream
        stream.getTracks().forEach(track => pc.addTrack(track, stream))
        setIsVideoOn(true)
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        socket.emit('video-answer', { roomCode, answer, senderId: socket.id })
      } catch (err) {
        console.error('Error answering call:', err)
      }
    })

    socket.on('video-answer', async ({ answer }) => {
      try {
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer))
        }
      } catch (err) {
        console.error('Error setting remote desc:', err)
      }
    })

    socket.on('ice-candidate', async ({ candidate }) => {
      try {
        if (peerConnectionRef.current && candidate) {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate))
        }
      } catch (err) {
        console.error('Error adding ICE candidate:', err)
      }
    })

    socket.on('video-end', () => endVideoCall())

    return () => {
      socket.off('connect'); socket.off('disconnect'); socket.off('room-users')
      socket.off('user-joined'); socket.off('user-left'); socket.off('receive-message')
      socket.off('message-sent'); socket.off('user-typing'); socket.off('user-stop-typing')
      socket.off('video-offer'); socket.off('video-answer'); socket.off('ice-candidate'); socket.off('video-end')
      disconnectSocket()
      endVideoCall()
      recognitionStopRef.current?.()
      recognitionStopRef.current = null
    }
  // ⚠️  myLang and isAudioOnly intentionally NOT in deps — changing these should not reconnect socket.
  // Instead, changes are propagated via refs and room-update events.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode, user])

  function createPeerConnection() {
    const pc = new RTCPeerConnection(ICE_SERVERS)
    peerConnectionRef.current = pc

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('ice-candidate', { roomCode, candidate: event.candidate, senderId: socketRef.current.id })
      }
    }

    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0]
        setIsRemoteVideoOn(true)
      }
    }

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
        endVideoCall()
      }
    }

    return pc
  }

  async function startVideoCall() {
    try {
      const constraints = { 
        video: !isAudioOnly, 
        audio: { 
          echoCancellation: true, 
          noiseSuppression: true, 
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1
        } 
      }
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      setLocalStream(stream)
      if (localVideoRef.current) localVideoRef.current.srcObject = stream

      const pc = createPeerConnection()
      stream.getTracks().forEach(track => pc.addTrack(track, stream))

      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      socketRef.current?.emit('video-offer', { roomCode, offer, senderId: socketRef.current.id })
      setIsVideoOn(true)
    } catch (err) {
      console.error('Error starting call:', err)
      setMessages(prev => [...prev, { type: 'system', text: '❌ Access denied or hardware unavailable', timestamp: new Date().toISOString() }])
    }
  }

  async function toggleScreenSharing() {
    if (isScreenSharing) {
      stopScreenSharing()
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true })
        setScreenStream(stream)
        setIsScreenSharing(true)

        const videoTrack = stream.getVideoTracks()[0]

        // If in a call, replace the video track
        if (peerConnectionRef.current) {
          const sender = peerConnectionRef.current.getSenders().find(s => s.track?.kind === 'video')
          if (sender) {
            sender.replaceTrack(videoTrack)
          }
        }

        // Auto stop when user clicks browser's "Stop sharing" button
        videoTrack.onended = () => stopScreenSharing()

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
        }
      } catch (err) {
        console.error('Error starting screen share:', err)
      }
    }
  }

  function stopScreenSharing() {
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop())
      setScreenStream(null)
    }
    setIsScreenSharing(false)

    // Switch back to camera if possible
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream
      if (peerConnectionRef.current) {
        const cameraTrack = localStream.getVideoTracks()[0]
        const sender = peerConnectionRef.current.getSenders().find(s => s.track.kind === 'video')
        if (sender && cameraTrack) {
          sender.replaceTrack(cameraTrack)
        }
      }
    } else if (!localStream) {
      // If we weren't using camera, just stop video
      if (peerConnectionRef.current) {
        const sender = peerConnectionRef.current.getSenders().find(s => s.track.kind === 'video')
        if (sender) sender.replaceTrack(null)
      }
      if (localVideoRef.current) localVideoRef.current.srcObject = null
    }
  }

  function endVideoCall() {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }
    if (localStream) {
      localStream.getTracks().forEach(t => t.stop())
      setLocalStream(null)
    }
    if (screenStream) {
      screenStream.getTracks().forEach(t => t.stop())
      setScreenStream(null)
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null
    setIsVideoOn(false)
    setIsRemoteVideoOn(false)
    setIsVideoExpanded(false)
    setIsScreenSharing(false)
    socketRef.current?.emit('video-end', { roomCode })
  }

  const sendMessage = useCallback((text) => {
    if (!text.trim() || !socketRef.current) return
    if (text.trim() === lastSentRef.current) return
    lastSentRef.current = text.trim()
    // Use ref for lang so this callback doesn't need to be recreated on every lang change
    socketRef.current.emit('send-message', {
      roomCode, userId: user?.id || 'guest', userName: user?.name || 'Guest',
      originalText: text.trim(), sourceLang: myLangRef.current, nlpMode: nlpModeRef.current
    })
    setTimeout(() => { lastSentRef.current = '' }, 800)
  }, [roomCode, user])

  const toggleListening = () => {
    if (isListening) {
      recognitionStopRef.current?.()
      recognitionStopRef.current = null
      setIsListening(false)
      if (currentTranscript.trim()) {
        sendMessage(currentTranscript.trim())
        setCurrentTranscript('')
      }
    } else {
      if (!speechSupported) return
      setCurrentTranscript('')
      lastSentRef.current = ''

      const result = createContinuousRecognition(
        myLang,
        (interimText) => setCurrentTranscript(interimText),
        (sentence) => {
          if (sentence) {
            sendMessage(sentence)
            setCurrentTranscript('')
          }
        },
        (error) => {
          console.error('Speech error:', error)
          setIsListening(false)
          recognitionStopRef.current = null
          setSpeechError(typeof error === 'string' ? error : 'Speech recognition failed. Try again.')
          setTimeout(() => setSpeechError(''), 5000)
        }
      )

      if (result) {
        recognitionRef.current = result.recognition
        recognitionStopRef.current = result.stop
        setIsListening(true)
      }
    }
  }

  const handleTextSend = () => { if (!textInput.trim()) return; sendMessage(textInput.trim()); setTextInput(''); lastSentRef.current = '' }
  const replayAudio = (text, lang) => { speak(text, lang).catch(() => {}) }
  const formatTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="h-dvh bg-dark-950 flex flex-col overflow-hidden noise-overlay">
      {/* Header */}
      <header className="glass-strong border-b border-white/[0.05] px-4 md:px-8 py-4 flex items-center justify-between shrink-0 z-30 relative shadow-2xl">
        <div className="flex items-center gap-4">
          <button onClick={() => { endVideoCall(); navigate('/dashboard') }}
            className="w-10 h-10 md:w-11 md:h-11 flex items-center justify-center rounded-2xl bg-dark-900/60 hover:bg-dark-800 text-dark-300 transition-all hover:scale-105 border border-white/[0.05] shadow-lg shrink-0 group">
            <FiArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-0.5">
              <h1 className="text-white font-black text-base md:text-lg tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                Room <span className="gradient-text font-mono tracking-[0.1em]">{roomCode}</span>
              </h1>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]' : 'bg-rose-500'} transition-colors ml-1`} />
            </div>
            <p className="text-dark-500 text-[10px] md:text-xs font-black uppercase tracking-[0.15em] flex items-center gap-1.5 leading-none">
              <FiUsers size={12} className="text-primary-400" /> {roomUsers.length} ONLINE
              <span className="opacity-30 mx-1">•</span> 
              {isAudioOnly ? <><span className="text-primary-400 flex items-center gap-1"><FiRadio size={12} /> AUDIO ONLY</span></> : <><span className="text-accent-400 flex items-center gap-1"><FiVideo size={12} /> HD VIDEO</span></>}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {/* Audio Only Toggle */}
          <button onClick={() => setIsAudioOnly(!isAudioOnly)}
            className={`hidden md:flex items-center gap-2 px-4 h-11 rounded-xl border transition-all font-bold text-xs uppercase tracking-widest ${isAudioOnly ? 'bg-primary-500/20 border-primary-500/30 text-primary-400 shadow-lg' : 'bg-dark-900/60 border-white/10 text-dark-400 hover:bg-dark-800'}`}
          >
            {isAudioOnly ? <><FiRadio size={14} /> Mode: Audio</> : <><FiVideo size={14} /> Mode: Video</>}
          </button>

          <div className="relative">
            <select
              value={myLang}
              onChange={(e) => {
                const newLang = e.target.value
                setMyLang(newLang)
                // Notify server of language change without reconnecting
                if (socketRef.current?.connected) {
                  socketRef.current.emit('update-language', { roomCode, language: newLang })
                }
              }}
              className="select-field text-xs font-black py-2.5 px-4 bg-dark-900/60 border-white/10 hover:border-primary-500/30 transition-all cursor-pointer min-w-[130px] rounded-xl appearance-none pr-10"
            >
              {LANGUAGES.map(l => (<option key={l.code} value={l.code} className="bg-dark-900">{l.flag} {l.name.toUpperCase()}</option>))}
            </select>
            <FiGlobe className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-400 pointer-events-none" size={14} />
          </div>

          <button onClick={() => setAutoSpeak(!autoSpeak)}
            className={`w-10 h-10 md:w-11 md:h-11 flex items-center justify-center rounded-xl transition-all border ${autoSpeak ? 'bg-primary-500/20 text-primary-400 border-primary-500/30 shadow-lg' : 'bg-dark-900/60 text-dark-500 border-white/10 hover:bg-dark-800'}`}
            title={autoSpeak ? 'Mute Speaker' : 'Unmute Speaker'}>
            {autoSpeak ? <FiVolume2 size={20} /> : <FiVolumeX size={20} />}
          </button>

          {isVideoOn && (
            <button onClick={toggleScreenSharing}
              className={`w-10 h-10 md:w-11 md:h-11 flex items-center justify-center rounded-xl transition-all border ${isScreenSharing ? 'bg-primary-500 text-white border-primary-500 shadow-lg' : 'bg-dark-900/60 text-dark-500 border-white/10 hover:bg-dark-800'}`}
              title={isScreenSharing ? 'Stop Sharing' : 'Share Screen'}>
              <FiMonitor size={20} />
            </button>
          )}

          {!isVideoOn ? (
            <button onClick={startVideoCall}
              className="w-10 h-10 md:w-11 md:h-11 flex items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20 hover:scale-110 active:scale-95 transition-all"
              title="Start Call">
              {isAudioOnly ? <FiMic size={20} /> : <FiVideo size={20} />}
            </button>
          ) : (
            <button onClick={endVideoCall}
              className="w-10 h-10 md:w-11 md:h-11 flex items-center justify-center rounded-xl bg-rose-500 text-white shadow-lg shadow-rose-500/25 hover:scale-110 active:scale-95 transition-all animate-pulse"
              title="End Call">
              <FiPhoneOff size={20} />
            </button>
          )}
        </div>
      </header>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Connection Mesh */}
        <div className="absolute inset-0 mesh-gradient opacity-20 pointer-events-none" />

        {/* Video section */}
        {isVideoOn && !isAudioOnly && (
          <div className={`shrink-0 bg-dark-900/80 backdrop-blur-md border-b border-white/5 transition-all duration-500 ease-in-out ${isPresentationMode ? 'h-[70dvh]' : isVideoExpanded ? 'h-[50dvh]' : 'h-[240px] md:h-[300px]'}`}>
            <div className={`h-full p-4 flex gap-4 relative max-w-7xl mx-auto w-full ${isPresentationMode ? 'flex-col md:flex-row' : ''}`}>
              {/* Remote video */}
              <div className={`relative rounded-[1.5rem] overflow-hidden shadow-2xl bg-black/40 border border-white/5 transition-all ${isPresentationMode ? 'flex-[3]' : 'flex-1'}`}>
                <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                {!isRemoteVideoOn && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-dark-900/95">
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center mb-6 border border-white/5 animate-pulse">
                      <FiVideo className="text-primary-400 text-3xl" />
                    </div>
                    <p className="text-white font-black text-sm uppercase tracking-[0.2em] opacity-80">Waiting for partner...</p>
                  </div>
                )}
                {/* Active user badge */}
                {isRemoteVideoOn && (
                  <div className="absolute top-4 left-4 flex items-center gap-3 backdrop-blur-xl bg-black/40 border border-white/10 rounded-2xl px-4 py-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-recording shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                    <span className="text-white text-[10px] font-black uppercase tracking-widest">
                      {roomUsers.find(u => u.socketId !== socketRef.current?.id)?.userName || 'PARTNER'}
                    </span>
                    {isPresentationMode && <span className="text-accent-400 text-[10px] font-black border-l border-white/10 pl-3 uppercase">Presenting</span>}
                  </div>
                )}
              </div>

              {/* Local video (PiP) */}
              <div className={`group relative rounded-[1.25rem] overflow-hidden border-2 border-primary-500/30 shrink-0 transition-all duration-300 shadow-2xl ${isPresentationMode ? 'w-full md:w-[260px]' : isVideoExpanded ? 'w-[240px]' : 'w-[140px] md:w-[200px]'}`}>
                <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
                <div className="absolute top-2 left-2 bg-black/40 backdrop-blur-md rounded-lg px-2 py-1 border border-white/10">
                  <span className="text-white text-[8px] font-black uppercase tracking-widest">{isScreenSharing ? 'Screen Sharing' : 'Self View'}</span>
                </div>
              </div>

              {/* Layout controls */}
              <div className="absolute top-8 right-8 flex flex-col gap-2 z-20">
                <button onClick={() => setIsPresentationMode(!isPresentationMode)}
                  className={`w-10 h-10 rounded-xl backdrop-blur-xl border border-white/10 flex items-center justify-center transition-all shadow-xl ${isPresentationMode ? 'bg-accent-500 text-white' : 'bg-black/40 text-white hover:bg-accent-500'}`}
                  title="Presentation Mode">
                  <FiLayout size={18} />
                </button>
                <button onClick={() => setIsVideoExpanded(!isVideoExpanded)}
                  className="w-10 h-10 rounded-xl bg-black/40 backdrop-blur-xl border border-white/10 text-white flex items-center justify-center hover:bg-primary-500 transition-all shadow-xl">
                  {isVideoExpanded ? <FiMinimize2 size={18} /> : <FiMaximize2 size={18} />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Audio Only Mode Visualizer Placeholder */}
        {isVideoOn && isAudioOnly && (
          <div className="shrink-0 h-[200px] bg-gradient-to-b from-dark-900 to-dark-950 flex flex-col items-center justify-center border-b border-white/5 px-6">
            <div className="flex items-center gap-6 mb-4">
              <div className="w-20 h-20 rounded-full bg-primary-500/10 border-2 border-primary-500/20 flex items-center justify-center relative">
                <div className="absolute inset-0 bg-primary-500/10 rounded-full animate-ping opacity-20" />
                <FiMic className="text-primary-400 text-3xl" />
              </div>
              <div className="h-4 w-40 md:w-64 bg-dark-800 rounded-full overflow-hidden flex items-center gap-1.5 px-1">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="flex-1 bg-primary-500/40 rounded-full animate-recording" style={{ height: `${Math.random() * 60 + 20}%`, animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
              <div className="w-20 h-20 rounded-full bg-accent-500/10 border-2 border-accent-500/20 flex items-center justify-center">
                <FiVolume2 className="text-accent-400 text-3xl" />
              </div>
            </div>
            <p className="text-dark-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2 tracking-widest animate-pulse">Encryption Secure Connection</p>
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center p-10 animate-fade-in">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-[2.5rem] bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center mb-8 border border-white/5 animate-pulse shadow-2xl shadow-primary-500/10 group relative overflow-hidden">
                <FiMic className="text-primary-400 text-4xl md:text-5xl drop-shadow-lg group-hover:scale-110 transition-transform" />
                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent" />
              </div>
              <h2 className="text-white text-3xl md:text-4xl font-black mb-4 tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>Neural Engine Ready</h2>
              <p className="text-dark-500 text-sm md:text-base max-w-md leading-relaxed mb-10 font-medium">
                Your voice is translated in real-time. Start talking in <span className="text-primary-400 font-bold">{myLangInfo.name}</span> to begin.
              </p>
              <div className="bg-dark-900/60 backdrop-blur-xl rounded-[1.5rem] border border-white/5 px-8 pt-4 pb-6 shadow-2xl">
                <span className="text-dark-600 text-[10px] font-black uppercase tracking-[0.2em] block mb-4">Secure Room Code</span>
                <div className="flex items-center gap-6">
                  <span className="text-white font-mono text-3xl tracking-[0.3em] font-black italic">{roomCode}</span>
                  <button onClick={() => { navigator.clipboard.writeText(roomCode) }} className="w-10 h-10 rounded-xl bg-primary-500/10 text-primary-400 flex items-center justify-center hover:bg-primary-500 hover:text-white transition-all">
                    <FiCopy size={18} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {messages.map((msg, i) => {
            if (msg.type === 'system') {
              return (
                <div key={i} className="flex justify-center py-2">
                  <span className="px-5 py-2 rounded-full bg-dark-900/60 border border-white/5 text-[10px] font-black text-dark-500 uppercase tracking-widest backdrop-blur-md">
                    <FiInfo className="inline mr-2" size={12} /> {msg.text}
                  </span>
                </div>
              )
            }

            const isSent = msg.type === 'sent' || (user?.id && msg.senderId === user.id)
            const sourceLangInfo = LANGUAGES.find(l => l.code === msg.sourceLang)
            const targetLangInfo = LANGUAGES.find(l => l.code === msg.targetLang)

            return (
              <div key={i} className={`flex flex-col ${isSent ? 'items-end' : 'items-start'} animate-slide-up relative group`}>
                <div className={`flex items-baseline gap-3 mb-2 px-1 ${isSent ? 'flex-row-reverse' : ''}`}>
                  <span className="text-[10px] font-black text-white uppercase tracking-wider">{isSent ? 'You' : msg.senderName || 'USER'}</span>
                  <span className="text-[9px] font-black text-dark-600 uppercase tracking-widest">{formatTime(msg.timestamp)}</span>
                </div>

                <div className={`max-w-[90%] md:max-w-[75%] rounded-[2rem] overflow-hidden shadow-2xl transition-all duration-300 ${isSent ? 'rounded-tr-sm' : 'rounded-tl-sm'} border border-white/5`}>
                  {/* Original Text Bubble */}
                  <div className={`px-6 py-5 ${isSent ? 'bg-primary-600/20 backdrop-blur-sm' : 'bg-dark-900/80 backdrop-blur-md'}`}>
                    <div className="flex items-start justify-between gap-6">
                      <div className="space-y-3">
                        <span className={`text-[9px] font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded shadow-sm inline-block ${isSent ? 'bg-primary-500/20 text-primary-300 border border-primary-500/20' : 'bg-dark-800 text-dark-400 border border-white/5'}`}>
                          {sourceLangInfo?.flag} {sourceLangInfo?.name}
                        </span>
                        <p className={`text-sm md:text-base font-bold leading-relaxed ${isSent ? 'text-white' : 'text-dark-100'}`}>{msg.originalText}</p>
                      </div>
                      <button onClick={() => replayAudio(msg.originalText, msg.sourceLang)}
                        className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-all shrink-0 ${isSent ? 'bg-primary-500/10 text-primary-400 hover:bg-primary-500' : 'bg-dark-800/80 text-dark-500 hover:bg-dark-700 hover:text-white'} hover:text-white`}>
                        <FiVolume2 size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Translated Text Bubble */}
                  {msg.translatedText && msg.translatedText !== msg.originalText && (
                    <div className="px-6 py-5 bg-gradient-to-br from-accent-600/20 via-accent-600/10 to-transparent border-t border-white/[0.05]">
                      <div className="flex items-start justify-between gap-6">
                        <div className="space-y-3">
                          <span className={`text-[9px] font-black uppercase tracking-[0.15em] flex items-center gap-2 ${msg.nlpMode ? 'text-amber-400' : 'text-accent-400'}`}>
                             <span className={`w-1.5 h-1.5 rounded-full ${msg.nlpMode ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]' : 'bg-accent-500 shadow-[0_0_8px_rgba(236,72,153,0.5)]'}`} />
                             {targetLangInfo?.flag} {targetLangInfo?.name} 
                             {msg.nlpMode ? <span className="ml-1 bg-amber-400/20 px-1.5 py-0.5 rounded shadow-sm border border-amber-400/30 text-amber-300">✨ NLP CONTEXT</span> : '(TRANS)'}
                          </span>
                          <p className={`text-sm md:text-base font-black leading-relaxed italic ${msg.nlpMode ? 'text-amber-50 drop-shadow-md' : 'text-white opacity-90'}`}>{msg.translatedText}</p>
                        </div>
                        <button onClick={() => replayAudio(msg.translatedText, msg.targetLang)}
                          className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-all shrink-0 ${msg.nlpMode ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-white' : 'bg-accent-500/10 text-accent-400 hover:bg-accent-500 hover:text-white'}`}>
                          <FiVolume2 size={18} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {typingUser && (
            <div className="flex items-center gap-3 text-dark-500 font-black animate-fade-in">
              <div className="flex gap-1.5">
                {[0, 0.2, 0.4].map((d, i) => (
                  <div key={i} className="w-2 h-2 bg-primary-500/40 rounded-full animate-bounce" style={{ animationDelay: `${d}s` }} />
                ))}
              </div>
              <span className="text-[10px] uppercase tracking-widest">{typingUser} is speaking...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Speech Error Banner */}
      {speechError && (
        <div className="px-6 py-3 bg-rose-500/10 border-t border-rose-500/20 flex items-center gap-3 shrink-0 z-30 animate-fade-in">
          <div className="w-5 h-5 shrink-0 rounded-full bg-rose-500/20 flex items-center justify-center border border-rose-500/30">
            <span className="text-rose-400 text-xs font-black">!</span>
          </div>
          <p className="text-rose-300 text-sm font-medium flex-1">{speechError}</p>
          <button onClick={() => setSpeechError('')} className="text-rose-400 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors">Dismiss</button>
        </div>
      )}

      {/* Transcription Layer */}
      {currentTranscript && (
        <div className="px-6 md:px-12 py-4 md:py-6 bg-primary-500/10 backdrop-blur-2xl border-t border-primary-500/30 relative z-30 animate-slide-up shadow-2xl">
          <div className="max-w-4xl mx-auto flex items-start gap-4">
            <div className="w-1.5 h-1.5 mt-2.5 rounded-full bg-rose-500 animate-recording shrink-0" />
            <div className="flex-1">
              <span className="text-primary-400 text-[10px] font-black uppercase tracking-[0.3em] mb-2 block">Voice Input Stream</span>
              <p className="text-white text-base md:text-lg font-black leading-tight drop-shadow-md">{currentTranscript}<span className="animate-pulse">|</span></p>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Controls */}
      <div className="glass-strong border-t border-white/[0.05] px-4 md:px-8 pt-6 pb-8 md:pb-12 shrink-0 z-40 relative shadow-[0_-20px_50px_rgba(0,0,0,0.6)]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-4 md:gap-8">
          
          <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto">
             <button onClick={() => setIsPresentationMode(!isPresentationMode)}
               className={`w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-2xl transition-all border ${isPresentationMode ? 'bg-accent-500 text-white border-accent-400 shadow-lg' : 'bg-dark-900/60 text-dark-400 border-white/10 hover:bg-dark-800'}`}
               title="Toggle Presentation Mode">
               <FiLayout size={20} />
             </button>
             <button onClick={() => setNlpMode(!nlpMode)}
               className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 h-12 md:h-14 rounded-2xl border transition-all font-black text-[10px] md:text-sm uppercase tracking-[0.1em] ${nlpMode ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.2)] animate-pulse-glow-amber' : 'bg-dark-900/60 border-white/10 text-dark-500 hover:bg-dark-800'}`}>
               <span className="text-lg">✨</span> {nlpMode ? 'AI Context' : 'Standard'}
             </button>
          </div>

          <div className="flex-1 w-full relative group">
            <input type="text" value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTextSend()}
              className="input-field h-14 md:h-16 pr-16 text-sm md:text-base border-white/[0.08]"
              placeholder={`Send message in ${myLangInfo.name}...`} />
            <button onClick={handleTextSend}
              disabled={!textInput.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl bg-primary-500 text-white disabled:opacity-20 transition-all hover:scale-110 active:scale-95 shadow-xl shadow-primary-500/20">
              <FiSend size={20} />
            </button>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {speechSupported && (
              <button onClick={toggleListening}
                className={`flex-1 md:w-16 md:h-16 md:rounded-[1.75rem] h-14 rounded-2xl flex items-center justify-center transition-all duration-500 relative ${
                  isListening
                    ? 'bg-rose-500 text-white scale-105 shadow-3xl shadow-rose-500/40'
                    : 'bg-gradient-to-br from-primary-500 to-accent-600 text-white shadow-2xl shadow-primary-500/30'
                }`}
              >
                <div className={`absolute inset-0 bg-white/20 rounded-full animate-ping pointer-events-none ${isListening ? 'opacity-40' : 'opacity-0'}`} />
                {isListening ? (
                  <div className="flex items-center gap-2">
                    <FiMicOff size={22} /><span className="text-[10px] font-black uppercase md:hidden tracking-widest">Stop Voice</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <FiMic size={22} /><span className="text-[10px] font-black uppercase md:hidden tracking-widest">Start Voice</span>
                  </div>
                )}
              </button>
            )}
            <button onClick={() => { endVideoCall(); navigate('/dashboard') }}
              className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-2xl bg-rose-600 text-white hover:bg-rose-700 transition-all shadow-xl shadow-rose-600/20">
              <FiPhoneOff size={22} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
