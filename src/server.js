require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/database');

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 SMS Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  });
}).catch((err) => {
  console.error('Failed to connect to DB:', err);
  process.exit(1);
});
