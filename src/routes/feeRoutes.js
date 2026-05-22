// feeRoutes.js
const express = require('express');
const r1 = express.Router();
const fc = require('../controllers/feeController');
const { protect, authorize } = require('../middleware/authMiddleware');
r1.use(protect);
r1.get('/', fc.getFees);
r1.post('/', authorize('principal'), fc.createFeeRecord);
r1.get('/defaulters', authorize('principal'), fc.getDefaulters);
r1.get('/student/:studentId', fc.getStudentFees);
r1.patch('/:id/collect', authorize('principal'), fc.collectInstallment);
module.exports = r1;
