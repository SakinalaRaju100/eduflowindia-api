const User = require("../models/User");
const { generateTokenPair, verifyRefreshToken } = require("../utils/jwt");
const { sendOTPEmail } = require("../utils/email");
const crypto = require("crypto");
const Institution = require("../models/Institution");
const Inquiry = require("../models/Inquiry");
const Job = require("../models/Job");
const Post = require("../models/Post");

// GET /api/auth/schools
exports.getAllSchools = async (req, res) => {
  try {
    // Fetch active schools/institutions for the public map
    const schools = await Institution.find({ isActive: true })
      .select("name institutionUniqueId schoolUniqueId address location logo")
      .lean();
    res.json({ success: true, data: schools });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/auth/posts
exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("institution", "name logo institutionUniqueId schoolUniqueId")
      .populate("commentsList.user", "firstName lastName photo")
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: posts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/auth/jobs
exports.getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find()
      .populate("institution", "name logo institutionUniqueId schoolUniqueId")
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: jobs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/auth/schools/unique/:institutionUniqueId
exports.getInstitutionByUniqueId = async (req, res) => {
  try {
    const institution = await Institution.findOne({
      institutionUniqueId: req.params.institutionUniqueId.toUpperCase(),
    });
    if (!institution)
      return res
        .status(404)
        .json({ success: false, message: "Institution not found" });
    res.json({ success: true, data: institution });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/schools/:institutionId/inquiries
exports.submitInquiry = async (req, res) => {
  try {
    const { institutionId } = req.params;
    const { name, phone, email, message } = req.body;

    if (!name || !phone) {
      return res
        .status(400)
        .json({ success: false, message: "Name and phone are required" });
    }

    const newInquiry = await Inquiry.create({
      institution: institutionId,
      name,
      phone,
      email,
      message,
    });

    res.json({ success: true, data: newInquiry });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/auth/schools/:institutionId/jobs
exports.getJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ institution: req.params.institutionId }).sort(
      { createdAt: -1 },
    );
    res.json({ success: true, data: jobs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/jobs
exports.createJob = async (req, res) => {
  try {
    if (req.user.role !== "principal") {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }
    const institutionId = req.user.institution?._id || req.user.institution;
    const newJob = await Job.create({
      ...req.body,
      institution: institutionId,
    });
    res.json({ success: true, data: newJob });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/auth/jobs/:id
exports.deleteJob = async (req, res) => {
  try {
    if (req.user.role !== "principal") {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }
    const institutionId = req.user.institution?._id || req.user.institution;
    await Job.findOneAndDelete({
      _id: req.params.id,
      institution: institutionId,
    });
    res.json({ success: true, message: "Job removed" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/auth/schools/:institutionId/posts
exports.getPosts = async (req, res) => {
  try {
    const posts = await Post.find({
      institution: req.params.institutionId,
    }).sort({ createdAt: -1 });
    res.json({ success: true, data: posts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/posts
exports.createPost = async (req, res) => {
  try {
    if (req.user.role !== "principal") {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }
    const institutionId = req.user.institution?._id || req.user.institution;
    const newPost = await Post.create({
      ...req.body,
      institution: institutionId,
    });
    res.json({ success: true, data: newPost });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/auth/posts/:id
exports.deletePost = async (req, res) => {
  try {
    if (req.user.role !== "principal") {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }
    const institutionId = req.user.institution?._id || req.user.institution;
    await Post.findOneAndDelete({
      _id: req.params.id,
      institution: institutionId,
    });
    res.json({ success: true, message: "Post removed" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/posts/:id/like
exports.toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post)
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });

    const index = post.likedBy.indexOf(req.user._id);
    if (index === -1) {
      post.likedBy.push(req.user._id);
      post.likes += 1;
    } else {
      post.likedBy.splice(index, 1);
      post.likes = Math.max(0, post.likes - 1);
    }
    await post.save();
    res.json({ success: true, data: post });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/posts/:id/comment
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text)
      return res
        .status(400)
        .json({ success: false, message: "Comment text required" });
    const post = await Post.findById(req.params.id);
    if (!post)
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    post.commentsList.push({ user: req.user._id, text });
    post.comments = post.commentsList.length;
    await post.save();
    res.json({ success: true, data: post });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res
        .status(400)
        .json({ success: false, message: "Email and password required" });
    const user = await User.findOne({
      email: email.toLowerCase(),
      isActive: true,
    })
      .select("+password +refreshTokens")
      .populate("institution");
    if (!user || !(await user.comparePassword(password))) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const { accessToken, refreshToken } = generateTokenPair(user);

    // Use optimized atomic update to bypass heavy document save operations
    await User.updateOne(
      { _id: user._id },
      {
        $set: { lastLogin: new Date(), lastActivity: new Date() },
        $push: {
          refreshTokens: { $each: [{ token: refreshToken }], $slice: -5 },
        },
      },
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
          institution: user.institution,
          preferences: user.preferences,
          // user
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/auth/inquiries
exports.getInstitutionInquiries = async (req, res) => {
  try {
    if (req.user.role !== "principal") {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }
    const institutionId = req.user.institution?._id || req.user.institution;
    const inquiries = await Inquiry.find({
      institution: institutionId,
    }).sort({ createdAt: -1 });
    res.json({ success: true, data: inquiries });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/auth/inquiries/:id/status
exports.updateInquiryStatus = async (req, res) => {
  try {
    if (req.user.role !== "principal") {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }
    const institutionId = req.user.institution?._id || req.user.institution;
    const inquiry = await Inquiry.findOneAndUpdate(
      { _id: req.params.id, institution: institutionId },
      { status: req.body.status },
      { new: true },
    );
    res.json({ success: true, data: inquiry });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/refresh
exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return res
        .status(400)
        .json({ success: false, message: "Refresh token required" });

    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.userId).select("+refreshTokens");
    if (!user)
      return res
        .status(401)
        .json({ success: false, message: "User not found" });

    const tokenExists = user.refreshTokens.some(
      (t) => t.token === refreshToken,
    );
    if (!tokenExists)
      return res
        .status(401)
        .json({ success: false, message: "Invalid refresh token" });

    const { accessToken, refreshToken: newRefreshToken } =
      generateTokenPair(user);
    user.refreshTokens = user.refreshTokens.filter(
      (t) => t.token !== refreshToken,
    );
    user.refreshTokens.push({ token: newRefreshToken });
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      data: { accessToken, refreshToken: newRefreshToken },
    });
  } catch (err) {
    res
      .status(401)
      .json({ success: false, message: "Invalid or expired refresh token" });
  }
};

// POST /api/auth/logout
exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await User.updateOne(
        { _id: req.user._id },
        { $pull: { refreshTokens: { token: refreshToken } } },
      );
    }
    res.json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/change-password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }
    const user = await User.findById(req.user._id).select("+password");
    if (!user.isFirstLogin && currentPassword) {
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch)
        return res
          .status(400)
          .json({ success: false, message: "Current password is incorrect" });
    }
    user.password = newPassword;
    user.isFirstLogin = false;
    await user.save();
    res.json({ success: true, message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });
    if (!user)
      return res.json({
        success: true,
        message: "If email exists, OTP has been sent",
      });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.passwordResetOTP = otp;
    user.passwordResetOTPExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    await user.save({ validateBeforeSave: false });

    await sendOTPEmail(user.email, user.firstName, otp);
    res.json({ success: true, message: "OTP sent to registered email" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() }).select(
      "+passwordResetOTP +passwordResetOTPExpiry",
    );
    if (
      !user ||
      user.passwordResetOTP !== otp ||
      new Date() > user.passwordResetOTPExpiry
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired OTP" });
    }
    user.password = newPassword;
    user.passwordResetOTP = undefined;
    user.passwordResetOTPExpiry = undefined;
    user.isFirstLogin = false;
    await user.save();
    res.json({ success: true, message: "Password reset successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-refreshTokens")
      .populate("institution")
      .lean();
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.saveFcmToken = async (req, res) => {
  console.log(req.user);
  const { token } = req.body;
  if (!token) return res.status(400).json({ message: "FCM token is required" });

  try {
    const usere = await User.findById(req.user._id);
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { fcmToken: token, isOnline: true },
      { new: true },
    );
    res.json({ message: "FCM token saved", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateNotificationPreference = async (req, res) => {
  const { enabled } = req.body;
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { notificationsEnabled: enabled },
      { new: true },
    );
    res.json({ message: "Preference updated", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/auth/preferences
exports.updatePreferences = async (req, res) => {
  try {
    const { theme, themeColor, sidebarCollapsed } = req.body;
    const user = await User.findById(req.user._id);
    if (theme) user.preferences.theme = theme;
    if (themeColor) user.preferences.themeColor = themeColor;
    if (sidebarCollapsed !== undefined)
      user.preferences.sidebarCollapsed = sidebarCollapsed;
    await user.save({ validateBeforeSave: false });
    res.json({ success: true, data: user.preferences });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
