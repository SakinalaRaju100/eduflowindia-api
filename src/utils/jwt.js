const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_REFRESH_SECRET, JWT_EXPIRES_IN, JWT_REFRESH_EXPIRES_IN } = require('../config/jwt');

const generateAccessToken = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

const generateRefreshToken = (payload) => jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });

const verifyAccessToken = (token) => jwt.verify(token, JWT_SECRET);

const verifyRefreshToken = (token) => jwt.verify(token, JWT_REFRESH_SECRET);

const generateTokenPair = (user) => {
  const payload = {
    userId: user._id,
    role: user.role,
    school: user.school,
    email: user.email,
  };
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};

module.exports = { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken, generateTokenPair };
