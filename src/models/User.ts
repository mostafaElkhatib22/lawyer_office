/* eslint-disable @typescript-eslint/no-explicit-any */
// src/models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name for this user.'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide an email for this user.'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Please provide a password for this user.'],
    minlength: 6,
    select: false,
  },
  
  // نوع الحساب
  accountType: {
    type: String,
    enum: ['owner', 'employee'], // owner = صاحب المكتب، employee = موظف
    default: 'owner',
  },
  
  // معرف صاحب المكتب - كل الموظفين مرتبطين بصاحب المكتب
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return this.accountType === 'employee';
    },
    index: true, // فهرس لتسريع البحث
  },
  
  // معلومات المكتب (للمالك فقط)
  firmInfo: {
    firmName: { type: String, trim: true },
    licenseNumber: { type: String, trim: true },
    address: { type: String, trim: true },
    phone: { type: String, trim: true },
    establishedDate: { type: Date },
    // خطة الاشتراك
    subscriptionPlan: {
      type: String,
      enum: ['basic', 'professional', 'enterprise'],
      default: 'basic',
    },
    maxEmployees: { type: Number, default: 10 }, // حد أقصى للموظفين حسب الخطة
  },
  
  role: {
    type: String,
    enum: [
      'owner',           // صاحب المكتب
      'partner',         // شريك
      'senior_lawyer',   // محامي أول
      'lawyer',          // محامي
      'junior_lawyer',   // محامي مساعد
      'legal_assistant', // مساعد قانوني
      'secretary',       // سكرتير
      'accountant',      // محاسب
      'intern'          // متدرب
    ],
    default: function() {
      return this.accountType === 'owner' ? 'owner' : 'lawyer';
    },
  },
  
  department: {
    type: String,
    enum: [
      'civil_law',        // القانون المدني
      'criminal_law',     // القانون الجنائي
      'commercial_law',   // القانون التجاري
      'family_law',       // الأحوال الشخصية
      'labor_law',        // قانون العمل
      'real_estate',      // العقارات
      'corporate_law',    // قانون الشركات
      'tax_law',          // القانون الضريبي
      'administrative',   // الإدارة
      'accounting',       // المحاسبة
      'general'          // عام
    ],
    default: 'general',
  },
  
  permissions: {
    // إدارة القضايا
    cases: {
      view: { type: Boolean, default: true },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
      assign: { type: Boolean, default: false },
      viewAll: { type: Boolean, default: false },
    },
    // إدارة العملاء
    clients: {
      view: { type: Boolean, default: true },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
      viewContactInfo: { type: Boolean, default: true },
    },
    // إدارة المواعيد والجلسات
    appointments: {
      view: { type: Boolean, default: true },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
      viewAll: { type: Boolean, default: false },
    },
    // إدارة المستندات
    documents: {
      view: { type: Boolean, default: true },
      upload: { type: Boolean, default: false },
      download: { type: Boolean, default: true },
      delete: { type: Boolean, default: false },
      editSensitive: { type: Boolean, default: false },
    },
    // الإدارة المالية
    financial: {
      viewReports: { type: Boolean, default: false },
      createInvoices: { type: Boolean, default: false },
      viewPayments: { type: Boolean, default: false },
      editPrices: { type: Boolean, default: false },
    },
    // إدارة الموظفين (للمالك والشركاء فقط)
    employees: {
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
      managePermissions: { type: Boolean, default: false },
    },
    // التقارير والإحصائيات
    reports: {
      viewBasic: { type: Boolean, default: true },
      viewDetailed: { type: Boolean, default: false },
      export: { type: Boolean, default: false },
      viewFinancial: { type: Boolean, default: false },
    },
    // إعدادات المكتب
    firmSettings: {
      viewSettings: { type: Boolean, default: false },
      editSettings: { type: Boolean, default: false },
      manageSubscription: { type: Boolean, default: false },
      manageBackup: { type: Boolean, default: false },
    },
  },
  
  // معلومات إضافية للموظف
  employeeInfo: {
    employeeId: { type: String, sparse: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    hireDate: { type: Date, default: Date.now },
    salary: { type: Number, select: false },
    licenseNumber: { type: String, trim: true },
    specialization: [{ type: String }],
    contractType: {
      type: String,
      enum: ['full_time', 'part_time', 'contract', 'intern'],
      default: 'full_time'
    },
  },
  
  // حالة الحساب
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLogin: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
});

