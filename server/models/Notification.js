const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: String,
    required: true
  },
  type: {
    type: String, // 'comment', 'subscribe', etc.
    required: true
  },
  fromUser: {
    id: String,
    username: String,
    avatar: String
  },
  videoId: {
    type: String,
    default: null
  },
  message: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// P1: inbox reads newest-first
notificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
