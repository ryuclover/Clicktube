const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema({
  videoId: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['like', 'dislike'],
    required: true
  }
}, { timestamps: true });

likeSchema.index({ videoId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Like', likeSchema);
