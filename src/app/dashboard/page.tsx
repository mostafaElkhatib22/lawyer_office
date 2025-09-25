/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityIndicator } from "@/components/ui/activity-indicator";
import { Button } from "@/components/ui/button";

/**
 * Dashboard Page (Next.js client component)
 * - يجلب البيانات من /api/cases و /api/clients
 * - يحسب: إجمالي الدعاوى، إجمالي الموكلين، جلسات الغد
 * - يعرض توزيع الدعاوى (ابتدائي/استئناف/نقض) في PieChart
 * - يعرض BarChart شهري لعدد الدعاوى
 * - يعرض آخر 5 موكلين وآخر 5 دعاوى
 */

type CaseType = {
  _id: string;
  type: string; // مثال: "ابتدائي" | "استئناف" | "نقض" أو قيم أخرى
  caseDate?: string;
  sessiondate?: string;
  client?: { _id: string; name: string } | string;
  status?: string;
};

type ClientType = {
  _id: string;
  name: string;
  phone?: string;
  createdAt?: string;
};

const COLORS = ["#FF7A59", "#6C5CE7", "#24C1FF", "#00B894"]; // ألوان للمخطط الدائري

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [cases, setCases] = useState<CaseType[]>([]);
  const [clients, setClients] = useState<ClientType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // حماية الصفحة من الوصول غير المصرح
  useEffect(() => {
    if (status === "loading") return; // لسة بيتم التحميل

    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }

    // التأكد من وجود بيانات المستخدم الأساسية
    if (status === "authenticated" && !session?.user?.id) {
      console.error("Session authenticated but no user ID found");
      router.push("/auth/login");
      return;
    }
  }, [status, session, router]);

  // جلب البيانات فقط عند تأكيد الـ session
  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      fetchData();
    }
  }, [status, session?.user?.id, retryCount]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("Starting to fetch dashboard data...");
      console.log("Session status:", status);
      console.log("Session user:", session?.user);

      // إضافة delay قصير للتأكد من تحميل الـ session بالكامل
      await new Promise(resolve => setTimeout(resolve, 300));

      // جلب البيانات بشكل منفصل للتعامل مع الأخطاء بشكل أفضل
      const results = await Promise.allSettled([
        axios.get("/api/cases").catch(err => {
          console.error("Cases API Error:", err);
          throw err;
        }),
        axios.get("/api/clients").catch(err => {
          console.error("Clients API Error:", err);
          throw err;
        }),
      ]);

      let casesData: CaseType[] = [];
      let clientsData: ClientType[] = [];

      // التعامل مع نتيجة الـ cases
      if (results[0].status === "fulfilled") {
        console.log("Cases API success:", results[0].value.data);
        casesData = results[0].value.data?.data || [];
        setCases(casesData);
      } else {
        console.error("Cases API failed:", results[0].reason);
        setCases([]); // تعيين مصفوفة فارغة بدلاً من ترك المشكلة تتفاقم
      }

      // التعامل مع نتيجة الـ clients
      if (results[1].status === "fulfilled") {
        console.log("Clients API success:", results[1].value.data);
        clientsData = results[1].value.data?.data || [];
        setClients(clientsData);
      } else {
        console.error("Clients API failed:", results[1].reason);
        setClients([]); // تعيين مصفوفة فارغة
        
        // إذا فشل الـ clients API، جرب مرة تانية بعد شوية
        if (retryCount < 2) { // حد أقصى للمحاولات
          setTimeout(() => {
            console.log("Will retry clients API...");
            retryClientsAPI();
          }, 2000);
        }
      }

      // إذا فشل كلا الـ APIs
      if (results[0].status === "rejected" && results[1].status === "rejected") {
        throw new Error("فشل في تحميل جميع البيانات");
      }

    } catch (err: any) {
      console.error("Error fetching dashboard data:", err);
      const errorMessage = err.response?.data?.message || err.message || "حدث خطأ أثناء جلب البيانات";
      setError(errorMessage);
      
      // إضافة معلومات debug إضافية
      if (err.response?.status === 401) {
        setError("انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى");
        setTimeout(() => router.push("/auth/login"), 2000);
      } else if (err.response?.status === 500) {
        setError("خطأ في الخادم، يرجى المحاولة مرة أخرى");
      }
    } finally {
      setLoading(false);
    }
  };

  // دالة لإعادة المحاولة لجلب العملاء
  const retryClientsAPI = async () => {
    try {
      console.log("Retrying clients API...");
      const clientsRes = await axios.get("/api/clients");
      console.log("Clients retry success:", clientsRes.data);
      setClients(clientsRes.data?.data || []);
    } catch (retryErr: any) {
      console.error("Clients retry failed:", retryErr);
      // لا نضع error هنا لأن باقي البيانات ممكن تكون شغالة
    }
  };

  // إضافة دالة لإعادة تحميل البيانات يدوياً
  const handleRetry = () => {
    if (status === "authenticated") {
      setRetryCount(prev => prev + 1);
    }
  };

  // احصاءات مباشرة
  const totalCases = cases.length;
  const totalClients = clients.length;

  // جلسات الغد
  const tomorrowSessions = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    return cases.filter((c) => {
      if (!c.sessiondate) return false;
      const d = new Date(c.sessiondate);
      return (
        d.getDate() === tomorrow.getDate() &&
        d.getMonth() === tomorrow.getMonth() &&
        d.getFullYear() === tomorrow.getFullYear()
      );
    }).length;
  }, [cases]);

  // توزيع حسب النوع (ابتدائي - استئناف - نقض)
  const distributionByType = useMemo(() => {
    const map: Record<string, number> = {
      ابتدائي: 0,
      استئناف: 0,
      نقض: 0,
      تنفيذ: 0,
    };
    cases.forEach((c) => {
      const t = (c.type || "غير محدد").trim();
      if (map[t] !== undefined) map[t]++;
      else map["غير محدد"] = (map["غير محدد"] || 0) + 1;
    });
    const result = Object.keys(map)
      .map((k) => ({ name: k, value: map[k] }))
      .filter(item => item.value > 0); // إخفاء الفئات التي لا تحتوي على بيانات
    return result;
  }, [cases]);

  // بيانات شهرية للأعمدة (عدد القضايا لكل شهر)
  const casesByMonth = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      count: 0,
    }));
    cases.forEach((c) => {
      const d = c.caseDate
        ? new Date(c.caseDate)
        : c.sessiondate
        ? new Date(c.sessiondate)
        : null;
      if (!d || isNaN(d.getTime())) return;
      const m = d.getMonth();
      months[m].count++;
    });
    return months.map((m) => ({
      month: [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
      ][m.month - 1],
      count: m.count,
    }));
  }, [cases]);

  // أحدث الموكلين وآخر الدعاوى
  const latestClients = useMemo(() => clients.slice(-5).reverse(), [clients]);
  const latestCases = useMemo(() => cases.slice(-5).reverse(), [cases]);

  // Loading state
  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <ActivityIndicator size="large" color="text-blue-500" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">جاري تحميل البيانات...</p>
          {loading && (
            <p className="mt-2 text-sm text-gray-500">
              {retryCount > 0 ? `محاولة ${retryCount + 1}...` : "يرجى الانتظار..."}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-center p-8 max-w-md">
          <div className="text-red-600 font-semibold mb-4 text-xl">
            فشل في تحميل البيانات
          </div>
          <div className="mb-6 text-gray-700 dark:text-gray-300">{error}</div>
          <div className="space-y-4">
            <Button
              onClick={handleRetry}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              إعادة المحاولة
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/auth/login")}
              className="block w-full"
            >
              تسجيل الدخول مرة أخرى
            </Button>
          </div>
          
          {/* Debug info في development mode */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 p-4 bg-gray-200 dark:bg-gray-800 rounded text-left text-sm">
              <h4 className="font-bold mb-2">Debug Info:</h4>
              <p>Session Status: {status}</p>
              <p>User ID: {session?.user?.id || 'N/A'}</p>
              <p>Retry Count: {retryCount}</p>
              <p>Error: {error}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen p-6 bg-gray-100 dark:bg-gray-900"
    >
      <div className="flex">
        <main className="flex-1">
          {/* Breadcrumb */}
          <div className="text-sm text-gray-500 mb-6">
            لوحة التحكم &gt; نظرة عامة
          </div>

          {/* Top small cards */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="p-4">
                <CardHeader>
                  <CardTitle>عدد الدعاوى</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">{totalCases}</div>
                  <div className="text-sm text-gray-500">
                    إجمالي القضايا في النظام
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-4">
                <CardHeader>
                  <CardTitle>عدد الموكلين</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{totalClients}</div>
                  <div className="text-sm text-gray-500">إجمالي الموكلين</div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="p-4">
                <CardHeader>
                  <CardTitle>جلسات الغد</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-600">{tomorrowSessions}</div>
                  <div className="text-sm text-gray-500">
                    عدد الجلسات المقررة غداً
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="p-4">
                <CardHeader>
                  <CardTitle>توزيع الدعاوى</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {distributionByType.slice(0, 4).map((d, i) => (
                      <div key={d.name} className="text-center">
                        <div className="text-lg font-semibold" style={{ color: COLORS[i] }}>
                          {d.value}
                        </div>
                        <div className="text-xs text-gray-500">{d.name}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Charts area */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="p-4">
                <CardHeader>
                  <CardTitle>توزيع الدعاوى حسب النوع</CardTitle>
                </CardHeader>
                <CardContent>
                  {distributionByType.length > 0 ? (
                    <div style={{ width: "100%", height: 300 }}>
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie
                            data={distributionByType}
                            dataKey="value"
                            nameKey="name"
                            outerRadius={90}
                            label
                          >
                            {distributionByType.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-gray-500">
                      لا توجد بيانات لعرضها
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="p-4">
                <CardHeader>
                  <CardTitle>عدد الدعاوى بالشهور</CardTitle>
                </CardHeader>
                <CardContent>
                  {casesByMonth.some(m => m.count > 0) ? (
                    <div style={{ width: "100%", height: 300 }}>
                      <ResponsiveContainer>
                        <BarChart data={casesByMonth}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="count" fill="#FF7A59" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-gray-500">
                      لا توجد بيانات لعرضها
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Bottom area: latest clients and latest cases */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Card className="p-4 lg:col-span-1">
                <CardHeader>
                  <CardTitle>آخر الموكلين</CardTitle>
                </CardHeader>
                <CardContent>
                  {latestClients.length > 0 ? (
                    <ul className="space-y-3">
                      {latestClients.map((c) => (
                        <li
                          key={c._id}
                          className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded"
                        >
                          <div>
                            <div className="font-medium">{c.name}</div>
                            <div className="text-sm text-gray-500">
                              {c.phone || "لا يوجد هاتف"}
                            </div>
                          </div>
                          <div className="text-xs text-gray-400">
                            {new Date(
                              c.createdAt || Date.now()
                            ).toLocaleDateString("ar-EG")}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      لا يوجد موكلين حتى الآن
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <Card className="p-4 lg:col-span-2">
                <CardHeader>
                  <CardTitle>أحدث الدعاوى</CardTitle>
                </CardHeader>
                <CardContent>
                  {latestCases.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-right text-gray-500 border-b">
                            <th className="pb-2">#</th>
                            <th className="pb-2">النوع</th>
                            <th className="pb-2">الموكل</th>
                            <th className="pb-2">تاريخ الجلسة</th>
                            <th className="pb-2">الحالة</th>
                          </tr>
                        </thead>
                        <tbody>
                          {latestCases.map((c, idx) => (
                            <tr key={c._id} className="border-t hover:bg-gray-50 dark:hover:bg-gray-800">
                              <td className="py-3">{idx + 1}</td>
                              <td className="py-3">{c.type || "غير محدد"}</td>
                              <td className="py-3">
                                {typeof c.client === "string"
                                  ? c.client
                                  : c.client?.name || "غير معروف"}
                              </td>
                              <td className="py-3">
                                {c.sessiondate
                                  ? new Date(c.sessiondate).toLocaleDateString("ar-EG")
                                  : "غير محدد"}
                              </td>
                              <td className="py-3">
                                <span className={`px-2 py-1 rounded text-xs ${
                                  c.status === "مكتملة" ? "bg-green-100 text-green-800" :
                                  c.status === "قيد المراجعة" ? "bg-yellow-100 text-yellow-800" :
                                  "bg-gray-100 text-gray-800"
                                }`}>
                                  {c.status || "جديدة"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      لا توجد دعاوى حتى الآن
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Debug info في development mode */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-8 p-4 bg-gray-200 dark:bg-gray-800 rounded">
              <h4 className="font-bold mb-2">معلومات التطوير:</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p>حالة الجلسة: {status}</p>
                  <p>معرف المستخدم: {session?.user?.id || 'غير متوفر'}</p>
                </div>
                <div>
                  <p>عدد القضايا: {cases.length}</p>
                  <p>عدد العملاء: {clients.length}</p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </motion.div>
  );
}