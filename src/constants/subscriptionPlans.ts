// src/constants/subscriptionPlans.ts
export const SUBSCRIPTION_PLANS = {
  free: {
    name: 'النسخة التجريبية',
    price: 0,
    maxCases: 50,
    // maxEmployees: 1,
    features: [
      '50 دعوى فقط',
    //   'موظف واحد فقط',
      'تخزين محدود 500 ميجا',
      'دعم فني محدود'
    ]
  },
  basic: {
    name: 'الباقة الأساسية',
    price: 1000,
    maxCases: 500,
    // maxEmployees: 5,
    features: [
      'حتى 500 دعوى',
    //   'حتى 5 موظفين',
      'تخزين 5 جيجا',
    //   'تقارير متقدمة',
      'دعم فني سريع'
    ]
  },
  professional: {
    name: 'الباقة المحترفة',
    price: 3000,
    maxCases: 2000,
    // maxEmployees: 15,
    features: [
      'حتى 2000 دعوى',
    //   'حتى 15 موظف',
      'تخزين 20 جيجا',
    //   'تقارير مفصلة',
    //   'تكامل مع المحاكم',
      'دعم فني أولوية',
    //   'نسخ احتياطي يومي'
    ]
  },
  enterprise: {
    name: 'باقة المؤسسات',
    price: 5000,
    maxCases: -1, // غير محدود
    // maxEmployees: 50,
    features: [
      'دعاوى غير محدودة',
    //   'حتى 50 موظف',
      'تخزين غير محدود',
      'جميع المميزات',
    //   'API مخصص',
    //   'تدريب الفريق',
      'دعم فني مخصص 24/7'
    ]
  }
} as const;

export type SubscriptionPlanKey = keyof typeof SUBSCRIPTION_PLANS;
