const express = require('express');
const router = express.Router();
const { getSchools, createSchool, updateSchool, deleteSchool, getStats } = require('../controllers/superadminController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect, authorize('superadmin'));
router.get('/schools', getSchools);
router.post('/schools', createSchool);
router.put('/schools/:id', updateSchool);
router.delete('/schools/:id', deleteSchool);
router.get('/stats', getStats);

module.exports = router;
