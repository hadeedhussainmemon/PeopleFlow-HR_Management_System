const express = require('express');
const router = express.Router();
const { 
  getAllUsers, 
  getUserById, 
  createUser, 
  updateUser, 
  deleteUser,
  getDashboardStats,
  accrueLeaves,
  exportUsersCSV,
  getUserActivity
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/roleMiddleware');

router.route('/').get(protect, admin, getAllUsers).post(protect, admin, createUser);
router.route('/export').get(protect, admin, exportUsersCSV);
router.route('/accrue').post(protect, admin, accrueLeaves);
router.route('/stats/dashboard').get(protect, admin, getDashboardStats);
router.route('/:id').get(protect, admin, getUserById).put(protect, admin, updateUser).delete(protect, admin, deleteUser);
router.route('/:id/activity').get(protect, admin, getUserActivity);

module.exports = router;
