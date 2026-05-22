const express = require('express');
const r = express.Router();
const Salary = require('../models/Salary');
const { protect, authorize } = require('../middleware/authMiddleware');

r.use(protect);

r.get('/', authorize('principal', 'superadmin', 'teacher'), async (req, res) => {
  try {
    const filter = { school: req.user.school };
    if (req.user.role === 'teacher') filter.teacher = req.user._id;
    if (req.query.teacherId) filter.teacher = req.query.teacherId;
    const salaries = await Salary.find(filter).populate('teacher', 'firstName lastName email photo').sort('-year -month');
    res.json({ success: true, data: salaries });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

r.post('/', authorize('principal', 'superadmin'), async (req, res) => {
  try {
    const { baseSalary, allowances = 0, deductions = 0, status } = req.body;
    const netSalary = Number(baseSalary) + Number(allowances) - Number(deductions);
    const payload = { ...req.body, netSalary, school: req.user.school };
    if (status === 'paid' && !payload.paymentDate) payload.paymentDate = new Date();
    const salary = await Salary.create(payload);
    res.status(201).json({ success: true, data: salary });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

r.put('/:id', authorize('principal', 'superadmin'), async (req, res) => {
  try {
    const { baseSalary, allowances = 0, deductions = 0, status } = req.body;
    const updateData = { ...req.body };
    if (baseSalary !== undefined) updateData.netSalary = Number(baseSalary) + Number(allowances) - Number(deductions);
    if (status === 'paid' && !updateData.paymentDate) updateData.paymentDate = new Date();
    const salary = await Salary.findOneAndUpdate({ _id: req.params.id, school: req.user.school }, updateData, { new: true });
    res.json({ success: true, data: salary });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

r.delete('/:id', authorize('principal', 'superadmin'), async (req, res) => {
  try {
    const salary = await Salary.findOneAndDelete({ _id: req.params.id, school: req.user.school });
    if (!salary) return res.status(404).json({ success: false, message: 'Salary record not found' });
    res.json({ success: true, message: 'Salary record deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = r;