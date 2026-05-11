const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  videoId: {
    type: String,
    required: true
  },
  watchedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Ensure unique history entry per user/video to avoid duplicates (just update watchedAt)
historySchema.index({ userId: 1, videoId: 1 }, { unique: true });

module.exports = mongoose.model('History', historySchema);
