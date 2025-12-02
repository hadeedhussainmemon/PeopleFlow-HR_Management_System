const mongoose = require('mongoose');

const leaveRequestSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  leaveType: {
    type: String,
    enum: ['sick', 'casual', 'vacation'],
    required: true
  },
  reason: { type: String },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  daysCalculated: { type: Number }, // The result of your logic (e.g., 3 days)
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectionReason: { type: String } // Optional: why was it said no?
}, { timestamps: true });

// Indexes for common queries
leaveRequestSchema.index({ employeeId: 1, status: 1 });
leaveRequestSchema.index({ status: 1, startDate: 1, endDate: 1 });
leaveRequestSchema.index({ createdAt: -1 });

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema);
