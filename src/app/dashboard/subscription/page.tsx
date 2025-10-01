/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, AlertCircle, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";

interface SubscriptionPlan {
  name: string;
  price: number;
  maxCases: number;
  maxEmployees: number;
  features: string[];
}

interface SubscriptionData {
  currentPlan: string;
  planDetails: SubscriptionPlan;
  usage: {
    cases: {
      current: number;
      max: number;
      percentage: number;
      remaining: number;
    };
  };
  availablePlans: Record<string, SubscriptionPlan>;
}

const SubscriptionPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSubscriptionData();

    const params = new URLSearchParams(window.location.search);
    const success = params.get("success");

    if (success === "true") {
      alert("✅ تم تفعيل اشتراكك بنجاح!");
      window.history.replaceState({}, "", "/dashboard/subscription");
      fetchSubscriptionData();
    }
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      const response = await fetch("/api/subscription");
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("حدث خطأ في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = (planKey: string) => {
    if (planKey === "free") {
      alert("الباقة المجانية نشطة بالفعل");
      return;
    }

    router.push(`/dashboard/subscription/request?plan=${planKey}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen dark:bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 dark:bg-gray-900 min-h-screen">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900 dark:text-red-200">خطأ</h3>
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const isFreePlan = data.currentPlan === "free";
  const usagePercentage = data.usage.cases.percentage;
  const isNearLimit = usagePercentage >= 80;
  const isAtLimit = data.usage.cases.remaining <= 0;
  const showUsage = data.planDetails.maxCases !== -1; // إخفاء الاستخدام للباقة Enterprise

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 md:p-8"
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            باقات الاشتراك
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            اختر الباقة المناسبة لاحتياجات مكتبك
          </p>
        </div>

        {/* عرض الاستخدام الحالي */}
        {showUsage && (
          <div
            className={`mb-8 rounded-xl p-6 shadow-lg ${
              isAtLimit
                ? "bg-gradient-to-r from-red-500 to-orange-500 text-white"
                : isNearLimit
                ? "bg-gradient-to-r from-orange-400 to-yellow-400 text-white"
                : "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
            }`}
          >
            <div className="flex items-start gap-4">
              <AlertCircle className="w-7 h-7 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2">
                  {isAtLimit
                    ? "⛔ وصلت للحد الأقصى! قم بالترقية الآن"
                    : isNearLimit
                    ? "⚠️ أوشكت على الوصول للحد الأقصى!"
                    : `📊 أنت في باقة ${data.planDetails.name}`}
                </h3>
                <p className="text-sm opacity-90 mb-3">
                  استخدمت {data.usage.cases.current} من {data.usage.cases.max}{" "}
                  دعوى ({usagePercentage}%)
                </p>
                <div className="w-full bg-white/30 rounded-full h-3 mb-3 overflow-hidden">
                  <div
                    className="h-3 bg-white rounded-full transition-all duration-500 shadow-lg"
                    style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                  />
                </div>
                {isAtLimit ? (
                  <p className="text-sm font-bold">
                    ⛔ لا يمكنك إضافة دعاوى جديدة. يجب الترقية للاستمرار
                  </p>
                ) : data.usage.cases.remaining <= 10 ? (
                  <p className="text-sm font-semibold">
                    ⏰ متبقي {data.usage.cases.remaining} دعاوى فقط! قم بالترقية
                    الآن
                  </p>
                ) : (
                  <p className="text-sm font-semibold">
                    ✅ متبقي {data.usage.cases.remaining} دعوى من أصل {data.usage.cases.max}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* عرض للباقة Enterprise (بدون حد) */}
        {!showUsage && (
          <div className="mb-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl p-6 shadow-lg text-white">
            <div className="flex items-start gap-4">
              <Sparkles className="w-7 h-7 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2">
                  🎉 أنت في باقة {data.planDetails.name}
                </h3>
                <p className="text-sm opacity-90 mb-2">
                  لديك {data.usage.cases.current} دعوى نشطة
                </p>
                <p className="text-sm font-semibold">
                  ✨ دعاوى غير محدودة - استمتع بالحرية الكاملة!
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(data.availablePlans).map(([key, plan]) => {
            const isCurrent = key === data.currentPlan;
            const isPopular = key === "professional";
            const isRecommended = isFreePlan && key === "basic";

            return (
              <div
                key={key}
                className={`relative rounded-2xl border-2 p-6 transition-all duration-300 ${
                  isCurrent
                    ? "border-green-500 bg-green-50 dark:bg-green-900/20 dark:border-green-600 shadow-xl"
                    : isPopular
                    ? "border-purple-500 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 dark:border-purple-600 shadow-2xl scale-105 lg:scale-110"
                    : isRecommended
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-600 shadow-xl"
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-xl"
                } ${key === "free" ? "opacity-75" : ""}`}
              >
                {isCurrent && (
                  <div className="absolute -top-3 right-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg">
                    ✓ الباقة الحالية
                  </div>
                )}
                {isPopular && !isCurrent && (
                  <div className="absolute -top-3 right-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg animate-pulse">
                    ⭐ الأكثر شعبية
                  </div>
                )}
                {isRecommended && !isCurrent && (
                  <div className="absolute -top-3 right-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg">
                    💡 موصى بها
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {plan.price}
                    </span>
                    <span className="text-gray-600 dark:text-gray-300 font-medium">جنيه/شهر</span>
                  </div>
                </div>

                <div className="mb-6 space-y-3">
                  <div className="flex items-center gap-3 text-sm font-medium">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0">
                      <Check className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-gray-800 dark:text-gray-200">
                      {plan.maxCases === -1
                        ? "∞ دعاوى غير محدودة"
                        : `${plan.maxCases} دعوى`}
                    </span>
                  </div>
                
                </div>

                <div className="mb-6 space-y-2 border-t border-gray-200 dark:border-gray-700 pt-4">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>

                {!isCurrent && key !== "free" && (
                  <button
                    onClick={() => handleSubscribe(key)}
                    className={`w-full py-4 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2 ${
                      isPopular
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
                        : isRecommended
                        ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700"
                        : "bg-gradient-to-r from-gray-800 to-gray-900 text-white hover:from-gray-900 hover:to-black"
                    }`}
                  >
                    اشترك الآن
                  </button>
                )}

                {isCurrent && (
                  <div className="w-full py-4 rounded-xl font-bold bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-300 text-center shadow-lg">
                    ✓ باقتك الحالية
                  </div>
                )}

                {key === "free" && !isCurrent && (
                  <div className="w-full py-4 rounded-xl font-bold bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-center">
                    النسخة التجريبية
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 shadow-lg">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-xl">
            ملاحظات هامة:
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                  دفع آمن 100%
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  الدفع عبر InstaPay محمي وموثوق
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                  مرونة كاملة
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">يمكنك الترقية في أي وقت</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">تفعيل سريع</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  يتم التفعيل خلال 2-6 ساعات
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                  دعم عبر WhatsApp
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  تواصل مباشر مع خدمة العملاء
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
            <p className="text-gray-600 dark:text-gray-300 mb-2">
              هل لديك أسئلة؟ نحن هنا للمساعدة
            </p>
            <div className="flex items-center justify-center gap-4 text-sm">
              <Link
                href="mailto:mostafaelkhatib26@gmail.com"
                className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
              >
                mostafaelkhatib26@gmail.com
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;