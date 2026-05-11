const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  videoIds: [{
    type: String
  }]
}, { timestamps: true });

module.exports = mongoose.model('Playlist', playlistSchema);
