const express = require("express");
const router = express.Router();
const {
  login,
  refresh,
  logout,
  changePassword,
  forgotPassword,
  resetPassword,
  getMe,
  saveFcmToken,
  updatePreferences,
  getInstitutionInquiries,
  updateInquiryStatus,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const authController = require("../controllers/authController");

router.post("/login", login);
router.post("/refresh", refresh);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Route for fetching all public schools (e.g., for the map)
router.get("/schools", authController.getAllSchools);
router.get("/posts", authController.getAllPosts);
router.get("/jobs", authController.getAllJobs);

// Add this new route for fetching public institution info
router.get(
  "/schools/unique/:institutionUniqueId",
  authController.getInstitutionByUniqueId,
);

router.post("/schools/:institutionId/inquiries", authController.submitInquiry);
router.get("/schools/:institutionId/jobs", authController.getJobs);
router.get("/schools/:institutionId/posts", authController.getPosts);

// Protected
router.use(protect);
router.post("/logout", logout);
router.get("/me", getMe);
router.post("/fcm-token", saveFcmToken);
router.post("/change-password", changePassword);
router.patch("/preferences", updatePreferences);
router.get("/inquiries", getInstitutionInquiries);
router.patch("/inquiries/:id/status", updateInquiryStatus);
router.post("/jobs", authController.createJob);
router.delete("/jobs/:id", authController.deleteJob);
router.post("/posts", authController.createPost);
router.delete("/posts/:id", authController.deletePost);
router.post("/posts/:id/like", authController.toggleLike);
router.post("/posts/:id/comment", authController.addComment);

module.exports = router;
