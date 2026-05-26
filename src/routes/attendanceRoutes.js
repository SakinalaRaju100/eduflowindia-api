// attendanceRoutes.js
const express = require("express");
const r = express.Router();
const ctrl = require("../controllers/attendanceController");
const { protect, authorize } = require("../middleware/authMiddleware");
r.use(protect);
r.get(
  "/Institution-summary",
  authorize("principal"),
  ctrl.getInstitutionAttendanceSummary,
);
r.get("/student/:studentId", ctrl.getStudentAttendance);
r.get("/student/:studentId/yearly", ctrl.getStudentYearlyAttendance);
r.get("/:classroomId", ctrl.getAttendance);
r.post("/:classroomId", authorize("principal", "teacher"), ctrl.saveAttendance);
r.post(
  "/:classroomId/submit",
  authorize("principal", "teacher"),
  ctrl.submitAttendance,
);
module.exports = r;
