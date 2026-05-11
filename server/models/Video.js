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
  }
}, { timestamps: true });

module.exports = mongoose.model('Video', videoSchema);
