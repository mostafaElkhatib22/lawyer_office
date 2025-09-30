"use client";

import { XCircle } from "lucide-react";
import Link from "next/link";

export default function FailedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 px-4">
      <XCircle className="w-20 h-20 text-red-600 mb-6" />
      <h1 className="text-3xl font-bold text-red-700 mb-2">
        فشلت عملية الدفع
      </h1>
      <p className="text-gray-600 mb-6">
        لم يتم إكمال عملية الدفع. برجاء المحاولة مرة أخرى أو اختيار وسيلة دفع مختلفة.
      </p>
      <Link
        href="/subscription"
        className="px-6 py-3 rounded-xl bg-red-600 text-white font-semibold shadow hover:bg-red-700 transition"
      >
        الرجوع لصفحة الاشتراكات
      </Link>
    </div>
  );
}
