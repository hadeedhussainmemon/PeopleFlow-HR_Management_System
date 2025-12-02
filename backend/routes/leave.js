const express = require('express');
const router = express.Router();
const {
  applyLeave,
  getMyLeaves,
  getPendingLeaves,
  updateLeaveStatus,
  getApprovedLeaves,
  cancelLeaveRequest,
  exportLeaves
} = require('../controllers/leaveController');
const { protect } = require('../middleware/authMiddleware');
const { manager, admin } = require('../middleware/roleMiddleware');

router.route('/apply').post(protect, applyLeave);
router.route('/my-leaves').get(protect, getMyLeaves);
router.route('/pending').get(protect, manager, getPendingLeaves);
router.route('/approved').get(protect, manager, getApprovedLeaves);
router.route('/:id/status').patch(protect, manager, updateLeaveStatus);
router.route('/:id/cancel').patch(protect, cancelLeaveRequest);
router.route('/export').get(protect, admin, exportLeaves);

module.exports = router;
