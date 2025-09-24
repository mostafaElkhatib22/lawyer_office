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
import { Search, Moon, Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityIndicator } from "@/components/ui/activity-indicator";

/**
 * Dashboard Page (Next.js client component)
 * - يجلب البيانات من /api/cases و /api/clients
 * - يحسب: إجمالي الدعاوى، إجمالي الموكلين، جلسات الغد
 * - يعرض توزيع الدعاوى (ابتدائي/استئناف/نقض) في PieChart
 * - يعرض BarChart شهري لعدد الدعاوى
 * - يعرض آخر 5 موكلين وآخر 5 دعاوى
 *
 * ضع هذا الملف في: src/app/dashboard/page.tsx
 * يحتاج إلى: recharts, axios, framer-motion, lucide-react, shadcn UI components
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

const COLORS = ["#FF7A59", "#6C5CE7", "#24C1FF"]; // ألوان للمخطط الدائري

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [cases, setCases] = useState<CaseType[]>([]);
  const [clients, setClients] = useState<ClientType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
  }, [status, router]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [casesRes, clientsRes] = await Promise.all([
          axios.get("/api/cases"),
          axios.get("/api/clients"),
        ]);

        // افترض أن الـ API يرجع { success: true, data: [...] }
        setCases(casesRes.data?.data || []);
        setClients(clientsRes.data?.data || []);
      } catch (err: any) {
        console.error("Error fetching dashboard data:", err);
        setError(err.message || "حدث خطأ أثناء جلب البيانات");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
    });
    const result = Object.keys(map).map((k) => ({ name: k, value: map[k] }));
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
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ][m.month - 1],
      count: m.count,
    }));
  }, [cases]);

  // أحدث الموكلين وآخر الدعاوى
  const latestClients = useMemo(() => clients.slice(-5).reverse(), [clients]);
  const latestCases = useMemo(() => cases.slice(-5).reverse(), [cases]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <ActivityIndicator size="large" color="text-blue-500" />
        <span className="mr-4">جاري تحميل البيانات...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="text-red-600 font-semibold mb-4">
          فشل في تحميل البيانات
        </div>
        <div className="mb-4">{error}</div>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded"
          onClick={() => window.location.reload()}
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
      className="min-h-screen p-6 bg-gray-100 dark:bg-gray-900"
    >
      <div className="flex">
        <main className="flex-1">
          {/* Topbar */}

          {/* Breadcrumb */}
          <div className="text-sm text-gray-500 mb-6">
            Dashboards &gt; Overview
          </div>

          {/* Top small cards */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
            <Card className="p-4">
              <CardHeader>
                <CardTitle>عدد الدعاوى</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalCases}</div>
                <div className="text-sm text-gray-500">
                  إجمالي القضايا في النظام
                </div>
              </CardContent>
            </Card>

            <Card className="p-4">
              <CardHeader>
                <CardTitle>عدد الموكلين</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalClients}</div>
                <div className="text-sm text-gray-500">إجمالي الموكلين</div>
              </CardContent>
            </Card>

            <Card className="p-4">
              <CardHeader>
                <CardTitle>جلسات الغد</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{tomorrowSessions}</div>
                <div className="text-sm text-gray-500">
                  عدد الجلسات المقررة غداً
                </div>
              </CardContent>
            </Card>

            <Card className="p-4">
              <CardHeader>
                <CardTitle>توزيع الدعاوى</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  {distributionByType.map((d, i) => (
                    <div key={d.name} className="text-center">
                      <div className="text-lg font-semibold">{d.value}</div>
                      <div className="text-sm text-gray-500">{d.name}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts area */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card className="p-4">
              <CardHeader>
                <CardTitle>توزيع الدعاوى حسب النوع</CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>

            <Card className="p-4">
              <CardHeader>
                <CardTitle>عدد الدعاوى بالشهور</CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          </div>

          {/* Bottom area: latest clients and latest cases */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-4 lg:col-span-1">
              <CardHeader>
                <CardTitle>آخر الموكلين</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {latestClients.map((c) => (
                    <li
                      key={c._id}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium">{c.name}</div>
                        <div className="text-sm text-gray-500">
                          {c.phone || "-"}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(
                          c.createdAt || Date.now()
                        ).toLocaleDateString()}
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="p-4 lg:col-span-2">
              <CardHeader>
                <CardTitle>أحدث الدعاوى</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500">
                        <th className="pb-2">#</th>
                        <th className="pb-2">نوع</th>
                        <th className="pb-2">الموكل</th>
                        <th className="pb-2">جلسة</th>
                        <th className="pb-2">الحالة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {latestCases.map((c, idx) => (
                        <tr key={c._id} className="border-t">
                          <td className="py-3">{idx + 1}</td>
                          <td className="py-3">{c.type}</td>
                          <td className="py-3">
                            {typeof c.client === "string"
                              ? c.client
                              : c.client?.name || "غير معروف"}
                          </td>
                          <td className="py-3">
                            {c.sessiondate
                              ? new Date(c.sessiondate).toLocaleDateString()
                              : "-"}
                          </td>
                          <td className="py-3">{c.status || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </motion.div>
  );
}
