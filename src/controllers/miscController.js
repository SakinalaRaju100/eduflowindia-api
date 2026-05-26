const {
  CalendarEvent,
  Announcement,
  Leave,
  Message,
  DiaryNote,
} = require("../models/Misc");
const StudentProfile = require("../models/StudentProfile");
const Classroom = require("../models/Classroom");
const Attendance = require("../models/Attendance");
const { Exam, Result } = require("../models/Exam");
const FeeRecord = require("../models/FeeRecord");

// ── Calendar Events ──────────────────────────────────────────────
exports.getCalendarEvents = async (req, res) => {
  try {
    const { start, end } = req.query;
    const filter = { institution: req.user.institution };
    if (start && end)
      filter.startDate = { $gte: new Date(start), $lte: new Date(end) };
    const events = await CalendarEvent.find(filter).sort("startDate");
    res.json({ success: true, data: events });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createCalendarEvent = async (req, res) => {
  try {
    const event = await CalendarEvent.create({
      ...req.body,
      institution: req.user.institution,
      createdBy: req.user._id,
    });
    res.status(201).json({ success: true, data: event });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateCalendarEvent = async (req, res) => {
  try {
    const event = await CalendarEvent.findOneAndUpdate(
      { _id: req.params.id, institution: req.user.institution },
      req.body,
      { new: true },
    );
    res.json({ success: true, data: event });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteCalendarEvent = async (req, res) => {
  try {
    await CalendarEvent.findOneAndDelete({
      _id: req.params.id,
      institution: req.user.institution,
    });
    res.json({ success: true, message: "Event deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Announcements ────────────────────────────────────────────────
exports.getAnnouncements = async (req, res) => {
  try {
    const filter = { institution: req.user.institution };
    if (req.user.role !== "principal") {
      filter.$or = [{ targetRoles: "all" }, { targetRoles: req.user.role }];
    }
    const announcements = await Announcement.find(filter)
      .populate("createdBy", "firstName lastName role")
      .sort("-createdAt")
      .limit(50);
    res.json({ success: true, data: announcements });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createAnnouncement = async (req, res) => {
  try {
    const ann = new Announcement({
      ...req.body,
      institution: req.user.institution,
      createdBy: req.user._id,
    });
    if (req.body.academicYear)
      ann.set("academicYear", req.body.academicYear, { strict: false });
    await ann.save();
    res.status(201).json({ success: true, data: ann });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateAnnouncement = async (req, res) => {
  try {
    const ann = await Announcement.findOneAndUpdate(
      { _id: req.params.id, institution: req.user.institution },
      req.body,
      { new: true, strict: false },
    );
    if (!ann)
      return res
        .status(404)
        .json({ success: false, message: "Announcement not found" });
    res.json({ success: true, data: ann });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteAnnouncement = async (req, res) => {
  try {
    const ann = await Announcement.findOneAndDelete({
      _id: req.params.id,
      institution: req.user.institution,
    });
    if (!ann)
      return res
        .status(404)
        .json({ success: false, message: "Announcement not found" });
    res.json({ success: true, message: "Announcement deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.markAnnouncementRead = async (req, res) => {
  try {
    await Announcement.findByIdAndUpdate(req.params.id, {
      $addToSet: { readBy: req.user._id },
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Leaves ───────────────────────────────────────────────────────
exports.getLeaves = async (req, res) => {
  try {
    const filter = { institution: req.user.institution };

    if (req.user.role === "teacher") {
      // Teachers see their own leaves + leaves from students in their assigned classrooms
      const teacherClassrooms = await Classroom.find({
        classTeacher: req.user._id,
      }).select("_id");
      const classroomIds = teacherClassrooms.map((c) => c._id);
      filter.$or = [
        { applicant: req.user._id },
        { classroom: { $in: classroomIds } },
      ];
    } else if (req.user.role === "student" || req.user.role === "parent") {
      filter.applicant = req.user._id;
    }

    if (req.query.status) filter.status = req.query.status;
    const leaves = await Leave.find(filter)
      .populate("applicant", "firstName lastName role photo")
      .populate("student", "firstName lastName photo")
      .populate("approvedBy", "firstName lastName")
      .sort("-createdAt");
    res.json({ success: true, data: leaves });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.applyLeave = async (req, res) => {
  try {
    let classroomId = req.body.classroom;
    let studentId =
      req.body.student || (req.user.role === "student" ? req.user._id : null);

    // Auto-detect classroom for student or parent applications
    if (
      (req.user.role === "student" || req.user.role === "parent") &&
      !classroomId
    ) {
      const queryId = req.user.role === "student" ? req.user._id : studentId;
      if (queryId) {
        const profile = await StudentProfile.findOne({ userId: queryId });
        if (profile) classroomId = profile.classroom;
      }
    }

    const leave = await Leave.create({
      ...req.body,
      institution: req.user.institution,
      applicant: req.user._id,
      applicantRole: req.user.role,
      classroom: classroomId,
      student: studentId,
    });
    res.status(201).json({ success: true, data: leave });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.approveLeave = async (req, res) => {
  try {
    const { status, approvalNote } = req.body;
    const leave = await Leave.findOne({
      _id: req.params.id,
      institution: req.user.institution,
    });

    if (!leave)
      return res
        .status(404)
        .json({ success: false, message: "Leave not found" });

    if (req.user.role === "teacher") {
      const classroom = await Classroom.findOne({
        _id: leave.classroom,
        classTeacher: req.user._id,
      });
      if (!classroom) {
        return res.status(403).json({
          success: false,
          message:
            "Not authorized. Only the assigned class teacher can approve this leave.",
        });
      }
    } else if (
      req.user.role !== "principal" &&
      req.user.role !== "superadmin"
    ) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized to approve leaves." });
    }

    leave.status = status;
    leave.approvalNote = approvalNote;
    leave.approvedBy = req.user._id;
    leave.approvedAt = new Date();
    await leave.save();

    await leave.populate("applicant", "firstName lastName");
    await leave.populate("student", "firstName lastName");

    res.json({ success: true, data: leave });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Messages ─────────────────────────────────────────────────────
exports.getMessages = async (req, res) => {
  try {
    const filter = {
      institution: req.user.institution,
      $or: [{ from: req.user._id }, { to: req.user._id }],
    };
    const messages = await Message.find(filter)
      .populate("from", "firstName lastName role photo")
      .populate("to", "firstName lastName role photo")
      .populate("studentRef", "firstName lastName")
      .sort("-createdAt");
    res.json({ success: true, data: messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const msg = await Message.create({
      ...req.body,
      institution: req.user.institution,
      from: req.user._id,
    });
    res.status(201).json({ success: true, data: msg });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.markMessageRead = async (req, res) => {
  try {
    await Message.findOneAndUpdate(
      { _id: req.params.id, to: req.user._id },
      { isRead: true },
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Diary Notes ──────────────────────────────────────────────────
exports.getDiaryNotes = async (req, res) => {
  try {
    const { classroomId, date } = req.query;
    const filter = { institution: req.user.institution };
    if (classroomId) filter.classroom = classroomId;
    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      filter.date = { $gte: d, $lt: new Date(d.getTime() + 86400000) };
    }
    const notes = await DiaryNote.find(filter)
      .populate("writtenBy", "firstName lastName")
      .sort("-date");
    res.json({ success: true, data: notes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createDiaryNote = async (req, res) => {
  try {
    const note = await DiaryNote.create({
      ...req.body,
      institution: req.user.institution,
      writtenBy: req.user._id,
    });
    res.status(201).json({ success: true, data: note });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateDiaryNote = async (req, res) => {
  try {
    const note = await DiaryNote.findOneAndUpdate(
      { _id: req.params.id, institution: req.user.institution },
      req.body,
      { new: true },
    );
    if (!note)
      return res
        .status(404)
        .json({ success: false, message: "Note not found" });
    res.json({ success: true, data: note });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteDiaryNote = async (req, res) => {
  try {
    const note = await DiaryNote.findOneAndDelete({
      _id: req.params.id,
      institution: req.user.institution,
    });
    if (!note)
      return res
        .status(404)
        .json({ success: false, message: "Note not found" });
    res.json({ success: true, message: "Note deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Full Student Data (Single API call) ──────────────────────────
exports.getFullStudentData = async (req, res) => {
  try {
    const { studentId } = req.params;

    const [profile, attendanceRecords, results, fees] = await Promise.all([
      StudentProfile.findOne({ userId: studentId })
        .populate("userId", "firstName lastName email phone photo dateOfBirth")
        .populate(
          "classroom",
          "name grade section classTeacher subjects academicStartDate academicEndDate startTime endTime",
        )
        .populate("guardians.userId", "firstName lastName email phone"),

      Attendance.find({ "records.studentId": studentId, isSubmitted: true })
        .select("date records classroom")
        .sort("date"),

      Result.find({ student: studentId, institution: req.user.institution })
        .populate("exam", "title type term academicYear isPublished status")
        .sort("-createdAt")
        .lean(),

      FeeRecord.find({ student: studentId, institution: req.user.institution }),
    ]);

    if (!profile)
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });

    const attRecords = attendanceRecords.map((a) => ({
      date: a.date,
      status: a.records.find((r) => r.studentId.toString() === studentId)
        ?.status,
    }));
    const totalDays = attRecords.filter((r) => r.status !== "holiday").length;
    const presentDays = attRecords.filter((r) =>
      ["present", "half-day", "late"].includes(r.status),
    ).length;
    const attendancePercentage =
      totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    const publishedResults = results.filter(
      (r) => r.exam?.isPublished || r.exam?.status === "announced",
    );

    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 86400000);
    const studentDOB = profile.userId?.dateOfBirth || profile.dateOfBirth;
    const isBirthdaySoon =
      studentDOB &&
      (() => {
        const bDay = new Date(studentDOB);
        bDay.setFullYear(today.getFullYear());
        return bDay >= today && bDay <= nextWeek;
      })();

    res.json({
      success: true,
      data: {
        profile,
        attendance: {
          records: attRecords,
          percentage: attendancePercentage,
          totalDays,
          presentDays,
        },
        results: publishedResults,
        fees: {
          records: fees,
          totalDue: fees.reduce((s, f) => s + (f.dueAmount || 0), 0),
          totalPaid: fees.reduce((s, f) => s + (f.paidAmount || 0), 0),
        },
        meta: { isBirthdaySoon },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
