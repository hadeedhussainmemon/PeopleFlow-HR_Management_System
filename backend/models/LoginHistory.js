const mongoose = require('mongoose');

const loginHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ip: { type: String },
  userAgent: { type: String },
}, { timestamps: true });

// Index for fast queries by user
loginHistorySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('LoginHistory', loginHistorySchema);
