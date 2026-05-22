const { verifyAccessToken } = require('../utils/jwt');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.userId).select('-password -refreshTokens -passwordResetOTP');
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User not found or inactive' });
    }
    user.lastActivity = new Date();
    await user.save({ validateBeforeSave: false });
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: `Role '${req.user.role}' is not authorized` });
  }
  next();
};

const sameSchool = (req, res, next) => {
  if (req.user.role === 'superadmin') return next();
  const paramSchool = req.params.schoolId || req.body.school;
  if (paramSchool && paramSchool.toString() !== req.user.school?.toString()) {
    return res.status(403).json({ success: false, message: 'Cross-school access denied' });
  }
  next();
};

module.exports = { protect, authorize, sameSchool };
