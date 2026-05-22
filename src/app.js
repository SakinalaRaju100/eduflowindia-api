const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const rateLimit = require("express-rate-limit");

const routes = require("./routes");
const { errorHandler, notFound } = require("./middleware/errorMiddleware");

const app = express();

// Security
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

app.use(
  cors({
    origin:
      process.env.FRONTEND_URL ||
      "https://eduflowindia-ui.vercel.app" ||
      "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Increase limit to accommodate base64 image strings
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: "Too many requests",
});
app.get("/", (req, res) => {
  res.send("Welcome to EduFlow API Home");
});
app.get("/test", (req, res) => {
  res.send("Welcome to EduFlow API test");
});
app.use("/api/", limiter);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Logging
if (process.env.NODE_ENV !== "test") app.use(morgan("dev"));

// Static files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Health check
app.get("/health", (req, res) =>
  res.json({ status: "OK", timestamp: new Date().toISOString() }),
);

// API Routes
app.use("/api", routes);

// Error handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