// فهرس مركب لضمان عدم تكرار رقم الموظف في نفس المكتب
UserSchema.index({ ownerId: 1, 'employeeInfo.employeeId': 1 }, { 
  unique: true, 
  sparse: true 
});

// فهارس لتحسين الأداء
UserSchema.index({ email: 1 });
UserSchema.index({ ownerId: 1, role: 1 });
UserSchema.index({ ownerId: 1, department: 1 });
UserSchema.index({ accountType: 1 });

// التحقق من حد الموظفين قبل الحفظ
UserSchema.pre('save', async function(next) {
  if (this.isNew && this.accountType === 'employee') {
    const owner = await this.constructor.findById(this.ownerId);
    if (!owner) {
      return next(new Error('صاحب المكتب غير موجود'));
    }
    
    const employeeCount = await this.constructor.countDocuments({
      ownerId: this.ownerId,
      accountType: 'employee',
      isActive: true
    });
    
    if (employeeCount >= owner.firmInfo.maxEmployees) {
      return next(new Error(`تم الوصول للحد الأقصى من الموظفين (${owner.firmInfo.maxEmployees})`));
    }
  }
  next();
});

// تطبيق الصلاحيات حسب الدور تلقائياً
UserSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('role')) {
    this.permissions = getDefaultPermissions(this.role, this.accountType);
  }
  next();
});

// Hash password before saving the user
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare entered password with hashed password
UserSchema.methods.matchPassword = async function (enteredPassword: string) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to check if user has specific permission
UserSchema.methods.hasPermission = function(category, action) {
  return this.permissions[category] && this.permissions[category][action];
};

// Method to check if user can access department cases
UserSchema.methods.canAccessDepartment = function(department) {
  return this.department === department || this.hasPermission('cases', 'viewAll');
};

// Method to get all employees for this owner
UserSchema.methods.getEmployees = function() {
  if (this.accountType !== 'owner') {
    throw new Error('فقط صاحب المكتب يمكنه الحصول على قائمة الموظفين');
  }
  return this.constructor.find({
    ownerId: this._id,
    accountType: 'employee'
  }).select('-password');
};

// Method to check if user belongs to specific firm
UserSchema.methods.belongsToFirm = function(firmOwnerId: { toString: () => any; }) {
  if (this.accountType === 'owner') {
    return this._id.toString() === firmOwnerId.toString();
  }
  return this.ownerId && this.ownerId.toString() === firmOwnerId.toString();
};
// إضافة static method
UserSchema.statics.getFirmStats = async function (ownerId: string) {
  const totalEmployees = await this.countDocuments({ ownerId, accountType: "employee" });
  const activeEmployees = await this.countDocuments({ ownerId, accountType: "employee", isActive: true });

  return {
    totalEmployees,
    activeEmployees
  };
};

// Static method to get firm statistics
UserSchema.statics.getFirmStats = async function(ownerId) {
  const stats = await this.aggregate([
    { $match: { ownerId:new mongoose.Types.ObjectId(ownerId), accountType: 'employee' } },
    {
      $group: {
        _id: null,
        totalEmployees: { $sum: 1 },
        activeEmployees: { $sum: { $cond: ['$isActive', 1, 0] } },
        byRole: { $push: '$role' },
        byDepartment: { $push: '$department' }
      }
    }
  ]);
  
  return stats[0] || { 
    totalEmployees: 0, 
    activeEmployees: 0, 
    byRole: [], 
    byDepartment: [] 
  };
};

