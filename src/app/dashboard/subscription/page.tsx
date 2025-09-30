/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"
import React, { useState, useEffect } from "react";
import { Check, AlertCircle, Loader2, CreditCard, Smartphone } from "lucide-react";

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

type PaymentGateway = 'paymob' | 'fawry' | 'paypal' | 'stripe';

const SubscriptionPage = () => {
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [error, setError] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("");
  const [showGatewayModal, setShowGatewayModal] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway>('paymob');
  const [planToSubscribe, setPlanToSubscribe] = useState("");

  useEffect(() => {
    fetchSubscriptionData();
    
    // Check for payment result in URL
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment_status');
    const paymentId = params.get('payment_id');
    const message = params.get('message');
    
    if (paymentStatus) {
      handlePaymentRedirect(paymentStatus, paymentId, message);
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

  const checkPaymentStatus = async (paymentId: string, status: string) => {
    try {
      const response = await fetch(`/api/payment/processed-callback/${paymentId}`);
      const result = await response.json();
      
      if (result.success && result.data.status === 'completed') {
        alert("✅ تم الاشتراك بنجاح! تم تفعيل باقتك الجديدة");
        fetchSubscriptionData();
      } else if (status === 'failed') {
        alert("❌ فشلت عملية الدفع. يرجى المحاولة مرة أخرى");
      }
      
      // Clean URL
      window.history.replaceState({}, '', '/dashboard/subscription');
    } catch (err) {
      console.error('Error checking payment status:', err);
    }
  };

  const handleSubscribe = (planKey: string) => {
    if (planKey === 'free') {
      alert('الباقة المجانية نشطة بالفعل');
      return;
    }
    
    setPlanToSubscribe(planKey);
    setShowGatewayModal(true);
  };

  const processPayment = async () => {
    if (!planToSubscribe || !selectedGateway) return;

    setSubscribing(true);
    setSelectedPlan(planToSubscribe);

    try {
      const response = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planKey: planToSubscribe,
          gateway: selectedGateway
        }),
      });

      const result = await response.json();

      if (result.success && result.paymentUrl) {
        // Redirect to payment gateway
        window.location.href = result.paymentUrl;
      } else {
        alert(result.message || "فشل في إنشاء عملية الدفع");
        setSubscribing(false);
        setSelectedPlan("");
      }
    } catch (err) {
      alert("حدث خطأ في عملية الدفع");
      setSubscribing(false);
      setSelectedPlan("");
    }
  };

  const PaymentGatewayModal = () => {
    if (!showGatewayModal) return null;

    const gateways = [
      { id: 'paymob' as PaymentGateway, name: 'Paymob - بطاقات مصرية', icon: CreditCard, enabled: true },
      { id: 'fawry' as PaymentGateway, name: 'فوري - محافظ إلكترونية', icon: Smartphone, enabled: false },
      { id: 'paypal' as PaymentGateway, name: 'PayPal', icon: CreditCard, enabled: false },
      { id: 'stripe' as PaymentGateway, name: 'Stripe', icon: CreditCard, enabled: false }
    ];

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-md w-full p-6">
          <h3 className="text-xl font-bold mb-4">اختر وسيلة الدفع</h3>
          
          <div className="space-y-3 mb-6">
            {gateways.map((gateway) => (
              <button
                key={gateway.id}
                onClick={() => setSelectedGateway(gateway.id)}
                disabled={!gateway.enabled}
                className={`w-full p-4 rounded-lg border-2 transition-all flex items-center gap-3 ${
                  selectedGateway === gateway.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${!gateway.enabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <gateway.icon className="w-6 h-6 text-gray-600" />
                <div className="flex-1 text-right">
                  <div className="font-semibold">{gateway.name}</div>
                  {!gateway.enabled && (
                    <div className="text-sm text-gray-500">قريباً</div>
                  )}
                </div>
                {selectedGateway === gateway.id && (
                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                سيتم تحويلك لصفحة الدفع الآمنة. بعد إتمام الدفع، سيتم تفعيل باقتك تلقائياً.
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowGatewayModal(false);
                setPlanToSubscribe("");
              }}
              className="flex-1 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 font-semibold"
            >
              إلغاء
            </button>
            <button
              onClick={processPayment}
              disabled={subscribing}
              className="flex-1 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {subscribing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري المعالجة...
                </>
              ) : (
                'متابعة للدفع'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">خطأ</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const isFreePlan = data.currentPlan === "free";
  const usagePercentage = data.usage.cases.percentage;
  const isNearLimit = usagePercentage >= 80;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8" dir="rtl">
      <PaymentGatewayModal />
      
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            باقات الاشتراك
          </h1>
          <p className="text-gray-600">اختر الباقة المناسبة لاحتياجات مكتبك</p>
        </div>

        {isFreePlan && (
          <div
            className={`mb-8 rounded-lg p-6 ${
              isNearLimit
                ? "bg-orange-50 border-2 border-orange-200"
                : "bg-blue-50 border border-blue-200"
            }`}
          >
            <div className="flex items-start gap-4">
              <AlertCircle
                className={`w-6 h-6 ${
                  isNearLimit ? "text-orange-600" : "text-blue-600"
                } mt-1`}
              />
              <div className="flex-1">
                <h3
                  className={`font-semibold mb-2 ${
                    isNearLimit ? "text-orange-900" : "text-blue-900"
                  }`}
                >
                  {isNearLimit
                    ? "أوشكت على الوصول للحد الأقصى!"
                    : "أنت في النسخة التجريبية"}
                </h3>
                <p
                  className={`text-sm mb-3 ${
                    isNearLimit ? "text-orange-800" : "text-blue-800"
                  }`}
                >
                  استخدمت {data.usage.cases.current} من {data.usage.cases.max}{" "}
                  دعوى ({usagePercentage}%)
                </p>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      isNearLimit ? "bg-orange-500" : "bg-blue-500"
                    }`}
                    style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                  />
                </div>
                {data.usage.cases.remaining <= 10 && (
                  <p className="text-sm font-semibold text-orange-700">
                    متبقي {data.usage.cases.remaining} دعاوى فقط! قم بالترقية
                    الآن
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(data.availablePlans).map(([key, plan]) => {
            const isCurrent = key === data.currentPlan;
            const isPopular = key === "professional";

            return (
              <div
                key={key}
                className={`relative rounded-xl border-2 p-6 transition-all ${
                  isCurrent
                    ? "border-green-500 bg-green-50"
                    : isPopular
                    ? "border-blue-500 bg-white shadow-lg scale-105"
                    : "border-gray-200 bg-white hover:border-blue-300"
                }`}
              >
                {isCurrent && (
                  <div className="absolute -top-3 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    الباقة الحالية
                  </div>
                )}
                {isPopular && !isCurrent && (
                  <div className="absolute -top-3 right-4 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    الأكثر شعبية
                  </div>
                )}

                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-gray-900">
                      {plan.price}
                    </span>
                    <span className="text-gray-600">جنيه/شهر</span>
                  </div>
                </div>

                <div className="mb-6 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-gray-700">
                      {plan.maxCases === -1
                        ? "دعاوى غير محدودة"
                        : `${plan.maxCases} دعوى`}
                    </span>
                  </div>
                  {/* <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-gray-700">
                      {plan.maxEmployees} موظف
                    </span>
                  </div> */}
                </div>

                <div className="mb-6 space-y-2">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600">{feature}</span>
                    </div>
                  ))}
                </div>

                {!isCurrent && key !== "free" && (
                  <button
                    onClick={() => handleSubscribe(key)}
                    disabled={subscribing}
                    className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                      isPopular
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-gray-900 text-white hover:bg-gray-800"
                    } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                  >
                    {subscribing && selectedPlan === key ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        جاري المعالجة...
                      </>
                    ) : (
                      'اشترك الآن'
                    )}
                  </button>
                )}

                {isCurrent && (
                  <div className="w-full py-3 rounded-lg font-semibold bg-green-100 text-green-700 text-center">
                    باقتك الحالية
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-2">ملاحظات هامة:</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>جميع الأسعار شاملة الضريبة</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>يمكنك الترقية أو التخفيض في أي وقت</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>الدفع آمن ومشفر بالكامل</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>يتم تفعيل الباقة تلقائياً بعد الدفع</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>للتواصل ومعرفة المزيد: support@lawoffice.com</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;

function handlePaymentRedirect(paymentStatus: string, paymentId: string | null, message: string | null) {
  throw new Error("Function not implemented.");
}
