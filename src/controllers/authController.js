const User = require('../models/User');
const { generateTokenPair, verifyRefreshToken } = require('../utils/jwt');
const { sendOTPEmail } = require('../utils/email');
const crypto = require('crypto');
const School = require('../models/School');

// GET /api/auth/schools/unique/:schoolUniqueId
exports.getSchoolByUniqueId = async (req, res) => {
  try {
    const school = await School.findOne({ schoolUniqueId: req.params.schoolUniqueId.toUpperCase() });
    if (!school) return res.status(404).json({ success: false, message: 'School not found' });
    res.json({ success: true, data: school });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });
 const user = await User.findOne({ email: email.toLowerCase(), isActive: true }).select('+password +refreshTokens').populate('school');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const { accessToken, refreshToken } = generateTokenPair(user);

    // Use optimized atomic update to bypass heavy document save operations
    await User.updateOne(
      { _id: user._id },
      {
        $set: { lastLogin: new Date(), lastActivity: new Date() },
        $push: {
          refreshTokens: { $each: [{ token: refreshToken }], $slice: -5 }
        }
      }
    );

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        isFirstLogin: user.isFirstLogin,
        user: {
          _id: user._id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          photo: user.photo,
          school: user.school,
          preferences: user.preferences,
          // user
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/refresh
exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ success: false, message: 'Refresh token required' });

    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.userId).select('+refreshTokens');
    if (!user) return res.status(401).json({ success: false, message: 'User not found' });

    const tokenExists = user.refreshTokens.some(t => t.token === refreshToken);
    if (!tokenExists) return res.status(401).json({ success: false, message: 'Invalid refresh token' });

    const { accessToken, refreshToken: newRefreshToken } = generateTokenPair(user);
    user.refreshTokens = user.refreshTokens.filter(t => t.token !== refreshToken);
    user.refreshTokens.push({ token: newRefreshToken });
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, data: { accessToken, refreshToken: newRefreshToken } });
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
  }
};

// POST /api/auth/logout
exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await User.updateOne({ _id: req.user._id }, { $pull: { refreshTokens: { token: refreshToken } } });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/change-password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }
    const user = await User.findById(req.user._id).select('+password');
    if (!user.isFirstLogin && currentPassword) {
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }
    user.password = newPassword;
    user.isFirstLogin = false;
    await user.save();
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });
    if (!user) return res.json({ success: true, message: 'If email exists, OTP has been sent' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.passwordResetOTP = otp;
    user.passwordResetOTPExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    await user.save({ validateBeforeSave: false });

    await sendOTPEmail(user.email, user.firstName, otp);
    res.json({ success: true, message: 'OTP sent to registered email' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() }).select('+passwordResetOTP +passwordResetOTPExpiry');
    if (!user || user.passwordResetOTP !== otp || new Date() > user.passwordResetOTPExpiry) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }
    user.password = newPassword;
    user.passwordResetOTP = undefined;
    user.passwordResetOTPExpiry = undefined;
    user.isFirstLogin = false;
    await user.save();
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-refreshTokens')
      .populate('school')
      .lean();
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/auth/preferences
exports.updatePreferences = async (req, res) => {
  try {
    const { theme, themeColor, sidebarCollapsed } = req.body;
    const user = await User.findById(req.user._id);
    if (theme) user.preferences.theme = theme;
    if (themeColor) user.preferences.themeColor = themeColor;
    if (sidebarCollapsed !== undefined) user.preferences.sidebarCollapsed = sidebarCollapsed;
    await user.save({ validateBeforeSave: false });
    res.json({ success: true, data: user.preferences });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
