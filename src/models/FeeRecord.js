const mongoose = require('mongoose');

const feeRecordSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  classroom: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', required: true },
  academicYear: { type: String, required: true },
  feeType: { type: String, required: true }, // Tuition, Library, Transport, etc.
  totalAmount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  dueAmount: { type: Number },
  dueDate: { type: Date },
  installments: [{
    installmentNo: Number,
    amount: Number,
    dueDate: Date,
    paidDate: Date,
    isPaid: { type: Boolean, default: false },
    receiptNo: String,
    paymentMode: { type: String, enum: ['cash', 'cheque', 'online', 'dd'] },
    collectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  }],
  status: { type: String, enum: ['paid', 'partial', 'unpaid', 'overdue'], default: 'unpaid' },
  remarks: String,
}, { timestamps: true });

feeRecordSchema.pre('save', function (next) {
  this.paidAmount = this.installments.filter(i => i.isPaid).reduce((sum, i) => sum + i.amount, 0);
  this.dueAmount = this.totalAmount - this.paidAmount;
  if (this.dueAmount <= 0) this.status = 'paid';
  else if (this.paidAmount > 0) this.status = 'partial';
  else if (this.dueDate && new Date() > this.dueDate) this.status = 'overdue';
  else this.status = 'unpaid';
  next();
});

module.exports = mongoose.model('FeeRecord', feeRecordSchema);
