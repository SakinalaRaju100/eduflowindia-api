const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    institution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institution",
      required: true,
    },
    title: { type: String, required: true, trim: true },
    type: { type: String, required: true },
    location: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Job", jobSchema);
