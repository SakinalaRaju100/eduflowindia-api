const Institution = require("../models/Institution");
const User = require("../models/User");
const Classroom = require("../models/Classroom");
const StudentProfile = require("../models/StudentProfile");
const TeacherProfile = require("../models/TeacherProfile");
const { sendWelcomeEmail } = require("../utils/email");
const mongoose = require("mongoose");

const institutionId = (req) => req.user.institution;

// ── Teacher Attendance Model (Dynamic) ──────────────────────────
let TeacherAttendance;
try {
  TeacherAttendance = mongoose.model("TeacherAttendance");
} catch (error) {
  TeacherAttendance = mongoose.model(
    "TeacherAttendance",
    new mongoose.Schema(
      {
        institution: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Institution",
          required: true,
        },
        date: { type: Date, required: true },
        records: [
          {
            teacherId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "TeacherProfile",
              required: true,
            },
            status: {
              type: String,
              required: true,
              enum: [
                "present",
                "absent",
                "half-day",
                "late",
                "leave",
                "holiday",
              ],
            },
          },
        ],
        markedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        isSubmitted: { type: Boolean, default: false },
      },
      { timestamps: true },
    ),
  );
}

// ── Institution Profile ──────────────────────────────────────────────
exports.getInstitutionProfile = async (req, res) => {
  try {
    const institution = await Institution.findById(institutionId(req)).populate(
      "principalId",
      "firstName lastName email phone photo",
    );
    if (!institution)
      return res
        .status(404)
        .json({ success: false, message: "Institution not found" });
    res.json({ success: true, data: institution });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateInstitutionProfile = async (req, res) => {
  try {
    const institution = await Institution.findByIdAndUpdate(
      institutionId(req),
      req.body,
      { new: true, runValidators: true },
    );
    res.json({ success: true, data: institution });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Classrooms ──────────────────────────────────────────────────
exports.getClassrooms = async (req, res) => {
  try {
    const classrooms = await Classroom.find({
      institution: institutionId(req),
      isActive: true,
    })
      .populate("classTeacher", "firstName lastName email photo")
      .sort("grade section");
    res.json({ success: true, data: classrooms });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createClassroom = async (req, res) => {
  try {
    const institution = await Institution.findById(institutionId(req));
    const classroom = await Classroom.create({
      ...req.body,
      institution: institutionId(req),
      academicYear: institution.currentAcademicYear,
    });

    if (req.body.classTeacher) {
      await TeacherProfile.findOneAndUpdate(
        { userId: req.body.classTeacher },
        { $addToSet: { assignedClasses: classroom._id } },
      );
    }

    res.status(201).json({ success: true, data: classroom });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateClassroom = async (req, res) => {
  try {
    const oldClassroom = await Classroom.findOne({
      _id: req.params.id,
      institution: institutionId(req),
    });
    if (!oldClassroom)
      return res
        .status(404)
        .json({ success: false, message: "Classroom not found" });

    const classroom = await Classroom.findOneAndUpdate(
      { _id: req.params.id, institution: institutionId(req) },
      req.body,
      { new: true },
    ).populate("classTeacher", "firstName lastName email");

    const oldTeacher = oldClassroom.classTeacher
      ? oldClassroom.classTeacher.toString()
      : null;
    const newTeacher = req.body.classTeacher
      ? req.body.classTeacher.toString()
      : null;

    if (oldTeacher !== newTeacher) {
      if (oldTeacher) {
        await TeacherProfile.findOneAndUpdate(
          { userId: oldTeacher },
          { $pull: { assignedClasses: classroom._id } },
        );
      }
      if (newTeacher) {
        await TeacherProfile.findOneAndUpdate(
          { userId: newTeacher },
          { $addToSet: { assignedClasses: classroom._id } },
        );
      }
    }

    res.json({ success: true, data: classroom });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteClassroom = async (req, res) => {
  try {
    await Classroom.findOneAndUpdate(
      { _id: req.params.id, institution: institutionId(req) },
      { isActive: false },
    );
    res.json({ success: true, message: "Classroom deactivated" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Teachers ────────────────────────────────────────────────────
exports.getTeachers = async (req, res) => {
  try {
    const teachers = await TeacherProfile.find({
      institution: institutionId(req),
      isActive: true,
    })
      .populate("userId", "firstName lastName email phone photo isActive")
      .populate("assignedClasses", "name grade section");
    res.json({ success: true, data: teachers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createTeacher = async (req, res) => {
  try {
    const {
      email,
      firstName,
      lastName,
      phone,
      qualifications,
      subjectsExpertise,
      employmentType,
      designation,
      department,
      joiningDate,
      dateOfBirth,
      gender,
      address,
    } = req.body;
    const tempPassword = `Teacher@${Math.floor(1000 + Math.random() * 9000)}`;
    const user = await User.create({
      email,
      password: tempPassword,
      role: "teacher",
      institution: institutionId(req),
      firstName,
      lastName,
      phone,
    });

    const institution = await Institution.findById(institutionId(req));
    const teacherCount = await TeacherProfile.countDocuments({
      institution: institutionId(req),
    });
    const teacherId = `TCH-${institution.currentAcademicYear.split("-")[0]}-${String(teacherCount + 1).padStart(3, "0")}`;

    const profile = await TeacherProfile.create({
      userId: user._id,
      institution: institutionId(req),
      teacherId,
      qualifications,
      subjectsExpertise,
      employmentType,
      designation,
      department,
      joiningDate,
      dateOfBirth,
      gender,
      address,
    });

    await sendWelcomeEmail(
      email,
      `${firstName} ${lastName}`,
      email,
      tempPassword,
      "Teacher",
    );
    res.status(201).json({ success: true, data: { user, profile } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateTeacher = async (req, res) => {
  try {
    const profile = await TeacherProfile.findOneAndUpdate(
      { _id: req.params.id, institution: institutionId(req) },
      req.body,
      { new: true },
    ).populate("userId", "firstName lastName email phone photo");
    if (!profile)
      return res
        .status(404)
        .json({ success: false, message: "Teacher not found" });
    if (req.body.firstName || req.body.lastName || req.body.phone) {
      await User.findByIdAndUpdate(profile.userId, {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        phone: req.body.phone,
      });
    }
    res.json({ success: true, data: profile });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.markTeacherAttendanceBulk = async (req, res) => {
  try {
    const { date, records } = req.body;
    const targetDate = new Date(date);
    targetDate.setUTCHours(0, 0, 0, 0);

    const update = {
      institution: institutionId(req),
      markedBy: req.user._id,
      records,
      isSubmitted: true,
    };
    const doc = await TeacherAttendance.findOneAndUpdate(
      { institution: institutionId(req), date: targetDate },
      update,
      { new: true, upsert: true },
    );
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getTeacherAttendanceBulk = async (req, res) => {
  try {
    const targetDate = new Date(req.query.date);
    targetDate.setUTCHours(0, 0, 0, 0);
    const doc = await TeacherAttendance.findOne({
      institution: institutionId(req),
      date: targetDate,
    });
    res.json({ success: true, data: doc || { records: [] } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.markTeacherAttendance = async (req, res) => {
  try {
    const { status, date } = req.body;
    const targetDate = new Date(date);
    targetDate.setUTCHours(0, 0, 0, 0); // Normalize to midnight UTC

    let doc = await TeacherAttendance.findOne({
      institution: institutionId(req),
      date: targetDate,
    });
    if (!doc)
      doc = new TeacherAttendance({
        institution: institutionId(req),
        date: targetDate,
        records: [],
        markedBy: req.user._id,
      });
    const existingRecord = doc.records.find(
      (r) => r.teacherId.toString() === req.params.id,
    );
    if (existingRecord) existingRecord.status = status;
    else doc.records.push({ teacherId: req.params.id, status });
    await doc.save();

    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getTeacherAttendance = async (req, res) => {
  try {
    const { month, year } = req.query;
    const filter = { institution: institutionId(req) };
    if (month && year) {
      const startDate = new Date(Date.UTC(year, month - 1, 1));
      const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59));
      filter.date = { $gte: startDate, $lte: endDate };
    }
    const docs = await TeacherAttendance.find(filter).sort("date");
    const teacherId = req.params.id;
    const mappedRecords = docs
      .map((doc) => {
        const tr = doc.records.find(
          (r) => r.teacherId.toString() === teacherId,
        );
        return tr ? { date: doc.date, status: tr.status } : null;
      })
      .filter(Boolean);

    res.json({ success: true, data: { records: mappedRecords } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Students ────────────────────────────────────────────────────
exports.getStudents = async (req, res) => {
  try {
    const filter = { institution: institutionId(req), isActive: true };
    if (req.query.classroom) filter.classroom = req.query.classroom;
    const students = await StudentProfile.find(filter)
      .populate("userId", "firstName lastName email phone photo")
      .populate("classroom", "name grade section")
      .sort("rollNumber");
    res.json({ success: true, data: students });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createStudent = async (req, res) => {
  try {
    const {
      email,
      firstName,
      lastName,
      phone,
      classroomId,
      rollNumber,
      dateOfBirth,
      gender,
      bloodGroup,
      address,
      admissionDate,
      previousInstitution,
      guardians,
      medicalInfo,
    } = req.body;

    const tempPassword = `Student@${Math.floor(1000 + Math.random() * 9000)}`;
    const user = await User.create({
      email,
      password: tempPassword,
      role: "student",
      institution: institutionId(req),
      firstName,
      lastName,
      phone,
    });

    const institution = await Institution.findById(institutionId(req));
    const studentCount = await StudentProfile.countDocuments({
      institution: institutionId(req),
    });
    const studentId = `STU-${institution.currentAcademicYear.split("-")[0]}-${String(studentCount + 1).padStart(4, "0")}`;

    const profile = await StudentProfile.create({
      userId: user._id,
      institution: institutionId(req),
      classroom: classroomId,
      rollNumber,
      studentId,
      dateOfBirth,
      gender,
      bloodGroup,
      address,
      admissionDate,
      previousInstitution,
      guardians,
      medicalInfo,
      academicYear: institution.currentAcademicYear,
    });

    // Add to classroom
    await Classroom.findByIdAndUpdate(classroomId, {
      $addToSet: { students: user._id },
    });
    await sendWelcomeEmail(
      email,
      `${firstName} ${lastName}`,
      email,
      tempPassword,
      "Student",
    );
    res.status(201).json({ success: true, data: { user, profile } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateStudent = async (req, res) => {
  try {
    const profile = await StudentProfile.findOneAndUpdate(
      { _id: req.params.id, institution: institutionId(req) },
      req.body,
      { new: true },
    )
      .populate("userId", "firstName lastName email phone photo")
      .populate("classroom", "name grade section");
    if (!profile)
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    if (req.body.firstName || req.body.lastName || req.body.phone) {
      await User.findByIdAndUpdate(profile.userId?._id || profile.userId, {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        phone: req.body.phone,
      });
    }
    res.json({ success: true, data: profile });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.resetStudentPassword = async (req, res) => {
  try {
    // Extract User-specific fields from the request body
    const { password, isFirstLogin, ...profileData } = req.body;

    // 1. Update the StudentProfile document
    const studentProfile = await StudentProfile.findByIdAndUpdate(
      req.params.id,
      profileData,
      { new: true, runValidators: true },
    );

    if (!studentProfile) {
      return res
        .status(404)
        .json({ success: false, message: "Student profile not found" });
    }

    // 2. Update the associated User document if necessary
    if (password || isFirstLogin !== undefined) {
      const userId = studentProfile.userId._id || studentProfile.userId;
      const user = await User.findById(userId);

      if (user) {
        if (password) user.password = password;
        if (isFirstLogin !== undefined) user.isFirstLogin = isFirstLogin;

        // Use .save() so the pre('save') hook in User.js hashes the new password
        await user.save();
      }
    }

    res.json({ success: true, data: studentProfile });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/principal/reports
exports.getReports = async (req, res) => {
  try {
    const [totalStudents, totalTeachers, totalClassrooms] = await Promise.all([
      StudentProfile.countDocuments({
        institution: institutionId(req),
        isActive: true,
      }),
      TeacherProfile.countDocuments({
        institution: institutionId(req),
        isActive: true,
      }),
      Classroom.countDocuments({
        institution: institutionId(req),
        isActive: true,
      }),
    ]);
    res.json({
      success: true,
      data: { totalStudents, totalTeachers, totalClassrooms },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