// Function to get default permissions based on role and account type
function getDefaultPermissions(role, accountType) {
  const permissions = {
    cases: { view: false, create: false, edit: false, delete: false, assign: false, viewAll: false },
    clients: { view: false, create: false, edit: false, delete: false, viewContactInfo: false },
    appointments: { view: false, create: false, edit: false, delete: false, viewAll: false },
    documents: { view: false, upload: false, download: false, delete: false, editSensitive: false },
    financial: { viewReports: false, createInvoices: false, viewPayments: false, editPrices: false },
    employees: { view: false, create: false, edit: false, delete: false, managePermissions: false },
    reports: { viewBasic: false, viewDetailed: false, export: false, viewFinancial: false },
    firmSettings: { viewSettings: false, editSettings: false, manageSubscription: false, manageBackup: false },
  };

  switch (role) {
    case 'owner':
      // صاحب المكتب - صلاحيات كاملة
      return {
        cases: { view: true, create: true, edit: true, delete: true, assign: true, viewAll: true },
        clients: { view: true, create: true, edit: true, delete: true, viewContactInfo: true },
        appointments: { view: true, create: true, edit: true, delete: true, viewAll: true },
        documents: { view: true, upload: true, download: true, delete: true, editSensitive: true },
        financial: { viewReports: true, createInvoices: true, viewPayments: true, editPrices: true },
        employees: { view: true, create: true, edit: true, delete: true, managePermissions: true },
        reports: { viewBasic: true, viewDetailed: true, export: true, viewFinancial: true },
        firmSettings: { viewSettings: true, editSettings: true, manageSubscription: true, manageBackup: true },
      };

    case 'partner':
      // شريك - صلاحيات واسعة
      return {
        cases: { view: true, create: true, edit: true, delete: true, assign: true, viewAll: true },
        clients: { view: true, create: true, edit: true, delete: false, viewContactInfo: true },
        appointments: { view: true, create: true, edit: true, delete: true, viewAll: true },
        documents: { view: true, upload: true, download: true, delete: false, editSensitive: true },
        financial: { viewReports: true, createInvoices: true, viewPayments: true, editPrices: false },
        employees: { view: true, create: true, edit: true, delete: false, managePermissions: true },
        reports: { viewBasic: true, viewDetailed: true, export: true, viewFinancial: true },
        firmSettings: { viewSettings: true, editSettings: false, manageSubscription: false, manageBackup: false },
      };

    case 'senior_lawyer':
      // محامي أول
      return {
        cases: { view: true, create: true, edit: true, delete: false, assign: true, viewAll: true },
        clients: { view: true, create: true, edit: true, delete: false, viewContactInfo: true },
        appointments: { view: true, create: true, edit: true, delete: true, viewAll: false },
        documents: { view: true, upload: true, download: true, delete: false, editSensitive: true },
        financial: { viewReports: true, createInvoices: true, viewPayments: true, editPrices: false },
        employees: { view: true, create: false, edit: false, delete: false, managePermissions: false },
        reports: { viewBasic: true, viewDetailed: true, export: true, viewFinancial: false },
        firmSettings: { viewSettings: false, editSettings: false, manageSubscription: false, manageBackup: false },
      };

    case 'lawyer':
      // محامي
      return {
        cases: { view: true, create: true, edit: true, delete: false, assign: false, viewAll: false },
        clients: { view: true, create: true, edit: true, delete: false, viewContactInfo: true },
        appointments: { view: true, create: true, edit: true, delete: false, viewAll: false },
        documents: { view: true, upload: true, download: true, delete: false, editSensitive: false },
        financial: { viewReports: false, createInvoices: true, viewPayments: false, editPrices: false },
        employees: { view: false, create: false, edit: false, delete: false, managePermissions: false },
        reports: { viewBasic: true, viewDetailed: false, export: false, viewFinancial: false },
        firmSettings: { viewSettings: false, editSettings: false, manageSubscription: false, manageBackup: false },
      };

    // باقي الأدوار...
    default:
      return permissions;
  }
}

export default mongoose.models.User || mongoose.model('User', UserSchema);