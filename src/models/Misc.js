const mongoose = require('mongoose');

// Leave Application
const leaveSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  applicantRole: { type: String, enum: ['teacher', 'student', 'parent'] },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  leaveType: { type: String, enum: ['sick', 'casual', 'earned', 'medical', 'personal', 'other'], required: true },
  fromDate: { type: Date, required: true },
  toDate: { type: Date, required: true },
  totalDays: { type: Number },
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  approvalNote: { type: String },
  approvedAt: { type: Date },
  // For student attendance regularisation
  isRegularisation: { type: Boolean, default: false },
  classroom: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', default: null },
}, { timestamps: true });

leaveSchema.pre('save', function (next) {
  if (this.fromDate && this.toDate) {
    const diff = (this.toDate - this.fromDate) / (1000 * 60 * 60 * 24);
    this.totalDays = Math.ceil(diff) + 1;
  }
  next();
});

// Holiday / School Calendar Event
const calendarEventSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  title: { type: String, required: true },
  description: { type: String },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  type: { type: String, enum: ['holiday', 'event', 'exam', 'ptm', 'weekend', 'festival', 'other'], required: true },
  color: { type: String, default: '#3B82F6' },
  isPublic: { type: Boolean, default: true }, // visible to all roles
  targetRoles: [{ type: String, enum: ['all', 'principal', 'teacher', 'student', 'parent'] }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Announcement / Notification
const announcementSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  targetRoles: [{ type: String, enum: ['all', 'principal', 'teacher', 'student', 'parent'] }],
  targetClassrooms: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Classroom' }],
  priority: { type: String, enum: ['normal', 'important', 'urgent'], default: 'normal' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  expiresAt: { type: Date },
}, { timestamps: true });

// Direct Messages (Parent-Teacher ticketing)
const messageSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String },
  content: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  parentMessageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
  studentRef: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  status: { type: String, enum: ['open', 'closed', 'pending'], default: 'open' },
}, { timestamps: true });

// Diary Notes (Teacher writes for class)
const diaryNoteSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  classroom: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', required: true },
  date: { type: Date, required: true },
  content: { type: String, required: true },
  homework: { type: String },
  subject: { type: String },
  writtenBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

diaryNoteSchema.index({ classroom: 1, date: 1 });

// Audit Log
const auditLogSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', default: null },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true },
  resource: { type: String },
  resourceId: { type: mongoose.Schema.Types.ObjectId },
  details: { type: mongoose.Schema.Types.Mixed },
  ipAddress: { type: String },
  userAgent: { type: String },
}, { timestamps: true });

module.exports = {
  Leave: mongoose.model('Leave', leaveSchema),
  CalendarEvent: mongoose.model('CalendarEvent', calendarEventSchema),
  Announcement: mongoose.model('Announcement', announcementSchema),
  Message: mongoose.model('Message', messageSchema),
  DiaryNote: mongoose.model('DiaryNote', diaryNoteSchema),
  AuditLog: mongoose.model('AuditLog', auditLogSchema),
};
