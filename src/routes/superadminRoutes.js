const express = require("express");
const router = express.Router();
const {
  getInstitutions,
  createInstitution,
  updateInstitution,
  deleteInstitution,
  getStats,
} = require("../controllers/superadminController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect, authorize("superadmin"));
router.get("/schools", getInstitutions);
router.post("/schools", createInstitution);
router.put("/schools/:id", updateInstitution);
router.delete("/schools/:id", deleteInstitution);
router.get("/stats", getStats);

module.exports = router;
