const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true }, // Hashed with bcrypt
  phone: { type: String },
  role: {
    type: String,
    enum: ['employee', 'manager', 'admin'],
    default: 'employee'
  },
  department: { type: String },
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Who approves their leave?
  lastLogin: { type: Date },
  leaveBalance: {
    sick: { type: Number, default: 10 },
    casual: { type: Number, default: 12 },
    vacation: { type: Number, default: 20 },
  },
}, { timestamps: true });

// Indexes for performance
userSchema.index({ managerId: 1 });
userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);
