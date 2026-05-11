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

module.exports = mongoose.model('Notification', notificationSchema);
