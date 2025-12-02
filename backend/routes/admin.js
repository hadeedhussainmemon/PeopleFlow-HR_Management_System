const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/roleMiddleware');
const { getSettings, updateSettings } = require('../controllers/adminController');

// GET /api/admin/settings - get current admin settings
router.get('/settings', protect, admin, getSettings);

// PUT /api/admin/settings - update settings (admin only)
router.put('/settings', protect, admin, updateSettings);

module.exports = router;
