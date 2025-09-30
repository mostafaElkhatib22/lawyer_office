"use client";

import { CheckCircle } from "lucide-react";
import Link from "next/link";

export default function SuccessPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-green-50 px-4">
      <CheckCircle className="w-20 h-20 text-green-600 mb-6" />
      <h1 className="text-3xl font-bold text-green-700 mb-2">
        تمت عملية الدفع بنجاح
      </h1>
      <p className="text-gray-600 mb-6">
        شكراً لاشتراكك! تم تفعيل خطتك بنجاح ويمكنك الآن استخدام النظام بدون قيود.
      </p>
      <Link
        href="/dashboard"
        className="px-6 py-3 rounded-xl bg-green-600 text-white font-semibold shadow hover:bg-green-700 transition"
      >
        العودة إلى لوحة التحكم
      </Link>
    </div>
  );
}
