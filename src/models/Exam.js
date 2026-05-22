const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  classroom: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', required: true },
  title: { type: String, required: true },
  type: { type: String, enum: ['unit-test', 'mid-term', 'final', 'quiz', 'assignment'], default: 'unit-test' },
  academicYear: { type: String, required: true },
  term: { type: String, enum: ['Term 1', 'Term 2', 'Term 3', 'Annual'], default: 'Term 1' },
  subjects: [{
    subjectName: String,
    subjectCode: String,
    date: Date,
    startTime: String,
    endTime: String,
    maxMarks: { type: Number, default: 100 },
    passingMarks: { type: Number, default: 35 },
  }],
  scheduledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isPublished: { type: Boolean, default: false },
  publishedAt: { type: Date },
}, { timestamps: true });

const resultSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  classroom: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  academicYear: { type: String, required: true },
  subjectMarks: [{
    subjectName: String,
    subjectCode: String,
    marksObtained: Number,
    maxMarks: Number,
    grade: String,
    isPassed: Boolean,
    remarks: String,
  }],
  totalMarks: { type: Number },
  maxTotalMarks: { type: Number },
  percentage: { type: Number },
  gpa: { type: Number },
  rank: { type: Number },
  overallGrade: { type: String },
  isPassed: { type: Boolean },
  enteredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

resultSchema.index({ exam: 1, student: 1 }, { unique: true });

const Exam = mongoose.model('Exam', examSchema);
const Result = mongoose.model('Result', resultSchema);

module.exports = { Exam, Result };
