const express = require('express');
const r = express.Router();
const { getFullStudentData, getDiaryNotes, createDiaryNote, updateDiaryNote, deleteDiaryNote } = require('../controllers/miscController');
const StudentProfile = require('../models/StudentProfile');
const { protect, authorize } = require('../middleware/authMiddleware');
r.use(protect);

// Full student data in one call
r.get('/:studentId/full', getFullStudentData);

// Diary notes
r.get('/diary', getDiaryNotes);
r.post('/diary', authorize('teacher', 'principal'), createDiaryNote);
r.put('/diary/:id', authorize('teacher', 'principal'), updateDiaryNote);
r.delete('/diary/:id', authorize('teacher', 'principal'), deleteDiaryNote);

// Student profile by userId
r.get('/profile/me', async (req, res) => {
  try {
    const profile = await StudentProfile.findOne({ userId: req.user._id })
      .populate('userId', 'firstName lastName email phone photo')
      .populate('classroom', 'name grade section classTeacher subjects')
      .populate('classroom.classTeacher', 'firstName lastName');
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });
    res.json({ success: true, data: profile });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Parent: get children
r.get('/my-children', async (req, res) => {
  try {
    const profiles = await StudentProfile.find({ 'guardians.userId': req.user._id, isActive: true })
      .populate('userId', 'firstName lastName email phone photo')
      .populate('classroom', 'name grade section');
    res.json({ success: true, data: profiles });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Today + tomorrow birthdays for a classroom
r.get('/birthdays/:classroomId', async (req, res) => {
  try {
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 86400000);
    const profiles = await StudentProfile.find({ classroom: req.params.classroomId, isActive: true })
      .populate('userId', 'firstName lastName photo dateOfBirth');
    const birthdays = profiles.filter(p => {
      const dob = p.dateOfBirth || p.userId?.dateOfBirth;
      if (!dob) return false;
      const bday = new Date(dob);
      return (bday.getDate() === today.getDate() && bday.getMonth() === today.getMonth()) ||
             (bday.getDate() === tomorrow.getDate() && bday.getMonth() === tomorrow.getMonth());
    }).map(p => ({
      student: p.userId,
      dob: p.dateOfBirth,
      isToday: (() => { const d = new Date(p.dateOfBirth || p.userId?.dateOfBirth); return d.getDate() === today.getDate() && d.getMonth() === today.getMonth(); })()
    }));
    res.json({ success: true, data: birthdays });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = r;
