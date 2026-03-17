const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  user1Id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  user2Id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  roomCode: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  scheduledAt: {
    type: Date
  },
  duration: {
    type: Number, // in minutes
    default: 60
  },
  status: {
    type: String,
    enum: ['active', 'scheduled', 'completed'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Conversation', conversationSchema);
