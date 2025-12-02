const express = require('express');
const router = express.Router();
const { createHoliday, getHolidays, updateHoliday, deleteHoliday } = require('../controllers/holidayController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/roleMiddleware');

router.route('/').post(protect, admin, createHoliday).get(protect, getHolidays);
router.route('/:id').put(protect, admin, updateHoliday).delete(protect, admin, deleteHoliday);

module.exports = router;
