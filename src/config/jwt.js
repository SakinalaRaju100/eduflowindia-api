module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || 'fallback_secret_change_in_prod',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_change_in_prod',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  INACTIVITY_TIMEOUT: 30 * 60 * 1000, // 30 minutes
};
