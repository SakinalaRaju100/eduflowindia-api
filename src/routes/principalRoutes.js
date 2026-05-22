const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/principalController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect, authorize('principal'));
router.get('/school', ctrl.getSchoolProfile);
router.put('/school', ctrl.updateSchoolProfile);
router.get('/classrooms', ctrl.getClassrooms);
router.post('/classrooms', ctrl.createClassroom);
router.put('/classrooms/:id', ctrl.updateClassroom);
router.delete('/classrooms/:id', ctrl.deleteClassroom);
router.get('/teachers', ctrl.getTeachers);
router.post('/teachers', ctrl.createTeacher);
router.post('/teachers/attendance/bulk', ctrl.markTeacherAttendanceBulk);
router.get('/teachers/attendance/bulk', ctrl.getTeacherAttendanceBulk);
router.put('/teachers/:id', ctrl.updateTeacher);
router.post('/teachers/:id/attendance', ctrl.markTeacherAttendance);
router.get('/teachers/:id/attendance', ctrl.getTeacherAttendance);
router.get('/students', ctrl.getStudents);
router.post('/students', ctrl.createStudent);
router.put('/students/:id', ctrl.updateStudent);
router.put('/students/:id/reset-password', ctrl.resetStudentPassword);
router.get('/reports', ctrl.getReports);
router.get('/school-profile', ctrl.getSchoolProfile);
router.put('/school-profile', ctrl.updateSchoolProfile);


module.exports = router;
