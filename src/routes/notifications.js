import { Router } from "express";
import { body } from "express-validator";
import {
  sendNotification,
  getNotifications,
  getNotificationById,
  deleteNotification,
  getStats,
} from "../controllers/notificationController.js";
import { protect, adminOnly } from "../middleware/auth.js";
// const { protect, authorize } = require("../middleware/authMiddleware");

const router = Router();

router.use(protect, adminOnly);

router.get("/", getNotifications);
router.get("/stats", getStats);
router.get("/:id", getNotificationById);
router.delete("/:id", deleteNotification);

router.post(
  "/send",
  [
    body("title").trim().notEmpty().withMessage("Title is required"),
    body("body").trim().notEmpty().withMessage("Body is required"),
  ],
  sendNotification,
);

export default router;
