const User = require('../models/User');
const LeaveRequest = require('../models/LeaveRequest');
const bcrypt = require('bcryptjs');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    const query = search
      ? {
          $or: [
            { firstName: { $regex: search, $options: 'i' } },
            { lastName: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { department: { $regex: search, $options: 'i' } }
          ]
        }
      : {};

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .populate('managerId', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query)
    ]);

    res.json({ items: users, page, limit, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('managerId', 'firstName lastName');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a new user
// @route   POST /api/users
// @access  Private/Admin
const createUser = async (req, res) => {
  const { firstName, lastName, email, password, role, department, managerId } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Prevent creating another admin
    if (role === 'admin' && email !== process.env.ADMIN_EMAIL) {
      return res.status(400).json({ message: 'Cannot create another admin user. Only the system admin is allowed.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role,
      department,
      managerId,
    });

    res.status(201).json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
  const { firstName, lastName, email, role, department, managerId, leaveBalance } = req.body;

  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    // Prevent promoting to admin
    if (role === 'admin' && user.email !== process.env.ADMIN_EMAIL && email !== process.env.ADMIN_EMAIL) {
      return res.status(400).json({ message: 'Cannot promote user to admin. Only the system admin is allowed.' });
    }

    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.email = email || user.email;
    user.role = role || user.role;
    user.department = department || user.department;
    user.managerId = managerId !== undefined ? managerId : user.managerId;
    
    if (leaveBalance) {
      user.leaveBalance = { ...user.leaveBalance, ...leaveBalance };
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
      role: updatedUser.role,
      department: updatedUser.department,
      leaveBalance: updatedUser.leaveBalance
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Don't allow deleting yourself
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get admin dashboard stats
// @route   GET /api/users/stats/dashboard
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
  try {
    const [totalUsers, totalLeaves, pendingLeaves, approvedLeaves, rejectedLeaves] = await Promise.all([
      User.countDocuments(),
      LeaveRequest.countDocuments(),
      LeaveRequest.countDocuments({ status: 'pending' }),
      LeaveRequest.countDocuments({ status: 'approved' }),
      LeaveRequest.countDocuments({ status: 'rejected' })
    ]);

    const recentLeaves = await LeaveRequest.find()
      .populate('employeeId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    res.json({
      totalUsers,
      totalLeaves,
      pendingLeaves,
      approvedLeaves,
      rejectedLeaves,
      recentLeaves
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Accrue monthly leaves for all users
// @route   POST /api/users/accrue
// @access  Private/Admin
const accrueLeaves = async (req, res) => {
  const { vacation = 0, sick = 0, casual = 0 } = req.body;

  try {
    const result = await User.updateMany(
      {},
      {
        $inc: {
          'leaveBalance.vacation': vacation,
          'leaveBalance.sick': sick,
          'leaveBalance.casual': casual
        }
      }
    );

    res.json({ 
      message: 'Leaves accrued successfully', 
      modifiedCount: result.modifiedCount 
    });
  } catch (error) {
    console.error('Accrue leaves error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { 
  getAllUsers, 
  getUserById, 
  createUser, 
  updateUser, 
  deleteUser,
  getDashboardStats,
  accrueLeaves
};
