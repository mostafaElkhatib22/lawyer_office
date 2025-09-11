// src/models/Case.js
import mongoose from 'mongoose';

const CaseSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: [true, 'من فضلك اختر عميل.'],
  },
  caseTypeOF: {
    type: String,
    required: [true, 'من فضلك أضف نوع الدعوى.'],
  },
  type: {
    type: String,
    required: [true, 'من فضلك أضف طبيعة الدعوى.'],
  },
  court: {
    type: String,
    required: [true, 'من فضلك أضف اسم المحكمة.'],
  },
  caseNumber: {
    type: String,
    required: [true, 'من فضلك أضف رقم الدعوى.'],
  },
  year: {
    type: String,
    required: [true, 'من فضلك أضف سنة الدعوى.'],
  },
  decision: {
    type: String,
    default: '',
  },
  attorneyNumber: {
    type: String,
    required: [true, 'من فضلك أضف رقم التوكيل.'],
  },
  caseDate: {
    type: Date,
    default: Date.now,
  },
  sessiondate: {
    type: Date,
    default: Date.now,
  },
  opponents: {
    type: [String],
    default: [],
  },
  nots: {
    type: String,
    default: '',
  },
  files: {
    type: [String],
    default: [],
  },
  status: {
    type: String,
    enum: ['مفتوحة', 'مغلقة', 'مؤجلة', 'مسئنفة','مشطوبة'], // القيم المسموح بيها
    default: 'مفتوحة',
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true
});

export default mongoose.models.Case || mongoose.model('Case', CaseSchema);
