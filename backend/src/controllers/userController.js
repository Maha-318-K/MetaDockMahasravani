const User = require('../models/userModel');
const ActionLog = require('../models/actionLogModel');

// Helper for logging actions
const logAction = async (whoName, what, why) => {
  try {
    const log = new ActionLog({
      who: whoName || 'System',
      what: what,
      why: why
    });
    await log.save();
  } catch (error) {
    console.error('Error logging action:', error);
  }
};

// GET /api/v1/users
const getUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// POST /api/v1/users
const createUser = async (req, res) => {
  try {
    const userData = req.body;
    
    if (!userData.name || !userData.empId || !userData.email) {
      return res.status(400).json({
        success: false,
        error: 'Please provide name, employee ID, and email'
      });
    }

    const newUser = new User(userData);
    await newUser.save();

    await logAction(userData.requestedBy || 'System', 'Created User', `Created new user ${newUser.name} (${newUser.empId})`);

    res.status(201).json({
      success: true,
      data: newUser
    });
  } catch (error) {
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyValue)[0];
      return res.status(400).json({ success: false, error: `${duplicateField} already exists` });
    }
    res.status(500).json({
      success: false,
      error: 'Server Error',
      details: error.message,
      stack: error.stack
    });
  }
};

// GET /api/v1/users/:id
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// PUT /api/v1/users/:id
const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const oldData = user.toObject();
    const updateData = req.body;

    Object.assign(user, updateData);
    await user.save();

    // Determine what changed
    const changedFields = [];
    Object.keys(updateData).forEach(key => {
      if (key !== '_id' && key !== 'requestedBy' && key !== 'requesterRole' && oldData[key] !== updateData[key]) {
        changedFields.push(key);
      }
    });
    const changeStr = changedFields.length > 0 ? `Changed ${changedFields.join(', ')}` : 'Updated details';

    await logAction(updateData.requestedBy || 'Unknown', 'Updated User', `${changeStr} for ${user.name}`);
    
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// PUT /api/v1/users/:id/status
const updateUserStatus = async (req, res) => {
  try {
    const { status, requesterName } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, error: 'Status is required' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    user.status = status;
    await user.save();

    await logAction(requesterName || 'Unknown', 'Updated Status', `Marked ${user.name} as ${status}`);

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// DELETE /api/v1/users/:id
const deleteUser = async (req, res) => {
  try {
    const { requesterRole, requesterName } = req.body;
    
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // RBAC Rules
    if (requesterRole === 'User' || requesterRole === 'Employee') {
      return res.status(403).json({ success: false, error: 'Users cannot delete other users.' });
    }
    if (requesterRole === 'Admin' && (targetUser.role === 'Admin' || targetUser.role === 'Super Admin')) {
      return res.status(403).json({ success: false, error: 'Admins cannot delete other Admins or Super Admins.' });
    }
    if (requesterRole === 'Super Admin' && targetUser.name === requesterName) {
      return res.status(403).json({ success: false, error: 'Cannot delete yourself.' });
    }

    // Perform deletion
    await User.findByIdAndDelete(req.params.id);
    await logAction(requesterName, 'Deleted User', `Deleted user ${targetUser.name} (${targetUser.role})`);
    
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// GET /api/v1/users/logs/action-history
const getActionLogs = async (req, res) => {
  try {
    const logs = await ActionLog.find().sort({ timestamp: -1 });
    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

module.exports = {
  getUsers,
  createUser,
  getUserById,
  updateUser,
  updateUserStatus,
  deleteUser,
  getActionLogs
};
