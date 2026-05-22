const express = require('express');
const r = express.Router();
const { getLeaves, applyLeave, approveLeave } = require('../controllers/miscController');
const { protect, authorize } = require('../middleware/authMiddleware');
r.use(protect);
r.get('/', getLeaves);
r.post('/', applyLeave);
r.patch('/:id/approve', authorize('principal', 'teacher'), approveLeave);
module.exports = r;
