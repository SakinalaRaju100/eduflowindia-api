// classroomRoutes.js
const express = require("express");
const r1 = express.Router();
const Classroom = require("../models/Classroom");
const TeacherProfile = require("../models/TeacherProfile");
const { protect, authorize } = require("../middleware/authMiddleware");

r1.use(protect);
r1.get("/", async (req, res) => {
  try {
    const filter = { institution: req.user.institution, isActive: true };
    if (req.user.role === "teacher") {
      const tp = await TeacherProfile.findOne({ userId: req.user._id });
      if (tp) filter._id = { $in: tp.assignedClasses };
    }
    const classrooms = await Classroom.find(filter)
      .populate("classTeacher", "firstName lastName email photo")
      .populate("students", "_id")
      .sort("grade section");
    res.json({ success: true, data: classrooms });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

r1.get("/:id", async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id)
      .populate("classTeacher", "firstName lastName email photo")
      .populate("students", "firstName lastName photo");
    if (!classroom)
      return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: classroom });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

r1.post(
  "/:id/students",
  authorize("principal", "teacher"),
  async (req, res) => {
    try {
      const { studentIds, action } = req.body; // action: 'add' | 'remove'
      const op =
        action === "remove"
          ? { $pull: { students: { $in: studentIds } } }
          : { $addToSet: { students: { $each: studentIds } } };
      const classroom = await Classroom.findByIdAndUpdate(req.params.id, op, {
        new: true,
      });
      res.json({ success: true, data: classroom });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
);

module.exports = r1;
