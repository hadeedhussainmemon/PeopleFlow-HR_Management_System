const Setting = require('../models/Setting');

// Retrieve (or create default) settings
const getSettings = async (req, res) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({});
    }
    res.json(settings);
  } catch (err) {
    console.error('getSettings error', err);
    res.status(500).json({ message: 'Failed to load settings' });
  }
};

// Update settings (admin only)
const updateSettings = async (req, res) => {
  try {
    const { weeklyHolidayEnabled } = req.body;
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({ weeklyHolidayEnabled: !!weeklyHolidayEnabled });
    } else {
      settings.weeklyHolidayEnabled = !!weeklyHolidayEnabled;
      await settings.save();
    }
    res.json(settings);
  } catch (err) {
    console.error('updateSettings error', err);
    res.status(500).json({ message: 'Failed to update settings' });
  }
};

module.exports = { getSettings, updateSettings };
