const Message = require('../models/Message');
const { translate, nlpTranslate } = require('../services/translationService');

// Track connected users per room
const rooms = new Map();

function setupChatHandler(io) {
  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.id}`);

    // Join a room
    socket.on('join-room', ({ roomCode, userId, userName, language }) => {
      socket.join(roomCode);

      // Track user in room
      if (!rooms.has(roomCode)) {
        rooms.set(roomCode, new Map());
      }
      rooms.get(roomCode).set(socket.id, { userId, userName, language, socketId: socket.id });

      // Notify room about new user
      const usersInRoom = Array.from(rooms.get(roomCode).values());
      io.to(roomCode).emit('room-users', usersInRoom);
      socket.to(roomCode).emit('user-joined', { userId, userName, language });

      console.log(`👤 ${userName} joined room ${roomCode} (${language})`);
    });

    // Handle voice/text message
    socket.on('send-message', async ({ roomCode, userId, userName, originalText, sourceLang, nlpMode }) => {
      try {
        if (!originalText?.trim()) return;

        const roomUsers = rooms.get(roomCode);
        if (!roomUsers) return;

        // Collect all users who need a translation (different language, different socket)
        const targets = [];
        for (const [sid, user] of roomUsers) {
          if (sid !== socket.id) {
            targets.push({ sid, lang: user.language });
          }
        }

        // Translate in PARALLEL — much faster for multi-user rooms
        const translationResults = await Promise.all(
          targets.map(async (target) => {
            let translatedText;
            if (target.lang === sourceLang) {
              translatedText = originalText;
            } else if (nlpMode) {
              translatedText = await nlpTranslate(originalText, sourceLang, target.lang);
            } else {
              translatedText = await translate(originalText, sourceLang, target.lang);
            }
            return { ...target, translatedText };
          })
        );

        // Determine primary translation (first other-language user) for DB
        const primary = translationResults.find(r => r.lang !== sourceLang) || translationResults[0];

        // Save to DB (non-blocking — don't await)
        if (primary) {
          const message = new Message({
            conversationId: roomCode,
            senderId: userId,
            senderName: userName,
            originalText,
            translatedText: primary.translatedText,
            sourceLang,
            targetLang: primary.lang
            // Note: If you want to store nlpMode in DB, add it to schema and here
          });
          message.save().catch(e => console.warn('⚠️  DB save failed:', e.message));
        }

        // Deliver to each target
        const timestamp = new Date().toISOString();
        for (const r of translationResults) {
          io.to(r.sid).emit('receive-message', {
            senderId: userId,
            senderName: userName,
            originalText,
            translatedText: r.translatedText,
            sourceLang,
            targetLang: r.lang,
            timestamp,
            nlpMode: !!nlpMode
          });
        }

        // Echo back to sender (they see their own message immediately)
        socket.emit('message-sent', {
          senderId: userId,
          senderName: userName,
          originalText,
          translatedText: originalText, // sender sees their own language
          sourceLang,
          targetLang: sourceLang,
          timestamp,
          nlpMode: !!nlpMode
        });

      } catch (error) {
        console.error('Message handling error:', error);
        socket.emit('error', { message: 'Failed to process message. Please try again.' });
      }
    });


    // ===== WebRTC Signaling =====

    // User wants to start a video call
    socket.on('video-offer', ({ roomCode, offer, senderId }) => {
      socket.to(roomCode).emit('video-offer', { offer, senderId: socket.id });
      console.log(`📹 Video offer from ${socket.id} in room ${roomCode}`);
    });

    // User answers the video call
    socket.on('video-answer', ({ roomCode, answer, senderId }) => {
      socket.to(roomCode).emit('video-answer', { answer, senderId: socket.id });
      console.log(`📹 Video answer from ${socket.id} in room ${roomCode}`);
    });

    // ICE candidate exchange
    socket.on('ice-candidate', ({ roomCode, candidate, senderId }) => {
      socket.to(roomCode).emit('ice-candidate', { candidate, senderId: socket.id });
    });

    // End video call
    socket.on('video-end', ({ roomCode }) => {
      socket.to(roomCode).emit('video-end', { senderId: socket.id });
      console.log(`📹 Video ended by ${socket.id} in room ${roomCode}`);
    });

    // Typing indicator
    socket.on('typing', ({ roomCode, userName }) => {
      socket.to(roomCode).emit('user-typing', { userName });
    });

    socket.on('stop-typing', ({ roomCode, userName }) => {
      socket.to(roomCode).emit('user-stop-typing', { userName });
    });

    // Language change without disconnecting
    socket.on('update-language', ({ roomCode, language }) => {
      if (rooms.has(roomCode) && rooms.get(roomCode).has(socket.id)) {
        rooms.get(roomCode).get(socket.id).language = language;
        const usersInRoom = Array.from(rooms.get(roomCode).values());
        io.to(roomCode).emit('room-users', usersInRoom);
      }
    });


    // Handle disconnect
    socket.on('disconnect', () => {
      for (const [roomCode, users] of rooms) {
        if (users.has(socket.id)) {
          const user = users.get(socket.id);
          users.delete(socket.id);

          const usersInRoom = Array.from(users.values());
          io.to(roomCode).emit('room-users', usersInRoom);
          io.to(roomCode).emit('user-left', { userId: user.userId, userName: user.userName });
          io.to(roomCode).emit('video-end', { senderId: socket.id });

          console.log(`👋 ${user.userName} left room ${roomCode}`);

          if (users.size === 0) {
            rooms.delete(roomCode);
          }
        }
      }
      console.log(`🔌 User disconnected: ${socket.id}`);
    });
  });
}

module.exports = setupChatHandler;
