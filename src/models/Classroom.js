const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  maxMarks: { type: Number, default: 100 },
  passingMarks: { type: Number, default: 35 },
});

const classroomSchema = new mongoose.Schema(
  {
    institution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institution",
      required: true,
    },
    grade: { type: String, required: true }, // e.g., "10"
    section: { type: String, required: true }, // e.g., "A"
    name: { type: String }, // auto "Grade 10 - A"
    roomNumber: { type: String },
    capacity: { type: Number, default: 40 },
    description: { type: String },
    classTeacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    subjects: [subjectSchema],
    academicYear: { type: String, required: true },
    academicStartDate: { type: Date },
    academicEndDate: { type: Date },
    startTime: { type: String },
    endTime: { type: String },
    defaultFees: { type: Number, default: 0 },
    feeStructure: [
      {
        feeType: { type: String },
        amount: { type: Number },
        dueDate: { type: Date },
        installment: { type: Number, default: 1 },
      },
    ],
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

classroomSchema.pre("save", function (next) {
  if (!this.name) this.name = `Grade ${this.grade} - ${this.section}`;
  next();
});

module.exports = mongoose.model("Classroom", classroomSchema);
