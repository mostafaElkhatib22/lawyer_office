/* eslint-disable @typescript-eslint/no-empty-object-type */
// types/subscription.ts
import mongoose, { Schema, Model, Types } from 'mongoose';
export interface UsageLimits {
  storage: number; // بالميجابايت
  cases: number;
  clients: number;
  documents: number;
  users: number;
}

export interface UsageStats extends UsageLimits {}

export interface UsagePercentages {
  storage: number;
  cases: number;
  clients: number;
  documents: number;
}

export interface PaymentInfo {
  transactionId: string;
  amount: number;
  date: Date;
  status: 'success' | 'failed' | 'pending';
}

export interface SubscriptionDocument {
  _id: string;
  userId: Types.ObjectId;
  plan: SubscriptionPlan;
  limits: UsageLimits;
  usage: UsageStats;
  isActive: boolean;
  startDate: Date;
  endDate: Date;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'cancelled';
  lastPayment?: PaymentInfo;
  paymentHistory?: PaymentInfo[];
  cancelDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type SubscriptionPlan = 'free' | 'professional' | 'premium' | 'enterprise';

export interface PlanDetails {
  name: string;
  price: number;
  currency: string;
  duration: 'monthly' | 'yearly' | 'lifetime';
  limits: UsageLimits;
  features: string[];
}

export type SubscriptionPlans = Record<SubscriptionPlan, PlanDetails>;

// models/Subscription.ts

const subscriptionSchema = new Schema<SubscriptionDocument>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  plan: {
    type: String,
    enum: ['free', 'professional', 'premium', 'enterprise'] as SubscriptionPlan[],
    default: 'free' as SubscriptionPlan
  },
  limits: {
    storage: {
      type: Number,
      default: 500
    },
    cases: {
      type: Number,
      default: 50
    },
    clients: {
      type: Number,
      default: 100
    },
    documents: {
      type: Number,
      default: 1000
    },
    users: {
      type: Number,
      default: 1
    }
  },
  usage: {
    storage: {
      type: Number,
      default: 0
    },
    cases: {
      type: Number,
      default: 0
    },
    clients: {
      type: Number,
      default: 0
    },
    documents: {
      type: Number,
      default: 0
    },
    users: {
      type: Number,
      default: 1
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'cancelled'],
    default: 'paid'
  },
  lastPayment: {
    transactionId: String,
    amount: Number,
    date: Date,
    status: {
      type: String,
      enum: ['success', 'failed', 'pending']
    }
  },
  paymentHistory: [{
    transactionId: String,
    amount: Number,
    date: Date,
    status: {
      type: String,
      enum: ['success', 'failed', 'pending']
    }
  }],
  cancelDate: Date
}, {
  timestamps: true
});

// خطط الاشتراك المحددة مسبقاً
export const SUBSCRIPTION_PLANS: SubscriptionPlans = {
  free: {
    name: 'المجاني',
    price: 0,
    currency: 'EGP',
    duration: 'lifetime',
    limits: {
      storage: 500,
      cases: 50,
      clients: 100,
      documents: 1000,
      users: 1
    },
    features: [
      'إدارة القضايا الأساسية',
      'قاعدة بيانات العملاء',
      'تخزين المستندات',
      'التقارير الأساسية'
    ]
  },
  professional: {
    name: 'المحترف',
    price: 299,
    currency: 'EGP',
    duration: 'monthly',
    limits: {
      storage: 5000,
      cases: 500,
      clients: 1000,
      documents: 10000,
      users: 3
    },
    features: [
      'جميع مزايا الخطة المجانية',
      'تقارير متقدمة',
      'تذكيرات تلقائية',
      'تصدير البيانات',
      'دعم فني مُحسن'
    ]
  },
  premium: {
    name: 'المميز',
    price: 499,
    currency: 'EGP',
    duration: 'monthly',
    limits: {
      storage: 20000,
      cases: 2000,
      clients: 5000,
      documents: 50000,
      users: 10
    },
    features: [
      'جميع مزايا الخطة المحترفة',
      'تكامل مع المحاكم',
      'قوالب مستندات قانونية',
      'نسخ احتياطية تلقائية',
      'دعم فني أولوية'
    ]
  },
  enterprise: {
    name: 'المؤسسات',
    price: 999,
    currency: 'EGP',
    duration: 'monthly',
    limits: {
      storage: 100000,
      cases: -1, // غير محدود
      clients: -1,
      documents: -1,
      users: 50
    },
    features: [
      'جميع المزايا السابقة',
      'API مخصص',
      'تدريب فريق العمل',
      'دعم فني مخصص',
      'تخصيص كامل للنظام'
    ]
  }
};

const SubscriptionModel: Model<SubscriptionDocument> = mongoose.models.Subscription || 
  mongoose.model<SubscriptionDocument>('Subscription', subscriptionSchema);

export default SubscriptionModel;