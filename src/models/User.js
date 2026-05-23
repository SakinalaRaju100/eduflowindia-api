const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const ROLES = ["superadmin", "principal", "teacher", "student", "parent"];

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, required: true },
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      default: null,
    },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    photo: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    isFirstLogin: { type: Boolean, default: true },
    passwordResetOTP: { type: String, select: false },
    passwordResetOTPExpiry: { type: Date, select: false },
    refreshTokens: [
      { token: String, createdAt: { type: Date, default: Date.now } },
    ],
    lastLogin: { type: Date },
    lastActivity: { type: Date },
    preferences: {
      theme: { type: String, default: "light" },
      themeColor: { type: String, default: "blue" },
      sidebarCollapsed: { type: Boolean, default: false },
    },
    fcmToken: { type: String, default: null },
    isOnline: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Hash password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.set("toJSON", {
  virtuals: true,
  transform: (_, ret) => {
    delete ret.password;
    delete ret.refreshTokens;
    return ret;
  },
});

module.exports = mongoose.model("User", userSchema);
module.exports.ROLES = ROLES;
