/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
// src/app/dashboard/page.tsx
"use client";

import axios from "axios";
import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion"; // لاستخدام التأثيرات الحركية
import { Scale, Users, CalendarCheck2 } from "lucide-react"; // أيقونات Lucide React
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // مكونات Shadcn UI
import { ActivityIndicator } from "@/components/ui/activity-indicator"; // مؤشر تحميل مخصص
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// هام جداً:
// 1. لو هتستخدم الـ Proxy الحل المؤقت (next.config.js)، خليها "/api"
// 2. لو Backend بتاعك متظبط فيه CORS، خليها الـ URL الكامل "https://lawyer-officer.vercel.app/api"
// 3. يفضل استخدام متغيرات البيئة (environment variables) هنا.
const API_BASE_URL = "/api"; // تم التعديل هنا ليتوافق مع حل الـ Proxy في التطوير المحلي

interface Case {
  _id: string;
  caseTypeOF: string;
  type: string;
  court: string;
  caseNumber: number;
  sessiondate: string;
  decision: string;
  year: number;
  attorneyNumber: string;
  caseDate: string;
  opponents: string[];
  nots: string;
  files: string[];
  client: { _id: string; name: string };
}

interface Client {
  _id: string;
  name: string;
  caseCount: number;
}

function HomePage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true); // حالة تحميل البيانات الأولية
  const [error, setError] = useState<string | null>(null); // حالة للتعامل مع الأخطاء
  const router = useRouter();
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [casesRes, clientsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/cases`),
        axios.get(`${API_BASE_URL}/clients`),
      ]);
      setCases(casesRes.data.data);
      setClients(clientsRes.data.data);
    } catch (err: Error | any) {
      console.error("Error fetching data:", err);
      // رسالة خطأ أكثر وضوحاً للمستخدم
      if (err.code === "ERR_NETWORK" && err.message.includes("CORS")) {
        setError(
          "فشل في الاتصال بالخادم. يرجى التأكد من إعدادات CORS في الخادم (Backend)."
        );
      } else {
        setError(`فشل في جلب البيانات: ${err.message || "خطأ غير معروف"}`);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // دالة لحساب عدد جلسات الغد
  const getTomorrowSessionsCount = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // تصفير الوقت للتركيز على التاريخ فقط

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    return cases.filter((e) => {
      const sessionDate = new Date(e.sessiondate);
      // تأكد أن التاريخ صالح قبل المقارنة
      if (isNaN(sessionDate.getTime())) {
        return false;
      }
      return (
        sessionDate.getDate() === tomorrow.getDate() &&
        sessionDate.getMonth() === tomorrow.getMonth() &&
        sessionDate.getFullYear() === tomorrow.getFullYear()
      );
    }).length;
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <ActivityIndicator size="large" color="text-blue-500" />
        <p className="mr-4 text-lg text-gray-600 dark:text-gray-300">
          جاري تحميل البيانات...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center h-screen bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 p-4 rounded-lg">
        <p className="text-xl font-bold">خطأ في التحميل:</p>
        <p className="mt-2 text-lg text-center">{error}</p>
        <button
          onClick={fetchData}
          className="mt-4 px-6 py-2 bg-red-600 text-white rounded-md shadow-md hover:bg-red-700 transition-colors duration-200"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-start min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-50 p-4 sm:p-6 lg:p-8"
    >
      <div className="flex flex-col items-center justify-center w-full max-w-5xl my-8">
        {/* قسم اللوجو والعنوان */}
        <div className="flex flex-col md:flex-row items-center justify-center w-full p-4 md:p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg mb-10 md:mb-16">
          <div className="flex justify-center items-center w-full md:w-1/2 mb-6 md:mb-0">
            <img
              src="https://res.cloudinary.com/dbtbxt0fj/image/upload/v1739993853/lawyer_office/ftxt9a8zudsp3dfz09hr.png"
              alt="Logo Home"
              className="w-4/5 md:w-full max-w-xs md:max-w-md h-auto rounded-xl object-contain"
              loading="lazy"
            />
          </div>
          <div className="flex flex-col justify-center items-center w-full md:w-1/2 text-center md:text-right md:pr-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-blue-800 dark:text-blue-400 leading-tight mb-2">
              الأستاذ/ مصطفى الخطيب
              <br />
              والأستاذ/ السيد الشيشيني
            </h1>
            <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold text-gray-700 dark:text-gray-300 mt-2">
              للاستشارات القانونية والمحاماة
            </p>
          </div>
        </div>

        {/* قسم الإحصائيات - تم استخدام مكونات Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
          {/* عدد الدعاوى */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <Card className="flex flex-col items-center justify-center p-6 text-center bg-white dark:bg-gray-800 rounded-xl shadow-md border-b-4 border-blue-500 hover:border-blue-700 transition-all duration-300">
              <CardHeader className="p-0 mb-4">
                <Scale className="h-12 w-12 text-blue-500" />
              </CardHeader>
              <CardContent className="p-0">
                <CardTitle className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                  {cases.length}
                </CardTitle>
                <p className="text-lg text-gray-700 dark:text-gray-300 mt-2">
                  عدد الدعاوى
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* عدد الموكلين */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <Card className="flex flex-col items-center justify-center p-6 text-center bg-white dark:bg-gray-800 rounded-xl shadow-md border-b-4 border-green-500 hover:border-green-700 transition-all duration-300">
              <CardHeader className="p-0 mb-4">
                <Users className="h-12 w-12 text-green-500" />
              </CardHeader>
              <CardContent className="p-0">
                <CardTitle className="text-4xl font-bold text-green-600 dark:text-green-400">
                  {clients.length}
                </CardTitle>
                <p className="text-lg text-gray-700 dark:text-gray-300 mt-2">
                  عدد الموكلين
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* جلسات الغد */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <Card className="flex flex-col items-center justify-center p-6 text-center bg-white dark:bg-gray-800 rounded-xl shadow-md border-b-4 border-purple-500 hover:border-purple-700 transition-all duration-300">
              <CardHeader className="p-0 mb-4">
                <CalendarCheck2 className="h-12 w-12 text-purple-500" />
              </CardHeader>
              <CardContent className="p-0">
                <CardTitle className="text-4xl font-bold text-purple-600 dark:text-purple-400">
                  {getTomorrowSessionsCount()}
                </CardTitle>
                <p className="text-lg text-gray-700 dark:text-gray-300 mt-2">
                  جلسات الغد
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

export default HomePage;
