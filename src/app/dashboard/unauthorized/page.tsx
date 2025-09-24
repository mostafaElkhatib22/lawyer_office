"use client"
import { useSearchParams, useRouter } from 'next/navigation';
import { AlertTriangle, ArrowLeft, Shield } from 'lucide-react';
import { Suspense } from 'react';

// Component that uses useSearchParams - needs to be wrapped in Suspense
function UnauthorizedContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reason = searchParams.get('reason') || 'ليس لديك صلاحية للوصول إلى هذه الصفحة';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="rounded-full bg-red-100 p-3">
            <Shield className="h-8 w-8 text-red-600" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          غير مسموح بالوصول
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          ليس لديك الصلاحية اللازمة للوصول إلى هذه الصفحة
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  سبب المنع
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{reason}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="text-sm text-gray-600 space-y-2">
              <p><strong>ماذا يمكنك فعله؟</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>تواصل مع صاحب المكتب لطلب الصلاحية المطلوبة</li>
                <li>تأكد من أنك تستخدم الحساب الصحيح</li>
                <li>ارجع إلى الصفحة الرئيسية للوحة التحكم</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 flex space-x-3 space-x-reverse">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex-1 flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowLeft className="h-4 w-4 ml-2" />
              العودة للوحة التحكم
            </button>
          </div>

          <div className="mt-4">
            <button
              onClick={() => router.back()}
              className="w-full text-center text-sm text-gray-500 hover:text-gray-700"
            >
              العودة للصفحة السابقة
            </button>
          </div>
        </div>
      </div>

      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <h4 className="text-sm font-medium text-yellow-800">
              معلومات التطوير
            </h4>
            <div className="mt-2 text-xs text-yellow-700">
              <p><strong>السبب:</strong> {reason}</p>
              <p>افتح الـ Console للمزيد من التفاصيل</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Loading component to show while Suspense is loading
function UnauthorizedLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="rounded-full bg-red-100 p-3">
            <Shield className="h-8 w-8 text-red-600 animate-pulse" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          جاري التحميل...
        </h2>
      </div>
    </div>
  );
}

// Main component that wraps everything in Suspense
export default function UnauthorizedPage() {
  return (
    <Suspense fallback={<UnauthorizedLoading />}>
      <UnauthorizedContent />
    </Suspense>
  );
}