const Holiday = require('../models/Holiday');

// @desc    Create a new holiday
// @route   POST /api/holidays
// @access  Private/Admin
const createHoliday = async (req, res) => {
  const { name, date } = req.body;

  try {
    const holiday = await Holiday.create({
      name,
      date,
    });

    res.status(201).json(holiday);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all holidays
// @route   GET /api/holidays
// @access  Private
const getHolidays = async (req, res) => {
  try {
    const holidays = await Holiday.find({}).sort({ date: 1 });
    res.json(holidays);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update holiday
// @route   PUT /api/holidays/:id
// @access  Private/Admin
const updateHoliday = async (req, res) => {
  const { name, date } = req.body;

  try {
    const holiday = await Holiday.findById(req.params.id);

    if (!holiday) {
      return res.status(404).json({ message: 'Holiday not found' });
    }

    holiday.name = name || holiday.name;
    holiday.date = date || holiday.date;

    const updatedHoliday = await holiday.save();
    res.json(updatedHoliday);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete holiday
// @route   DELETE /api/holidays/:id
// @access  Private/Admin
const deleteHoliday = async (req, res) => {
  try {
    const holiday = await Holiday.findById(req.params.id);

    if (!holiday) {
      return res.status(404).json({ message: 'Holiday not found' });
    }

    await Holiday.findByIdAndDelete(req.params.id);
    res.json({ message: 'Holiday deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createHoliday, getHolidays, updateHoliday, deleteHoliday };
