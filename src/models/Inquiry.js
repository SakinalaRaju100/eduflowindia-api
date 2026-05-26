const mongoose = require("mongoose");

const inquirySchema = new mongoose.Schema(
  {
    institution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institution",
      required: true,
    },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    message: { type: String, trim: true },
    status: {
      type: String,
      enum: ["new", "contacted", "resolved"],
      default: "new",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Inquiry", inquirySchema);
