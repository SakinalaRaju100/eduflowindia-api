const express = require('express');
const router = express.Router();

router.use('/auth', require('./authRoutes'));
router.use('/superadmin', require('./superadminRoutes'));
router.use('/principal', require('./principalRoutes'));
router.use('/classrooms', require('./classroomRoutes'));
router.use('/attendance', require('./attendanceRoutes'));
router.use('/exams', require('./examRoutes'));
router.use('/fees', require('./feeRoutes'));
router.use('/calendar', require('./calendarRoutes'));
router.use('/announcements', require('./announcementRoutes'));
router.use('/leaves', require('./leaveRoutes'));
router.use('/messages', require('./messageRoutes'));
router.use('/students', require('./studentRoutes'));
router.use('/salaries', require('./salaryRoutes'));

module.exports = router;
