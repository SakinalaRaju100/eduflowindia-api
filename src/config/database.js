const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Check if we have an active connection before opening a new one
    if (mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    throw error;
  }
};

mongoose.connection.on("disconnected", () =>
  console.warn("⚠️  MongoDB disconnected"),
);
mongoose.connection.on("reconnected", () =>
  console.log("🔄 MongoDB reconnected"),
);

module.exports = connectDB;
