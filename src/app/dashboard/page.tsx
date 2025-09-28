/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
 
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

type CaseType = {
  _id: string;
  type: string;
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

const COLORS = [
  "#FF7A59",
  "#6C5CE7",
  "#24C1FF",
  "#00B894",
  "#FFD700",
  "#FF69B4",
];

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
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }

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

      await new Promise((resolve) => setTimeout(resolve, 300));

      const results = await Promise.allSettled([
        axios.get("/api/cases").catch((err) => {
          console.error("Cases API Error:", err);
          throw err;
        }),
        axios.get("/api/clients").catch((err) => {
          console.error("Clients API Error:", err);
          throw err;
        }),
      ]);
      let casesData: CaseType[] = [];
      let clientsData: ClientType[] = [];

      if (results[0].status === "fulfilled") {
        casesData = results[0].value.data?.data || [];
        setCases(casesData);
      } else {
        console.error("Cases API failed:", results[0].reason);
        setCases([]);
      }

      if (results[1].status === "fulfilled") {
        clientsData = results[1].value.data?.data || [];
        setClients(clientsData);
      } else {
        console.error("Clients API failed:", results[1].reason);
        setClients([]);

        if (retryCount < 2) {
          setTimeout(() => {
            console.log("Will retry clients API...");
            retryClientsAPI();
          }, 2000);
        }
      }

      if (
        results[0].status === "rejected" &&
        results[1].status === "rejected"
      ) {
        throw new Error("فشل في تحميل جميع البيانات");
      }
    } catch (err: any) {
      console.error("Error fetching dashboard data:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "حدث خطأ أثناء جلب البيانات";
      setError(errorMessage);

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

  const retryClientsAPI = async () => {
    try {
      console.log("Retrying clients API...");
      const clientsRes = await axios.get("/api/clients");
      setClients(clientsRes.data?.data || []);
    } catch (retryErr: any) {
      console.error("Clients retry failed:", retryErr);
    }
  };

  const handleRetry = () => {
    if (status === "authenticated") {
      setRetryCount((prev) => prev + 1);
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

  // توزيع حسب النوع
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
      .filter((item) => item.value > 0);
    return result;
  }, [cases]);

  // بيانات شهرية للأعمدة
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
        "يناير",
        "فبراير",
        "مارس",
        "أبريل",
        "مايو",
        "يونيو",
        "يوليو",
        "أغسطس",
        "سبتمبر",
        "أكتوبر",
        "نوفمبر",
        "ديسمبر",
      ][m.month - 1],
      count: m.count,
    }));
  }, [cases]);

  // أحدث الموكلين وآخر الدعاوى
  const latestClients = useMemo(
    () =>
      clients
        .slice(-5)
        .reverse()
        .map((client) => ({
          ...client,
          displayDate: client.createdAt
            ? new Date(client.createdAt).toLocaleDateString("ar-EG")
            : "غير محدد",
        })),
    [clients]
  );

  const latestCases = useMemo(
    () =>
      cases
        .slice(-5)
        .reverse()
        .map((caseItem) => ({
          ...caseItem,
          displaySessionDate: caseItem.sessiondate
            ? new Date(caseItem.sessiondate).toLocaleDateString("ar-EG")
            : "غير محدد",
          clientName:
            typeof caseItem.client === "string"
              ? caseItem.client
              : caseItem.client?.name || "غير معروف",
        })),
    [cases]
  );

  // Loading state
  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <ActivityIndicator size="large" color="text-blue-500" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            جاري تحميل البيانات...
          </p>
          {loading && (
            <p className="mt-2 text-sm text-gray-500">
              {retryCount > 0
                ? `محاولة ${retryCount + 1}...`
                : "يرجى الانتظار..."}
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

          {process.env.NODE_ENV === "development" && (
            <div className="mt-6 p-4 bg-gray-200 dark:bg-gray-800 rounded text-left text-sm">
              <h4 className="font-bold mb-2">Debug Info:</h4>
              <p>Session Status: {status}</p>
              <p>User ID: {session?.user?.id || "N/A"}</p>
              <p>Retry Count: {retryCount}</p>
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
      className="min-h-screen p-4 md:p-6 bg-gray-100 dark:bg-gray-900"
    >
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="text-sm text-gray-500 mb-6">
          لوحة التحكم &gt; نظرة عامة
        </div>

        {/* Top small cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
          {[
            {
              title: "عدد الدعاوى",
              value: totalCases,
              color: "text-blue-600",
              desc: "إجمالي القضايا في النظام",
            },
            {
              title: "عدد الموكلين",
              value: totalClients,
              color: "text-green-600",
              desc: "إجمالي الموكلين",
            },
            {
              title: "جلسات الغد",
              value: tomorrowSessions,
              color: "text-orange-600",
              desc: "عدد الجلسات المقررة غداً",
            },
            {
              title: "توزيع الدعاوى",
              value: distributionByType.length,
              color: "text-purple-600",
              desc: "عدد أنواع الدعاوى",
            },
          ].map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-4 h-full">
                <CardHeader className="p-0 pb-2">
                  <CardTitle className="text-sm md:text-base">
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div
                    className={`text-2xl md:text-3xl font-bold ${item.color}`}
                  >
                    {item.value}
                  </div>
                  <div className="text-xs md:text-sm text-gray-500">
                    {item.desc}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Charts area */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
          {/* Pie Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="p-4 h-full">
              <CardHeader>
                <CardTitle>توزيع الدعاوى حسب النوع</CardTitle>
              </CardHeader>
              <CardContent>
                {distributionByType.length > 0 ? (
                  <div className="h-64 md:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={distributionByType}
                          dataKey="value"
                          nameKey="name"
                          outerRadius={80}
                          label={({ name, percent }) =>
                            `${name} (${((percent as any) * 100).toFixed(1)}%)`
                          }
                        >
                          {distributionByType.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => [`${value} حالة`, "العدد"]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-500">
                    لا توجد بيانات لعرضها
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Bar Chart */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="p-4 h-full">
              <CardHeader>
                <CardTitle>عدد الدعاوى بالشهور</CardTitle>
              </CardHeader>
              <CardContent>
                {casesByMonth.some((m) => m.count > 0) ? (
                  <div className="h-64 md:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={casesByMonth}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip
                          formatter={(value) => [`${value} حالة`, "العدد"]}
                        />
                        <Legend />
                        <Bar
                          dataKey="count"
                          fill="#6C5CE7"
                          name="عدد الدعاوى"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-500">
                    لا توجد بيانات لعرضها
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Bottom area: latest clients and latest cases */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Latest Clients */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="lg:col-span-1"
          >
            <Card className="p-4 h-full">
              <CardHeader>
                <CardTitle>آخر الموكلين</CardTitle>
              </CardHeader>
              <CardContent>
                {latestClients.length > 0 ? (
                  <div className="space-y-3">
                    {latestClients.map((client) => (
                      <div
                        key={client._id}
                        className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg border"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {client.name}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {client.phone || "لا يوجد هاتف"}
                          </div>
                        </div>
                        <div className="text-xs text-gray-400 whitespace-nowrap ml-2">
                          {client.displayDate}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    لا يوجد موكلين حتى الآن
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Latest Cases */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="lg:col-span-2"
          >
            <Card className="p-4 h-full">
              <CardHeader>
                <CardTitle>أحدث الدعاوى</CardTitle>
              </CardHeader>
              <CardContent>
                {latestCases.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-right border-b">
                          <th className="p-3 text-center min-w-[50px]">#</th>
                          <th className="p-3 text-center min-w-[100px]">
                            النوع
                          </th>
                          <th className="p-3 text-center min-w-[120px]">
                            الموكل
                          </th>
                          <th className="p-3 text-center min-w-[120px]">
                            تاريخ الجلسة
                          </th>
                          <th className="p-3 text-center min-w-[100px]">
                            الحالة
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {latestCases.map((caseItem, idx) => (
                          <tr
                            key={caseItem._id}
                            className="border-b hover:bg-gray-50 dark:hover:bg-gray-800"
                          >
                            <td className="p-3 text-center">{idx + 1}</td>
                            <td className="p-3 text-center">
                              {caseItem.type || "غير محدد"}
                            </td>
                            <td className="p-3 text-center truncate max-w-[120px]">
                              {caseItem.clientName}
                            </td>
                            <td className="p-3 text-center">
                              {caseItem.displaySessionDate}
                            </td>
                            <td className="p-3 text-center">
                              <span
                                className={`px-2 py-1 rounded text-xs ${
                                  caseItem.status === "مكتملة"
                                    ? "bg-green-100 text-green-800"
                                    : caseItem.status === "قيد المراجعة"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {caseItem.status || "جديدة"}
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
      </div>
    </motion.div>
  );
}
