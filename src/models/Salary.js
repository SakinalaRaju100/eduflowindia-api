const mongoose = require("mongoose");

const salarySchema = new mongoose.Schema(
  {
    institution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institution",
      required: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    month: { type: String, required: true },
    year: { type: Number, required: true },
    baseSalary: { type: Number, required: true },
    allowances: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    netSalary: { type: Number, required: true },
    status: { type: String, enum: ["pending", "paid"], default: "pending" },
    paymentDate: { type: Date },
    paymentMode: {
      type: String,
      enum: ["bank_transfer", "cash", "cheque", "other"],
      default: "bank_transfer",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Salary", salarySchema);
