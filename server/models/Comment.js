const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  videoId: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  // BUG #2 FIX: Added missing fields that were being discarded by Mongoose
  username: {
    type: String,
    default: 'User'
  },
  avatar: {
    type: String,
    default: ''
  },
  text: {
    type: String,
    required: true
  },
  parentId: {
    type: String,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Comment', commentSchema);
