const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  url: {
    type: String,
    required: true
  },
  thumbnail: {
    type: String,
    required: true
  },
  uploaderId: {
    type: String,
    required: true
  },
  views: {
    type: Number,
    default: 0
  },
  viewedBy: {
    type: [String],
    default: []
  },
  category: {
    type: String,
    default: 'General'
  },
  tags: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['public', 'private', 'draft'],
    default: 'public'
  },
  duration: {
    type: String,
    default: '0:00'
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

// P2: soft-delete filter support
videoSchema.index({ deletedAt: 1 });

// P1: feed indexes — filtered list, trending sort, text search
videoSchema.index({ status: 1, category: 1, createdAt: -1 });
videoSchema.index({ status: 1, createdAt: -1 });
videoSchema.index({ views: -1 });
videoSchema.index({ uploaderId: 1, createdAt: -1 });
videoSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Video', videoSchema);
