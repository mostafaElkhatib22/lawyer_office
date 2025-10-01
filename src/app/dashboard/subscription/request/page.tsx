/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, Copy, MessageCircle, Loader2, AlertCircle, CheckCircle2, Download } from 'lucide-react';
import Image from 'next/image';

interface SubscriptionPlan {
  name: string;
  price: number;
  maxCases: number;
  maxEmployees: number;
  features: string[];
}

const SubscriptionRequestPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planKey = searchParams.get('plan');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [planData, setPlanData] = useState<SubscriptionPlan | null>(null);
  const [copiedField, setCopiedField] = useState('');
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  // معلومات الدفع
  const INSTAPAY_INFO = {
    number: '01011442906',
    name: 'Lawyer Office System',
    qrCodeUrl: '/WhatsApp Image 2025-10-01 at 11.28.56_36d536c2.jpg' // ضع صورة الـ QR Code هنا
  };

  const WHATSAPP_NUMBER = '01011442906'; // رقم WhatsApp بدون + أو 00

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // جلب بيانات المستخدم
      const userResponse = await fetch('/api/auth/session');
      const userResult = await userResponse.json();
      
      if (!userResult?.user) {
        router.push('/auth/login');
        return;
      }

      // التأكد من أنه Owner
      if (userResult.user.accountType !== 'owner') {
        alert('هذه الصفحة متاحة لأصحاب المكاتب فقط');
        router.push('/dashboard');
        return;
      }

      setUserData(userResult.user);

      // جلب بيانات الباقة
      const subsResponse = await fetch('/api/subscription');
      const subsResult = await subsResponse.json();

      if (subsResult.success && planKey) {
        const selectedPlan = subsResult.data.availablePlans[planKey];
        if (selectedPlan) {
          setPlanData(selectedPlan);
        } else {
          router.push('/dashboard/subscription');
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('حدث خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(''), 2000);
  };

  const generateWhatsAppMessage = () => {
    if (!userData || !planData) return '';

    const message = `
مرحباً، أريد الاشتراك في النظام

📋 *معلومات الطلب:*
- الاسم: ${userData.name}
- البريد الإلكتروني: ${userData.email}
- رقم الهاتف: ${userData.employeeInfo?.phone || 'غير متوفر'}
- اسم المكتب: ${userData.firmInfo?.firmName || 'غير متوفر'}

💼 *الباقة المختارة:*
- ${planData.name}
- السعر: ${planData.price} جنيه شهرياً

سأقوم بالتحويل عبر InstaPay وإرسال لقطة الشاشة
    `.trim();

    return encodeURIComponent(message);
  };

  const handleWhatsAppContact = () => {
    const message = generateWhatsAppMessage();
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
    window.open(url, '_blank');
    
    // حفظ الطلب في قاعدة البيانات
    saveSubscriptionRequest();
  };

  const saveSubscriptionRequest = async () => {
    if (!planKey || !planData) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/subscription/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planKey,
          planName: planData.name,
          amount: planData.price,
          status: 'pending'
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setRequestSubmitted(true);
      }
    } catch (error) {
      console.error('Error saving request:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!userData || !planData) {
    return null;
  }

  if (requestSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir="rtl">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">تم إرسال الطلب بنجاح!</h2>
          <p className="text-gray-600 mb-6">
            سيقوم فريق خدمة العملاء بمراجعة طلبك والتواصل معك خلال 24 ساعة
          </p>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/dashboard/subscription')}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              العودة للاشتراكات
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              العودة للرئيسية
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4 md:p-8" dir="rtl">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">إتمام طلب الاشتراك</h1>
          <p className="text-gray-600">املأ البيانات وتواصل معنا عبر WhatsApp</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* بيانات الطلب */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              بيانات الطلب
            </h2>

            <div className="space-y-4">
              {/* الاسم */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">الاسم الكامل</label>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <input
                    type="text"
                    value={userData.name}
                    readOnly
                    className="flex-1 bg-transparent outline-none text-gray-900"
                  />
                  <button
                    onClick={() => copyToClipboard(userData.name, 'name')}
                    className="text-gray-500 hover:text-blue-600 transition-colors"
                  >
                    {copiedField === 'name' ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* البريد الإلكتروني */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">البريد الإلكتروني</label>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <input
                    type="email"
                    value={userData.email}
                    readOnly
                    className="flex-1 bg-transparent outline-none text-gray-900"
                  />
                  <button
                    onClick={() => copyToClipboard(userData.email, 'email')}
                    className="text-gray-500 hover:text-blue-600 transition-colors"
                  >
                    {copiedField === 'email' ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* رقم الهاتف */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">رقم الهاتف</label>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <input
                    type="tel"
                    value={userData.employeeInfo?.phone || 'غير متوفر'}
                    readOnly
                    className="flex-1 bg-transparent outline-none text-gray-900"
                  />
                  {userData.employeeInfo?.phone && (
                    <button
                      onClick={() => copyToClipboard(userData.employeeInfo.phone, 'phone')}
                      className="text-gray-500 hover:text-blue-600 transition-colors"
                    >
                      {copiedField === 'phone' ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* اسم المكتب */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">اسم المكتب</label>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <input
                    type="text"
                    value={userData.firmInfo?.firmName || 'غير متوفر'}
                    readOnly
                    className="flex-1 bg-transparent outline-none text-gray-900"
                  />
                </div>
              </div>

              {/* الباقة المختارة */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">الباقة المختارة</span>
                  <span className="px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-full">
                    {planData.name}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-gray-900">{planData.price}</span>
                  <span className="text-gray-600">جنيه/شهر</span>
                </div>
                <div className="mt-3 space-y-1">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>{planData.maxCases === -1 ? 'دعاوى غير محدودة' : `${planData.maxCases} دعوى`}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* معلومات الدفع */}
          <div className="space-y-6">
            {/* InstaPay */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold">2</span>
                </div>
                الدفع عبر InstaPay
              </h2>

              {/* QR Code */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 mb-4 text-center">
                <div className="w-48 h-48 bg-white rounded-xl mx-auto mb-3 flex items-center justify-center border-4 border-gray-200">
                  {/* ضع صورة الـ QR Code الحقيقية هنا */}
                  {/* <Image src={INSTAPAY_INFO.qrCodeUrl} width={1} height={1} alt={'qr'}/> */}
                  <div className="text-center">
                    <div className="w-40 h-40 bg-gray-200 rounded-lg mb-2 flex items-center justify-center">
                      <Image src={INSTAPAY_INFO.qrCodeUrl} width={150} height={150} alt='qr'/>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">امسح الكود للدفع مباشرة</p>
                <button className="text-blue-600 text-sm font-semibold hover:underline flex items-center justify-center gap-1 mx-auto">
                  <Download className="w-4 h-4" />
                  تحميل الكود
                </button>
              </div>

              {/* رقم InstaPay */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">رقم InstaPay</label>
                <div className="flex items-center gap-2 bg-green-50 border-2 border-green-200 rounded-lg p-3">
                  <input
                    type="text"
                    value={INSTAPAY_INFO.number}
                    readOnly
                    className="flex-1 bg-transparent outline-none text-gray-900 font-mono text-lg"
                  />
                  <button
                    onClick={() => copyToClipboard(INSTAPAY_INFO.number, 'instapay')}
                    className="text-gray-500 hover:text-green-600 transition-colors"
                  >
                    {copiedField === 'instapay' ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* الاسم */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">اسم المستلم</label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <span className="text-gray-900">{INSTAPAY_INFO.name}</span>
                </div>
              </div>
            </div>

            {/* WhatsApp */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="font-bold">3</span>
                </div>
                التواصل معنا
              </h2>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4">
                <div className="flex items-start gap-3 text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold mb-2">خطوات إتمام الطلب:</p>
                    <ol className="space-y-1 text-white/90">
                      <li>1. قم بالتحويل عبر InstaPay</li>
                      <li>2. التقط صورة لإثبات الدفع</li>
                      <li>3. تواصل معنا عبر WhatsApp</li>
                      <li>4. أرسل صورة الإيصال</li>
                      <li>5. سيتم تفعيل حسابك خلال ساعات</li>
                    </ol>
                  </div>
                </div>
              </div>

              <button
                onClick={handleWhatsAppContact}
                disabled={submitting}
                className="w-full bg-white text-green-600 py-4 rounded-xl font-bold hover:bg-green-50 transition-all shadow-lg flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-6 h-6" />
                    تواصل عبر WhatsApp
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ملاحظة إضافية */}
        <div className="mt-6 bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-semibold mb-1">ملاحظة هامة:</p>
              <p>يرجى الاحتفاظ بإيصال الدفع حتى يتم تفعيل الاشتراك. سيتم التفعيل خلال 2-6 ساعات من استلام إثبات الدفع.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionRequestPage;