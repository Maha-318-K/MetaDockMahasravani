const User = require('../models/userModel');

// POST /api/v1/auth/login
const login = async (req, res) => {
  try {
    const { empId, password } = req.body;

    if (!empId || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide Employee ID and Password'
      });
    }

    const user = await User.findOne({ empId, password });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid Employee ID or Password'
      });
    }

    if (user.status !== 'Active') {
      return res.status(403).json({
        success: false,
        error: 'Your account is inactive. Please contact your administrator.'
      });
    }

    // Don't send password back
    const { password: _, ...userWithoutPassword } = user.toObject();

    res.status(200).json({
      success: true,
      token: 'simulated_jwt_token_' + user._id, // simulated token
      data: userWithoutPassword
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// POST /api/v1/auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Please provide Personal Mail ID'
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Email address not found'
      });
    }

    // Reset password to default '12345'
    user.password = '12345';
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password has been reset to default (12345). Please login and change it.'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

module.exports = {
  login,
  forgotPassword
};
