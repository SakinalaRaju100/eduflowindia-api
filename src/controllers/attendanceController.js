const Attendance = require('../models/Attendance');
const Classroom = require('../models/Classroom');
const StudentProfile = require('../models/StudentProfile');

// GET /api/attendance/:classroomId?date=YYYY-MM-DD
exports.getAttendance = async (req, res) => {
  try {
    const { classroomId } = req.params;
    const date = req.query.date ? new Date(req.query.date) : new Date();
    date.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    let attendance = await Attendance.findOne({ classroom: classroomId, date: { $gte: date, $lte: endDate } })
      .populate('records.studentId', 'firstName lastName photo');

    if (!attendance) {
      // Return empty structure with student list
      const classroom = await Classroom.findById(classroomId).populate('students', 'firstName lastName photo');
      const records = (classroom?.students || []).map(s => ({ studentId: s, status: null }));
      return res.json({ success: true, data: { date, classroom: classroomId, records, isSubmitted: false } });
    }

    res.json({ success: true, data: attendance });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// POST /api/attendance/:classroomId - Save (not submitted yet)
exports.saveAttendance = async (req, res) => {
  try {
    const { classroomId } = req.params;
    const { date, records } = req.body;
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const classroom = await Classroom.findById(classroomId);
    const existing = await Attendance.findOne({ classroom: classroomId, date: { $gte: attendanceDate, $lte: new Date(attendanceDate.getTime() + 86400000) } });

    if (existing?.isSubmitted) {
      return res.status(400).json({ success: false, message: 'Attendance already submitted for this date' });
    }

    const query = { classroom: classroomId, date: attendanceDate };
    const update = {
      school: classroom.school, academicYear: classroom.academicYear,
      markedBy: req.user._id, records, isSubmitted: false,
    };
    const att = await Attendance.findOneAndUpdate(query, update, { upsert: true, new: true });
    res.json({ success: true, data: att });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// POST /api/attendance/:classroomId/submit
exports.submitAttendance = async (req, res) => {
  try {
    const { classroomId } = req.params;
    const { date, records } = req.body;
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const classroom = await Classroom.findById(classroomId);

    const query = { classroom: classroomId, date: attendanceDate };
    const update = {
      school: classroom.school, academicYear: classroom.academicYear,
      markedBy: req.user._id, records, isSubmitted: true, submittedAt: new Date(),
    };
    const att = await Attendance.findOneAndUpdate(query, update, { upsert: true, new: true });
    res.json({ success: true, data: att, message: 'Attendance submitted successfully' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/attendance/student/:studentId - Monthly attendance for a student
exports.getStudentAttendance = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { month, year } = req.query;
    const startDate = new Date(year || new Date().getFullYear(), (month || new Date().getMonth()) - 1 || 0, 1);
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);

    const records = await Attendance.find({
      'records.studentId': studentId,
      date: { $gte: startDate, $lte: endDate },
      isSubmitted: true,
    }).select('date records');

    const studentRecords = records.map(a => ({
      date: a.date,
      status: a.records.find(r => r.studentId.toString() === studentId)?.status || null,
    }));

    const total = studentRecords.filter(r => r.status !== 'holiday').length;
    const present = studentRecords.filter(r => ['present', 'half-day', 'late'].includes(r.status)).length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    res.json({ success: true, data: { records: studentRecords, percentage, total, present } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/attendance/student/:studentId/yearly
exports.getStudentYearlyAttendance = async (req, res) => {
  try {
    const { studentId } = req.params;
    const records = await Attendance.find({
      'records.studentId': studentId,
      isSubmitted: true,
    }).select('date records classroom').sort('date');

    const studentRecords = records.map(a => ({
      date: a.date,
      status: a.records.find(r => r.studentId.toString() === studentId)?.status || null,
      classroom: a.classroom,
    }));

    const total = studentRecords.length;
    const present = studentRecords.filter(r => ['present', 'half-day', 'late'].includes(r.status)).length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    res.json({ success: true, data: { records: studentRecords, percentage, total, present } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/attendance/school-summary
exports.getSchoolAttendanceSummary = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 86400000);
    const records = await Attendance.find({
      school: req.user.school,
      date: { $gte: today, $lt: tomorrow },
      isSubmitted: true,
    });
    const summary = { present: 0, absent: 0, late: 0, leave: 0, total: 0 };
    records.forEach(a => a.records.forEach(r => {
      summary.total++;
      if (r.status) summary[r.status] = (summary[r.status] || 0) + 1;
    }));
    res.json({ success: true, data: summary });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
