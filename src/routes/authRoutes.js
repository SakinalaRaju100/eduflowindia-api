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
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const authController = require("../controllers/authController");

router.post("/login", login);
router.post("/refresh", refresh);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
// Add this new route for fetching public institution info
router.get(
  "/schools/unique/:institutionUniqueId",
  authController.getInstitutionByUniqueId,
);

// Protected
router.use(protect);
router.post("/logout", logout);
router.get("/me", getMe);
router.post("/fcm-token", saveFcmToken);
router.post("/change-password", changePassword);
router.patch("/preferences", updatePreferences);

module.exports = router;
