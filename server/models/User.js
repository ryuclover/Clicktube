const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    default: 'https://i.pravatar.cc/150'
  },
  bio: {
    type: String,
    default: ''
  },
  subscribers: {
    type: Number,
    default: 0
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  banner: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
