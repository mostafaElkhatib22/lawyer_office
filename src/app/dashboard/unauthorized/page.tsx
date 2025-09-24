"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

function UnauthorizedContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reason =
    searchParams.get("reason") ||
    "ليس لديك صلاحية للوصول إلى هذه الصفحة";

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 dark:bg-gray-900 px-4">
      {/* Box wrapper */}
      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl max-w-lg w-full p-8 text-center relative overflow-hidden">
        {/* Illustration */}
        <div className="flex justify-center mb-6">
          <Image
            src="/gulfpicasso-edited-image (1).png" // ضع هنا الصورة اللي عايزها
            alt="Unauthorized"
            width={400}
            height={400}
            className="mx-auto"
          />
        </div>

        {/* Title */}
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          غير مسموح بالوصول
        </h2>

        {/* Reason */}
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
          {reason}
        </p>

        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => router.push("/dashboard")}
            className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-6 py-2"
          >
            العودة للوحة التحكم
          </Button>

          <Button
            onClick={() => router.back()}
            variant="outline"
            className="rounded-full border-orange-500 text-orange-500 hover:bg-orange-50 dark:hover:bg-gray-700 px-6 py-2"
          >
            العودة للصفحة السابقة
          </Button>
        </div>
      </div>
    </div>
  );
}

function UnauthorizedLoading() {
  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-50 dark:bg-gray-900">
      <p className="text-gray-600 dark:text-gray-300 animate-pulse">
        جاري التحميل...
      </p>
    </div>
  );
}

export default function UnauthorizedPage() {
  return (
    <Suspense fallback={<UnauthorizedLoading />}>
      <UnauthorizedContent />
    </Suspense>
  );
}
