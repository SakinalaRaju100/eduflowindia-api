const { Exam, Result } = require("../models/Exam");
const Classroom = require("../models/Classroom");

// GET /api/exams?classroomId=
exports.getExams = async (req, res) => {
  try {
    const filter = { institution: req.user.institution };
    if (req.query.classroomId) filter.classroom = req.query.classroomId;
    const exams = await Exam.find(filter)
      .populate("classroom", "name grade section")
      .populate("scheduledBy", "firstName lastName")
      .sort("-createdAt")
      .lean();
    res.json({ success: true, data: exams });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/exams
exports.createExam = async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.body.classroom);
    if (!classroom)
      return res
        .status(400)
        .json({ success: false, message: "Classroom not found" });

    const exam = new Exam({
      ...req.body,
      institution: req.user.institution,
      scheduledBy: req.user._id,
      academicYear: classroom.academicYear || req.body.academicYear,
    });
    if (req.body.status) exam.set("status", req.body.status, { strict: false });
    await exam.save();
    res.status(201).json({ success: true, data: exam });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/exams/:id
exports.updateExam = async (req, res) => {
  try {
    const exam = await Exam.findOneAndUpdate(
      { _id: req.params.id, institution: req.user.institution },
      req.body,
      { new: true, strict: false },
    ).lean();
    if (!exam)
      return res
        .status(404)
        .json({ success: false, message: "Exam not found" });
    res.json({ success: true, data: exam });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/exams/:id
exports.deleteExam = async (req, res) => {
  try {
    await Exam.findOneAndDelete({
      _id: req.params.id,
      institution: req.user.institution,
    });
    res.json({ success: true, message: "Exam deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/exams/:id/results - Bulk enter results
exports.enterResults = async (req, res) => {
  try {
    const { results } = req.body; // Array of { studentId, subjectMarks }
    const exam = await Exam.findById(req.params.id);
    if (!exam)
      return res
        .status(404)
        .json({ success: false, message: "Exam not found" });

    const ops = results.map((r) => {
      const totalMarks = r.subjectMarks.reduce(
        (s, m) => s + (m.marksObtained || 0),
        0,
      );
      const maxTotalMarks = r.subjectMarks.reduce(
        (s, m) => s + (m.maxMarks || 100),
        0,
      );
      const percentage =
        maxTotalMarks > 0 ? Math.round((totalMarks / maxTotalMarks) * 100) : 0;
      const gpa =
        percentage >= 90
          ? 10
          : percentage >= 80
            ? 9
            : percentage >= 70
              ? 8
              : percentage >= 60
                ? 7
                : percentage >= 50
                  ? 6
                  : percentage >= 40
                    ? 5
                    : 4;
      const overallGrade =
        percentage >= 90
          ? "A+"
          : percentage >= 80
            ? "A"
            : percentage >= 70
              ? "B+"
              : percentage >= 60
                ? "B"
                : percentage >= 50
                  ? "C"
                  : percentage >= 40
                    ? "D"
                    : "F";
      return {
        updateOne: {
          filter: { exam: exam._id, student: r.studentId },
          update: {
            $set: {
              institution: req.user.institution,
              classroom: exam.classroom,
              academicYear: exam.academicYear || "",
              subjectMarks: r.subjectMarks,
              totalMarks,
              maxTotalMarks,
              percentage,
              gpa,
              overallGrade,
              isPassed: percentage >= 35,
              enteredBy: req.user._id,
            },
          },
          upsert: true,
        },
      };
    });

    await Result.bulkWrite(ops);

    // Calculate ranks
    const allResults = await Result.find({ exam: exam._id }).sort(
      "-percentage",
    );
    const rankOps = allResults.map((res, i) => ({
      updateOne: {
        filter: { _id: res._id },
        update: { $set: { rank: i + 1 } },
      },
    }));
    if (rankOps.length) await Result.bulkWrite(rankOps);

    res.json({ success: true, message: "Results saved successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/exams/results/:studentId
exports.getStudentResults = async (req, res) => {
  try {
    const results = await Result.find({
      student: req.params.studentId,
      institution: req.user.institution,
    })
      .populate("exam", "title type term academicYear")
      .sort("-createdAt")
      .lean();
    res.json({ success: true, data: results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/exams/:id/results - All results for exam
exports.getExamResults = async (req, res) => {
  try {
    const results = await Result.find({ exam: req.params.id })
      .populate("student", "firstName lastName photo")
      .sort("rank");
    res.json({ success: true, data: results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
