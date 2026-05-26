const mongoose = require("mongoose");

const studentProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    institution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institution",
      required: true,
    },
    classroom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Classroom",
      required: true,
    },
    rollNumber: { type: String, required: true },
    studentId: { type: String, unique: true, required: true }, // e.g., STU-2024-001
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ["male", "female", "other"] },
    bloodGroup: { type: String },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      pincode: String,
    },
    admissionDate: { type: Date, default: Date.now },
    academicYear: { type: String, required: true },
    previousInstitution: { type: String },
    documents: [
      {
        name: String,
        url: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    guardians: [
      {
        relationship: { type: String, enum: ["father", "mother", "guardian"] },
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null,
        },
        name: String,
        phone: String,
        email: String,
        occupation: String,
      },
    ],
    medicalInfo: {
      allergies: [String],
      conditions: [String],
      emergencyContact: String,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("StudentProfile", studentProfileSchema);
