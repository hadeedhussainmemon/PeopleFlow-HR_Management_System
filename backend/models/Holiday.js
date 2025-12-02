const mongoose = require('mongoose');

const holidaySchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: Date, required: true, unique: true }
});

module.exports = mongoose.model('Holiday', holidaySchema);
