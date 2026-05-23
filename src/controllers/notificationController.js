import { validationResult } from "express-validator";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { sendPushNotification, sendMulticast } from "../config/firebase.js";

export const sendNotification = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  const { userIds, title, body, broadcast = false, data = {} } = req.body;

  try {
    // Determine recipients
    let targetUsers;
    if (broadcast) {
      targetUsers = await User.find({ notificationsEnabled: true }).select("_id fcmToken name");
    } else {
      if (!userIds?.length) {
        return res.status(400).json({ message: "Provide userIds or set broadcast: true" });
      }
      targetUsers = await User.find({
        _id: { $in: userIds },
        notificationsEnabled: true,
      }).select("_id fcmToken name");
    }

    if (!targetUsers.length) {
      return res.status(400).json({ message: "No valid recipients found" });
    }

    // Build notification record
    const notif = await Notification.create({
      title,
      body,
      sentBy: req.user._id,
      broadcast,
      status: "sending",
      data,
      recipients: targetUsers.map((u) => ({ user: u._id, status: "pending" })),
    });

    // Send via FCM multicast
    const tokens = targetUsers.map((u) => u.fcmToken).filter(Boolean);
    const tokenToUser = {};
    targetUsers.forEach((u) => { if (u.fcmToken) tokenToUser[u.fcmToken] = u._id; });

    let successCount = 0;
    let failureCount = 0;

    if (tokens.length > 0) {
      const result = await sendMulticast({ tokens, title, body, data });
      successCount = result.successCount;
      failureCount = result.failureCount;

      // Update recipient statuses
      result.results.forEach((r, i) => {
        const token = tokens[i];
        const userId = tokenToUser[token];
        const recipient = notif.recipients.find(
          (rec) => rec.user.toString() === userId?.toString()
        );
        if (recipient) {
          recipient.status = r.success ? "sent" : "failed";
          recipient.fcmMessageId = r.messageId || null;
          recipient.error = r.error || null;
          recipient.deliveredAt = r.success ? new Date() : null;
        }
      });
    }

    // Users without tokens count as failed
    const noTokenCount = targetUsers.length - tokens.length;
    failureCount += noTokenCount;

    notif.totalSent = successCount;
    notif.totalFailed = failureCount;
    notif.status = "completed";
    await notif.save();

    await notif.populate("sentBy", "name email");

    res.status(201).json({
      message: "Notification sent",
      notification: notif,
      summary: { total: targetUsers.length, sent: successCount, failed: failureCount },
    });
  } catch (err) {
    console.error("Send notification error:", err);
    res.status(500).json({ message: err.message });
  }
};

export const getNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      Notification.find({})
        .populate("sentBy", "name email")
        .populate("recipients.user", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments(),
    ]);

    res.json({
      notifications,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getNotificationById = async (req, res) => {
  try {
    const notif = await Notification.findById(req.params.id)
      .populate("sentBy", "name email")
      .populate("recipients.user", "name email avatar");
    if (!notif) return res.status(404).json({ message: "Notification not found" });
    res.json({ notification: notif });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ message: "Notification deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getStats = async (req, res) => {
  try {
    const [total, broadcasts, recentSent] = await Promise.all([
      Notification.countDocuments(),
      Notification.countDocuments({ broadcast: true }),
      Notification.aggregate([
        { $group: { _id: null, totalSent: { $sum: "$totalSent" }, totalFailed: { $sum: "$totalFailed" } } },
      ]),
    ]);

    res.json({
      totalNotifications: total,
      broadcastNotifications: broadcasts,
      totalDelivered: recentSent[0]?.totalSent || 0,
      totalFailed: recentSent[0]?.totalFailed || 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
