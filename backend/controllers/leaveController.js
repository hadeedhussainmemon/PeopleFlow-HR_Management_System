const LeaveRequest = require('../models/LeaveRequest');
const User = require('../models/User');
const Holiday = require('../models/Holiday');
const { calculateBusinessDays } = require('../utils/dateCalculator');

// @desc    Apply for leave
// @route   POST /api/leaves/apply
// @access  Private
const applyLeave = async (req, res) => {
  const { startDate, endDate, leaveType, reason } = req.body;
  const employeeId = req.user._id;
  // Validate required fields
  if (!startDate || !endDate || !leaveType) {
    return res.status(400).json({ message: 'Please provide all required fields' });
  }

  // Validate leave type
  if (!['sick', 'casual', 'vacation'].includes(leaveType)) {
    return res.status(400).json({ message: 'Invalid leave type' });
  }

  // Validate dates
  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return res.status(400).json({ message: 'Invalid date format' });
  }

  if (start < today) {
    return res.status(400).json({ message: 'Start date cannot be in the past' });
  }

  if (end < start) {
    return res.status(400).json({ message: 'End date must be after start date' });
  }

  // Check for maximum leave duration (e.g., 30 days)
  const daysDifference = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  if (daysDifference > 30) {
    return res.status(400).json({ message: 'Leave duration cannot exceed 30 days' });
  }


  try {
    const holidays = await Holiday.find({});
    const daysCalculated = calculateBusinessDays(start, end, holidays);

    if (daysCalculated === 0) {
      return res.status(400).json({ message: 'Selected dates contain no working days' });
    }

    const user = await User.findById(employeeId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }


    if (user.leaveBalance[leaveType] < daysCalculated) {
      return res.status(400).json({ 
        message: `Insufficient leave balance. You have ${user.leaveBalance[leaveType]} ${leaveType} days remaining, but requested ${daysCalculated} days.` 
      });
    }
    // Check for overlapping leave requests
    const overlappingLeaves = await LeaveRequest.findOne({
      employeeId,
      status: { $in: ['pending', 'approved'] },
      $or: [
        { startDate: { $lte: end }, endDate: { $gte: start } }
      ]
    });

    if (overlappingLeaves) {
      return res.status(400).json({ message: 'You already have a leave request for overlapping dates' });
    }


    const leaveRequest = await LeaveRequest.create({
      employeeId,
      startDate: start,
      endDate: end,
      leaveType,
      reason,
      daysCalculated,
    });

    res.status(201).json(leaveRequest);
  } catch (error) {
      console.error('Apply leave error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get my leaves
// @route   GET /api/leaves/my-leaves
// @access  Private
const getMyLeaves = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      LeaveRequest.find({ employeeId: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      LeaveRequest.countDocuments({ employeeId: req.user._id })
    ]);
    res.json({ items, page, limit, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get pending leaves for a manager
// @route   GET /api/leaves/pending
// @access  Private/Manager
const getPendingLeaves = async (req, res) => {
  try {
    // Build query based on role
    let query = { status: 'pending' };
    
    // If manager (not admin), only show their team's leaves
    if (req.user.role === 'manager') {
      const teamMembers = await User.find({ managerId: req.user._id }).select('_id');
      const teamMemberIds = teamMembers.map(member => member._id);
      query.employeeId = { $in: teamMemberIds };
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      LeaveRequest.find(query)
        .populate('employeeId', 'firstName lastName managerId department')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      LeaveRequest.countDocuments(query)
    ]);
    const pendingLeaves = { items, page, limit, total, pages: Math.ceil(total / limit) };
    
    res.json(pendingLeaves);
  } catch (error) {
    console.error('Get pending leaves error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update leave status
// @route   PATCH /api/leaves/:id/status
// @access  Private/Manager
const updateLeaveStatus = async (req, res) => {
  const { id } = req.params;
  const { status, rejectionReason } = req.body;
  // Validate status
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status. Must be approved or rejected' });
  }

  if (status === 'rejected' && !rejectionReason) {
    return res.status(400).json({ message: 'Rejection reason is required' });
  }


  try {
    const leaveRequest = await LeaveRequest.findById(id).populate('employeeId');

    if (!leaveRequest) {
      return res.status(404).json({ message: 'Leave request not found' });
        // Check if leave is already processed
        if (leaveRequest.status !== 'pending') {
          return res.status(400).json({ message: `Leave request is already ${leaveRequest.status}` });
        }

        // Verify manager has authority (manager can only approve their team's leaves)
        if (req.user.role === 'manager' && 
            leaveRequest.employeeId.managerId?.toString() !== req.user._id.toString()) {
          return res.status(403).json({ message: 'You can only manage leaves for your team members' });
        }

    }

    leaveRequest.status = status;
    leaveRequest.approvedBy = req.user._id;
    if (rejectionReason) {
      leaveRequest.rejectionReason = rejectionReason;
    }

    if (status === 'approved') {
      const user = await User.findById(leaveRequest.employeeId);
      
      // Double-check balance before deducting
      if (user.leaveBalance[leaveRequest.leaveType] < leaveRequest.daysCalculated) {
        return res.status(400).json({ 
          message: 'Employee no longer has sufficient leave balance' 
        });
      }
      
      user.leaveBalance[leaveRequest.leaveType] = Math.max(
        0, 
        user.leaveBalance[leaveRequest.leaveType] - leaveRequest.daysCalculated
      );
      await user.save();
    }

    const updatedLeaveRequest = await leaveRequest.save();

    res.json(updatedLeaveRequest);
  } catch (error) {
    console.error('Update leave status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


// @desc    Get approved leaves for a manager
// @route   GET /api/leaves/approved
// @access  Private/Manager
const getApprovedLeaves = async (req, res) => {
  try {
    // Build query based on role
    let query = { status: 'approved' };
    
    // If manager (not admin), only show their team's leaves
    if (req.user.role === 'manager') {
      const teamMembers = await User.find({ managerId: req.user._id }).select('_id');
      const teamMemberIds = teamMembers.map(member => member._id);
      query.employeeId = { $in: teamMemberIds };
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      LeaveRequest.find(query)
        .populate('employeeId', 'firstName lastName managerId department')
        .sort({ startDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      LeaveRequest.countDocuments(query)
    ]);
    const approvedLeaves = { items, page, limit, total, pages: Math.ceil(total / limit) };
    
    res.json(approvedLeaves);
  } catch (error) {
    console.error('Get approved leaves error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Cancel leave request
// @route   PATCH /api/leaves/:id/cancel
// @access  Private
const cancelLeaveRequest = async (req, res) => {
  try {
    const leaveRequest = await LeaveRequest.findById(req.params.id);

    if (!leaveRequest) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    if (leaveRequest.employeeId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (leaveRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending leave requests can be cancelled' });
    }

    leaveRequest.status = 'cancelled';
    await leaveRequest.save();

    res.json({ message: 'Leave request cancelled' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Export approved leaves to CSV
// @route   GET /api/leaves/export
// @access  Private/Admin
const exportLeaves = async (req, res) => {
  try {
    const leaves = await LeaveRequest.find({ status: 'approved' })
      .populate('employeeId', 'firstName lastName email department')
      .sort({ startDate: -1 });

    let csv = 'Employee Name,Email,Department,Leave Type,Start Date,End Date,Days,Reason\n';

    leaves.forEach(leave => {
      if (leave.employeeId) {
        const name = `${leave.employeeId.firstName} ${leave.employeeId.lastName}`;
        const startDate = new Date(leave.startDate).toLocaleDateString();
        const endDate = new Date(leave.endDate).toLocaleDateString();
        // Escape quotes in reason
        const reason = leave.reason ? leave.reason.replace(/"/g, '""') : '';
        
        csv += `"${name}","${leave.employeeId.email}","${leave.employeeId.department}","${leave.leaveType}","${startDate}","${endDate}",${leave.daysCalculated},"${reason}"\n`;
      }
    });

    res.header('Content-Type', 'text/csv');
    res.attachment('leaves_report.csv');
    return res.send(csv);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  applyLeave,
  getMyLeaves,
  getPendingLeaves,
  updateLeaveStatus,
  getApprovedLeaves,
  cancelLeaveRequest,
  exportLeaves
};
