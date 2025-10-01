/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// src/models/User.ts (rename from .js to .ts)
import mongoose, { Model, Document } from 'mongoose';
import { SUBSCRIPTION_PLANS, SubscriptionPlanKey } from '@/constants/subscriptionPlans';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// Define interfaces if not importing from separate file
interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  firmName: string;
  phone: string;
  subscriptionPlan: SubscriptionPlanKey;
  subscriptionExpiresAt?: Date;
  authProvider: 'credentials' | 'google';
  googleId?: string;
  accountType: 'owner' | 'employee';
  ownerId?: mongoose.Schema.Types.ObjectId;
  firmInfo: any;
  role: string;
  department: string;
  permissions: any;
  employeeInfo: any;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  createdBy?: mongoose.Schema.Types.ObjectId;

  // Reset Password fields
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;

  // Methods
  matchPassword(enteredPassword: string): Promise<boolean>;
  hasPermission(category: string, action: string): boolean;
  canAccessDepartment(department: string): boolean;
  getEmployees(): any;
  belongsToFirm(firmOwnerId: mongoose.Schema.Types.ObjectId): boolean;
  getResetPasswordToken(): string;
}

interface IUserModel extends Model<IUser> {
  getFirmStats(ownerId: string): Promise<any>;
}

interface IFirmStats {
  totalEmployees: number;
  activeEmployees: number;
  byRole: string[];
  byDepartment: string[];
}

