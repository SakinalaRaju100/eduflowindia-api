const mongoose = require('mongoose');

const teacherProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  teacherId: { type: String, unique: true, required: true },
  qualifications: [{ degree: String, institution: String, year: Number }],
  subjectsExpertise: [String],
  joiningDate: { type: Date, default: Date.now },
  employmentType: { type: String, enum: ['full-time', 'part-time', 'contract'], default: 'full-time' },
  designation: { type: String, default: 'Teacher' },
  department: { type: String },
  assignedClasses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Classroom' }],
  salary: { type: Number, select: false },
  salaryDetails: {
    baseSalary: { type: Number, default: 0 },
    allowances: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    annualPackage: { type: Number, default: 0 }
  },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  address: { street: String, city: String, state: String, country: String, pincode: String },
  isActive: { type: Boolean, default: true },
  phone: {
    type: String,
    trim: true,
  },
  aadhaarNumber: {
    type: String,
    trim: true,
  },
  bankAccountNumber: {
    type: String,
    trim: true,
  },
  bankIfscCode: {
    type: String,
    trim: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('TeacherProfile', teacherProfileSchema);
