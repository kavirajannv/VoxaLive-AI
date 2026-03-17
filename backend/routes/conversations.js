const express = require('express');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const auth = require('../middleware/auth');

const router = express.Router();

// Generate room code
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Create new conversation / room (Direct or Scheduled)
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, scheduledAt, duration } = req.body;
    const roomCode = generateRoomCode();
    
    const conversation = new Conversation({
      user1Id: req.user.id,
      roomCode,
      title: title || `Room ${roomCode}`,
      description,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      duration: duration || 60,
      status: scheduledAt ? 'scheduled' : 'active'
    });
    
    await conversation.save();

    res.status(201).json({
      message: scheduledAt ? 'Meeting scheduled' : 'Room created',
      roomCode: conversation.roomCode,
      conversationId: conversation._id,
      scheduledAt: conversation.scheduledAt
    });
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// Get conversations for user (Active)
router.get('/', auth, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      $or: [{ user1Id: req.user.id }, { user2Id: req.user.id }],
      status: 'active'
    }).sort({ createdAt: -1 });

    res.json({ conversations });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get scheduled meetings for user
router.get('/scheduled', auth, async (req, res) => {
  try {
    const meetings = await Conversation.find({
      $or: [{ user1Id: req.user.id }, { user2Id: req.user.id }],
      status: 'scheduled'
    }).sort({ scheduledAt: 1 });

    res.json({ meetings });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch scheduled meetings' });
  }
});

// Get messages for a conversation
router.get('/:roomCode/messages', async (req, res) => {
  try {
    const messages = await Message.find({
      conversationId: req.params.roomCode
    }).sort({ timestamp: 1 }).limit(100);

    res.json({ messages });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

module.exports = router;
