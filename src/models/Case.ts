/* eslint-disable @typescript-eslint/no-explicit-any */
// src/models/Case.js
import mongoose, { Schema } from 'mongoose';

// Schema للمدفوعات
const PaymentSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  method: {
    type: String,
    enum: ['نقدي', 'تحويل بنكي', 'شيك', 'بطاقة ائتمان', 'أخرى'],
    default: 'نقدي'
  },
  reference: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  receivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { _id: true, timestamps: true });

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
  nameOfCase: {
    type: String,
    required: [true, 'من فضلك أضف مسمى الدعوى.'],
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
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['مفتوحة', 'مغلقة', 'مؤجلة', 'مسئنفة', 'مشطوبة'],
    default: 'مفتوحة',
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // ===== المعلومات المالية - إضافة جديدة =====
  financialInfo: {
    // إجمالي الأتعاب المتفق عليها
    fees: {
      type: Number,
      default: 0,
      min: 0
    },

    // المبلغ المدفوع (يتم حسابه تلقائيًا من المدفوعات)
    paidAmount: {
      type: Number,
      default: 0,
      min: 0
    },

    // العملة
    currency: {
      type: String,
      default: 'EGP',
      enum: ['EGP', 'USD', 'EUR', 'SAR', 'AED']
    },

    // سجل المدفوعات
    payments: [PaymentSchema],

    // ملاحظات مالية
    financialNotes: {
      type: String,
      trim: true
    },

    // تاريخ آخر دفعة
    lastPaymentDate: {
      type: Date
    }
  }
}, {
  timestamps: true
});

// Indexes لتحسين الأداء
CaseSchema.index({ owner: 1, client: 1 });
CaseSchema.index({ owner: 1, status: 1 });
CaseSchema.index({ owner: 1, caseDate: 1 });
CaseSchema.index({ owner: 1, 'financialInfo.fees': 1 });
CaseSchema.index({ createdBy: 1 });

// Virtual للحصول على المبلغ المتبقي
CaseSchema.virtual('financialInfo.remainingAmount').get(function () {
  const fees = this.financialInfo?.fees || 0;
  const paid = this.financialInfo?.paidAmount || 0;
  return fees - paid;
});

// Virtual للحصول على حالة الدفع
CaseSchema.virtual('financialInfo.paymentStatus').get(function () {
  const fees = this.financialInfo?.fees || 0;
  const paid = this.financialInfo?.paidAmount || 0;

  if (fees === 0) return 'no_fees';
  if (paid === 0) return 'unpaid';
  if (paid >= fees) return 'paid';
  return 'partial';
});

// Virtual للحصول على title (لأن الـ API بيتوقع title)
CaseSchema.virtual('title').get(function () {
  return this.nameOfCase;
});

// Middleware لتحديث المبلغ المدفوع وتاريخ آخر دفعة
CaseSchema.pre('save', function (next) {
  // تحديث تاريخ آخر دفعة
  if (this.financialInfo?.payments && this.financialInfo.payments.length > 0) {
    const sortedPayments = [...this.financialInfo.payments].sort((a, b: any) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    this.financialInfo.lastPaymentDate = sortedPayments[0].date;
  }

  // حساب إجمالي المدفوع من سجل المدفوعات
  if (this.financialInfo?.payments && this.financialInfo.payments.length > 0) {
    this.financialInfo.paidAmount = this.financialInfo.payments.reduce(
      (total, payment) => total + (payment.amount || 0),
      0
    );
  }

  next();
});

// Method لإضافة دفعة جديدة
CaseSchema.methods.addPayment = function (paymentData: any) {
  if (!this.financialInfo) {
    this.financialInfo = { payments: [] };
  }
  if (!this.financialInfo.payments) {
    this.financialInfo.payments = [];
  }

  this.financialInfo.payments.push(paymentData);

  // إعادة حساب المبلغ المدفوع
  this.financialInfo.paidAmount = this.financialInfo.payments.reduce(
    (total: any, payment: any) => total + (payment.amount || 0),
    0
  );

  return this.save();
};

// Method للحصول على حالة الدفع
CaseSchema.methods.getPaymentStatus = function () {
  const fees = this.financialInfo?.fees || 0;
  const paid = this.financialInfo?.paidAmount || 0;

  if (fees === 0) return 'no_fees';
  if (paid === 0) return 'unpaid';
  if (paid >= fees) return 'paid';
  return 'partial';
};

// Method للحصول على المبلغ المتبقي
CaseSchema.methods.getRemainingAmount = function () {
  const fees = this.financialInfo?.fees || 0;
  const paid = this.financialInfo?.paidAmount || 0;
  return fees - paid;
};

// إعداد virtuals في JSON
CaseSchema.set('toJSON', { virtuals: true });
CaseSchema.set('toObject', { virtuals: true });

export default mongoose.models.Case || mongoose.model('Case', CaseSchema);