const UserSchema = new mongoose.Schema<IUser>({
  name: {
    type: String,
    required: [true, 'Please provide a name for this user.'],
    trim: true,
  },
  authProvider: {
    type: String,
    enum: ['credentials', 'google'],
    default: 'credentials',
  },
  firmName: {
    type: String,
    sparse: true, // يسمح بقيم null متعددة
  },
  phone: {
    type: String,
    required: false
  },
  email: {
    type: String,
    required: [true, 'Please provide an email for this user.'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  subscriptionPlan: {
    type: String,
    enum: Object.keys(SUBSCRIPTION_PLANS),
    default: 'free',
  },
  subscriptionExpiresAt: { type: Date },
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
    required: function (this: IUser): boolean {
      return this.accountType === 'employee';
    },
    index: true, // فهرس لتسريع البحث
  },

  // معلومات المكتب (للمالك فقط)
  firmInfo: {
    // الحقول الموجودة...

    subscriptionPlan: {
      type: String,
      enum: ['free', 'basic', 'professional', 'enterprise'],
      default: 'free',
    },

    maxCases: {
      type: Number,
      default: 50  // الحد الأقصى في النسخة المجانية
    },

    currentCasesCount: {
      type: Number,
      default: 0
    },

    subscription: {
      isActive: { type: Boolean, default: false },
      planName: { type: String },
      price: { type: Number },
      startDate: { type: Date },
      endDate: { type: Date },
      paymentMethod: { type: String },
      transactionId: { type: String }
    }
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
    default: function () {
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
    sessions: {
      view: { type: Boolean, default: true }
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

  // Reset Password fields
  resetPasswordToken: {
    type: String,
    select: false,
  },
  resetPasswordExpire: {
    type: Date,
    select: false,
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
UserSchema.pre<IUser>('save', async function (next) {
  if (this.isNew && this.accountType === 'employee') {
    const UserModel = this.constructor as Model<IUser>;
    const owner = await UserModel.findById(this.ownerId);
    if (!owner) {
      return next(new Error('صاحب المكتب غير موجود'));
    }

    const employeeCount = await UserModel.countDocuments({
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
UserSchema.pre<IUser>('save', function (next) {
  if (this.isNew || this.isModified('role')) {
    this.permissions = getDefaultPermissions(this.role, this.accountType);
  }
  next();
});

// Hash password before saving the user
UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare entered password with hashed password
UserSchema.methods.matchPassword = async function (enteredPassword: string): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to check if user has specific permission
UserSchema.methods.hasPermission = function (category: string, action: string): boolean {
  return this.permissions[category] && this.permissions[category][action];
};

// Method to check if user can access department cases
UserSchema.methods.canAccessDepartment = function (department: string): boolean {
  return this.department === department || this.hasPermission('cases', 'viewAll');
};

// Method to get all employees for this owner
UserSchema.methods.getEmployees = function () {
  if (this.accountType !== 'owner') {
    throw new Error('فقط صاحب المكتب يمكنه الحصول على قائمة الموظفين');
  }
  const UserModel = this.constructor as Model<IUser>;
  return UserModel.find({
    ownerId: this._id,
    accountType: 'employee'
  }).select('-password');
};

// Method to check if user belongs to specific firm
UserSchema.methods.belongsToFirm = function (firmOwnerId: mongoose.Schema.Types.ObjectId): boolean {
  if (this.accountType === 'owner') {
    return this._id.toString() === firmOwnerId.toString();
  }
  return this.ownerId && this.ownerId.toString() === firmOwnerId.toString();
};

// Method to generate reset password token
UserSchema.methods.getResetPasswordToken = function (): string {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire - 10 minutes
  this.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000);

  return resetToken;
};

// Static method to get firm statistics
UserSchema.statics.getFirmStats = async function (ownerId: string): Promise<IFirmStats> {
  const stats = await this.aggregate([
    { $match: { ownerId: new mongoose.Types.ObjectId(ownerId), accountType: 'employee' } },
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
function getDefaultPermissions(role: string, accountType: string) {
  const permissions = {
    cases: { view: false, create: false, edit: false, delete: false, assign: false, viewAll: false },
    sessions: { view: true },
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
        sessions: { view: true },
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
        sessions: { view: true },
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
        sessions: { view: false },
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
        sessions: { view: false },
        clients: { view: true, create: true, edit: true, delete: false, viewContactInfo: true },
        appointments: { view: true, create: true, edit: true, delete: false, viewAll: false },
        documents: { view: true, upload: true, download: true, delete: false, editSensitive: false },
        financial: { viewReports: false, createInvoices: true, viewPayments: false, editPrices: false },
        employees: { view: false, create: false, edit: false, delete: false, managePermissions: false },
        reports: { viewBasic: true, viewDetailed: false, export: false, viewFinancial: false },
        firmSettings: { viewSettings: false, editSettings: false, manageSubscription: false, manageBackup: false },
      };

    case 'junior_lawyer':
      // محامي مساعد
      return {
        cases: { view: true, create: true, edit: false, delete: false, assign: false, viewAll: false },
        sessions: { view: false },
        clients: { view: true, create: false, edit: false, delete: false, viewContactInfo: true },
        appointments: { view: true, create: true, edit: false, delete: false, viewAll: false },
        documents: { view: true, upload: true, download: true, delete: false, editSensitive: false },
        financial: { viewReports: false, createInvoices: false, viewPayments: false, editPrices: false },
        employees: { view: false, create: false, edit: false, delete: false, managePermissions: false },
        reports: { viewBasic: true, viewDetailed: false, export: false, viewFinancial: false },
        firmSettings: { viewSettings: false, editSettings: false, manageSubscription: false, manageBackup: false },
      };

    case 'legal_assistant':
      // مساعد قانوني
      return {
        cases: { view: true, create: false, edit: false, delete: false, assign: false, viewAll: false },
        sessions: { view: false },
        clients: { view: true, create: false, edit: false, delete: false, viewContactInfo: false },
        appointments: { view: true, create: true, edit: true, delete: false, viewAll: false },
        documents: { view: true, upload: true, download: true, delete: false, editSensitive: false },
        financial: { viewReports: false, createInvoices: false, viewPayments: false, editPrices: false },
        employees: { view: false, create: false, edit: false, delete: false, managePermissions: false },
        reports: { viewBasic: false, viewDetailed: false, export: false, viewFinancial: false },
        firmSettings: { viewSettings: false, editSettings: false, manageSubscription: false, manageBackup: false },
      };

    case 'secretary':
      // سكرتير
      return {
        cases: { view: true, create: false, edit: false, delete: false, assign: false, viewAll: false },
        sessions: { view: false },
        clients: { view: true, create: true, edit: true, delete: false, viewContactInfo: true },
        appointments: { view: true, create: true, edit: true, delete: true, viewAll: true },
        documents: { view: true, upload: true, download: true, delete: false, editSensitive: false },
        financial: { viewReports: false, createInvoices: false, viewPayments: false, editPrices: false },
        employees: { view: false, create: false, edit: false, delete: false, managePermissions: false },
        reports: { viewBasic: true, viewDetailed: false, export: false, viewFinancial: false },
        firmSettings: { viewSettings: false, editSettings: false, manageSubscription: false, manageBackup: false },
      };

    case 'accountant':
      // محاسب
      return {
        cases: { view: true, create: false, edit: false, delete: false, assign: false, viewAll: false },
        sessions: { view: false },
        clients: { view: true, create: false, edit: false, delete: false, viewContactInfo: false },
        appointments: { view: true, create: false, edit: false, delete: false, viewAll: false },
        documents: { view: true, upload: false, download: true, delete: false, editSensitive: false },
        financial: { viewReports: true, createInvoices: true, viewPayments: true, editPrices: true },
        employees: { view: false, create: false, edit: false, delete: false, managePermissions: false },
        reports: { viewBasic: true, viewDetailed: true, export: true, viewFinancial: true },
        firmSettings: { viewSettings: false, editSettings: false, manageSubscription: false, manageBackup: false },
      };

    case 'intern':
      // متدرب
      return {
        cases: { view: true, create: false, edit: false, delete: false, assign: false, viewAll: false },
        sessions: { view: false },
        clients: { view: true, create: false, edit: false, delete: false, viewContactInfo: false },
        appointments: { view: true, create: false, edit: false, delete: false, viewAll: false },
        documents: { view: true, upload: false, download: true, delete: false, editSensitive: false },
        financial: { viewReports: false, createInvoices: false, viewPayments: false, editPrices: false },
        employees: { view: false, create: false, edit: false, delete: false, managePermissions: false },
        reports: { viewBasic: false, viewDetailed: false, export: false, viewFinancial: false },
        firmSettings: { viewSettings: false, editSettings: false, manageSubscription: false, manageBackup: false },
      };

    default:
      return permissions;
  }
}

// Create the model with proper typing
const User = (mongoose.models.User as IUserModel) || mongoose.model<IUser, IUserModel>('User', UserSchema);

export default User;