const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firebaseUid: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  // Password kept optional — only set for legacy email/password users
  password: {
    type: String,
    minlength: 6,
    default: null
  },
  photoURL: {
    type: String,
    default: ''
  },
  provider: {
    type: String,
    enum: ['email', 'google'],
    default: 'email'
  },
  language: {
    type: String,
    default: 'en',
    enum: ['en','ta','hi','ml','fr','es','zh','ja','ar','de','ko','pt','ru','it','te','bn','th','vi','tr','nl']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);
