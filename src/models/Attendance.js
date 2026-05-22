const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['present', 'absent', 'half-day', 'late', 'leave', 'holiday'],
    required: true,
  },
  note: { type: String },
});

const attendanceSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  classroom: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', required: true },
  date: { type: Date, required: true },
  academicYear: { type: String, required: true },
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isSubmitted: { type: Boolean, default: false },
  submittedAt: { type: Date },
  records: [attendanceRecordSchema],
}, { timestamps: true });

// Unique attendance per class per day
attendanceSchema.index({ classroom: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
