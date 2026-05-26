const FeeRecord = require("../models/FeeRecord");
const Classroom = require("../models/Classroom");
const { v4: uuidv4 } = require("uuid");

exports.getFees = async (req, res) => {
  try {
    const filter = { institution: req.user.institution };
    if (req.query.studentId) filter.student = req.query.studentId;
    if (req.query.classroomId) filter.classroom = req.query.classroomId;
    if (req.query.status) filter.status = req.query.status;
    const fees = await FeeRecord.find(filter)
      .populate("student", "firstName lastName photo")
      .populate("classroom", "name grade section")
      .sort("-createdAt");
    res.json({ success: true, data: fees });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createFeeRecord = async (req, res) => {
  try {
    const {
      assignTo,
      classroom,
      student,
      feeType,
      totalAmount,
      academicYear,
      installments,
    } = req.body;

    let studentsToAssign = [];
    if (assignTo === "classroom") {
      if (!classroom)
        return res
          .status(400)
          .json({ success: false, message: "Classroom is required" });
      const cls = await Classroom.findById(classroom);
      if (!cls)
        return res
          .status(404)
          .json({ success: false, message: "Classroom not found" });
      studentsToAssign = cls.students;
    } else if (assignTo === "student") {
      if (!student)
        return res
          .status(400)
          .json({ success: false, message: "Student is required" });
      studentsToAssign = [student];
    } else {
      const fee = await FeeRecord.create({
        ...req.body,
        institution: req.user.institution,
      });
      return res.status(201).json({ success: true, data: fee });
    }

    const records = studentsToAssign.map((sid) => ({
      institution: req.user.institution,
      student: sid,
      classroom: classroom,
      academicYear: academicYear || "2024-2025",
      feeType,
      totalAmount,
      dueDate: installments?.[0]?.dueDate || null,
      installments:
        installments?.map((inst, i) => ({
          installmentNo: i + 1,
          amount: inst.amount,
          dueDate: inst.dueDate,
          isPaid: false,
        })) || [],
    }));

    const created = await FeeRecord.insertMany(records);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.collectInstallment = async (req, res) => {
  try {
    const { installmentNo, paymentMode } = req.body;
    const fee = await FeeRecord.findOne({
      _id: req.params.id,
      institution: req.user.institution,
    });
    if (!fee)
      return res
        .status(404)
        .json({ success: false, message: "Fee record not found" });

    const inst = fee.installments.find(
      (i) => i.installmentNo === installmentNo,
    );
    if (!inst)
      return res
        .status(404)
        .json({ success: false, message: "Installment not found" });
    if (inst.isPaid)
      return res.status(400).json({ success: false, message: "Already paid" });

    inst.isPaid = true;
    inst.paidDate = new Date();
    inst.paymentMode = paymentMode;
    inst.receiptNo = `RCP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    inst.collectedBy = req.user._id;

    await fee.save();
    res.json({
      success: true,
      data: fee,
      message: "Payment collected",
      receiptNo: inst.receiptNo,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getStudentFees = async (req, res) => {
  try {
    const fees = await FeeRecord.find({
      student: req.params.studentId,
      institution: req.user.institution,
    });
    const totalDue = fees.reduce((s, f) => s + (f.dueAmount || 0), 0);
    const totalPaid = fees.reduce((s, f) => s + (f.paidAmount || 0), 0);
    res.json({ success: true, data: { fees, totalDue, totalPaid } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getDefaulters = async (req, res) => {
  try {
    const fees = await FeeRecord.find({
      institution: req.user.institution,
      status: { $in: ["overdue", "unpaid"] },
    })
      .populate("student", "firstName lastName photo")
      .populate("classroom", "name grade section");
    res.json({ success: true, data: fees });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
