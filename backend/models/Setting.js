const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  weeklyHolidayEnabled: {
    type: Boolean,
    default: true,
  }
}, { timestamps: true });

module.exports = mongoose.model('Setting', settingSchema);
