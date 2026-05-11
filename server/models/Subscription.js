const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  channelId: {
    type: String,
    required: true
  }
}, { timestamps: true });

// Ensure a user can only subscribe to a channel once
subscriptionSchema.index({ userId: 1, channelId: 1 }, { unique: true });

module.exports = mongoose.model('Subscription', subscriptionSchema);
