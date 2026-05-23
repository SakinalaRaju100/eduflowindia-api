import mongoose from "mongoose";

const recipientSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["sent", "failed", "pending"], default: "pending" },
    fcmMessageId: { type: String, default: null },
    error: { type: String, default: null },
    deliveredAt: { type: Date, default: null },
  },
  { _id: false }
);

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [80, "Title cannot exceed 80 characters"],
    },
    body: {
      type: String,
      required: [true, "Body is required"],
      trim: true,
      maxlength: [200, "Body cannot exceed 200 characters"],
    },
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    broadcast: {
      type: Boolean,
      default: false,
    },
    recipients: [recipientSchema],
    totalSent: { type: Number, default: 0 },
    totalFailed: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["pending", "sending", "completed", "failed"],
      default: "pending",
    },
    data: {
      type: Map,
      of: String,
      default: {},
    },
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
