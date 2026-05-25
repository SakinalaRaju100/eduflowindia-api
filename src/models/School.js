const mongoose = require("mongoose");

const schoolSchema = new mongoose.Schema(
  {
    institutionUniqueId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: { type: String, required: true, trim: true },
    institutionType: {
      type: String,
      enum: ["School", "College"],
      default: "School",
    },
    institutionSector: {
      type: String,
      enum: ["government", "private"],
      default: "private",
    },
    aboutInstitute: { type: String, trim: true },
    institutionMotive: { type: String, trim: true },
    keypoints: { type: String, trim: true },
    logo: { type: String, default: null },
    images: { type: [String], default: [] },
    successStories: [
      {
        name: { type: String, trim: true },
        text: { type: String, trim: true },
        color: { type: String, trim: true },
        rating: { type: Number, default: 5, min: 1, max: 5 },
      },
    ],
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      pincode: String,
    }, // This is for textual address
    location: {
      // This will store the geographical coordinates
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    phone: String,
    email: { type: String, required: true, unique: true, lowercase: true },
    website: String,
    affiliationBoard: {
      type: String,
      enum: ["CBSE", "ICSE", "State Board", "IB", "Cambridge", "Other"],
      default: "CBSE",
    },
    affiliationNumber: String,
    principalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    currentAcademicYear: {
      type: String,
      default: () => {
        const now = new Date();
        return now.getMonth() >= 3
          ? `${now.getFullYear()}-${now.getFullYear() + 1}`
          : `${now.getFullYear() - 1}-${now.getFullYear()}`;
      },
    },
    academicYears: [
      { year: String, startDate: Date, endDate: Date, isCurrent: Boolean },
    ],
    isActive: { type: Boolean, default: true },
    settings: {
      workingDays: { type: [Number], default: [1, 2, 3, 4, 5] }, // Mon-Fri
      workingHoursStart: { type: String, default: "08:00" },
      workingHoursEnd: { type: String, default: "15:00" },
    },
    paymentDetails: {
      bankAccountNumber: String,
      ifscCode: String,
      upiNumber: String,
      upiId: String,
      upiQrCode: String,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("School", schoolSchema);
