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
  text: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Comment', commentSchema);
