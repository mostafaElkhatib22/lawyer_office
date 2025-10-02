/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from "recharts";
import * as XLSX from "xlsx";
import {
  Search, FileText, XCircle, Calendar, DollarSign, TrendingUp, TrendingDown, Users, Loader
} from "lucide-react";

type CaseType = {
  _id: string;
  client: { name: string } | string;
  caseTypeOF?: string;
  type?: string;
  court?: string;
  caseNumber?: string;
  year?: string | number;
  status?: string;
  sessiondate?: string;
  caseDate?: string;
};

type ClientType = {
  _id: string;
  name: string;
  phone?: string;
  address?: string;
  createdAt?: string;
};

type FinancialClient = {
  clientId: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  cases: any[];
  totalFees: number;
  totalPaid: number;
  totalRemaining: number;
  paymentStatus: string;
};

type Tab = "cases" | "sessions" | "clients" | "financial";

export default function ReportsDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("cases");
  const [cases, setCases] = useState<CaseType[]>([]);
  const [clients, setClients] = useState<ClientType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Financial data
  const [financialData, setFinancialData] = useState({
    summary: {
      totalRevenue: 0,
      totalPaid: 0,
      totalRemaining: 0,
      netIncome: 0,
      totalClients: 0,
      paidClients: 0,
      partialClients: 0,
      unpaidClients: 0,
      totalCases: 0
    },
    clients: [] as FinancialClient[]
  });

  // filters
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("all");

  // load data
  useEffect(() => {
    if (status === "unauthenticated") router.replace("/auth/login");
  }, [status, router]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [casesRes, clientsRes] = await Promise.all([
          axios.get("/api/cases"),
          axios.get("/api/clients"),
        ]);
        setCases((casesRes.data?.data || []).map((c: any) => ({
          ...c,
          client: c.client || (typeof c.client === "string" ? { name: c.client } : { name: "غير معروف" }),
          caseDate: c.caseDate || c.sessiondate || null,
        })));
        setClients(clientsRes.data?.data || []);
      } catch (err: any) {
        console.error(err);
        setError(err?.message || "فشل في جلب البيانات");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Fetch financial data when tab changes to financial or dates change
  useEffect(() => {
    if (tab === "financial") {
      fetchFinancialData();
    }
  }, [tab, fromDate, toDate]);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (fromDate) params.append('from', fromDate);
      if (toDate) params.append('to', toDate);
      
      const response = await axios.get(`/api/reports/financial?${params.toString()}`);
      if (response.data.success) {
        setFinancialData(response.data.data);
      }
    } catch (err: any) {
      console.error('خطأ في جلب البيانات المالية:', err);
      setError(err?.message || 'فشل في جلب التقارير المالية');
    } finally {
      setLoading(false);
    }
  };

  // derived counts & collections
  const totalCases = cases.length;
  const totalClients = clients.length;

  const tomorrowSessionsCount = useMemo(() => {
    const t = new Date(); 
    t.setHours(0,0,0,0); 
    t.setDate(t.getDate()+1);
    return cases.filter(c => {
      if (!c.sessiondate) return false;
      const d = new Date(c.sessiondate);
      return d.getFullYear() === t.getFullYear() &&
             d.getMonth() === t.getMonth() &&
             d.getDate() === t.getDate();
    }).length;
  }, [cases]);

  // distribution for pie
  const distribution = useMemo(() => {
    const map: Record<string, number> = { "ابتدائي": 0, "استئناف": 0, "نقض": 0 };
    cases.forEach(c => {
      const t = (c.type || c.caseTypeOF || "غير محدد").trim();
      if (map[t] !== undefined) map[t] += 1;
    });
    return Object.keys(map).map(k => ({ name: k, value: map[k] }));
  }, [cases]);

  // monthly bar data
  const monthly = useMemo(() => {
    const arr = Array.from({ length: 12 }, (_, i) => ({ 
      monthNum: i, 
      month: ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"][i], 
      count: 0 
    }));
    cases.forEach(c => {
      const d = c.caseDate ? new Date(c.caseDate) : (c.sessiondate ? new Date(c.sessiondate) : null);
      if (!d || isNaN(d.getTime())) return;
      arr[d.getMonth()].count++;
    });
    return arr.map(a => ({ month: a.month, count: a.count }));
  }, [cases]);

  // filtering logic
  const filteredCases = useMemo(() => {
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;
    return cases.filter(c => {
      const dateField = tab === "sessions" ? c.sessiondate : c.caseDate;
      if (from && dateField && new Date(dateField) < from) return false;
      if (to && dateField && new Date(dateField) > to) return false;
      if (statusFilter && c.status && c.status.trim() !== statusFilter.trim()) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const clientName = typeof c.client === "string" ? c.client : (c.client?.name || "");
        if (!((c.caseNumber || "").toString().toLowerCase().includes(q) || clientName.toLowerCase().includes(q))) return false;
      }
      return true;
    });
  }, [cases, fromDate, toDate, statusFilter, searchTerm, tab]);

  const filteredClients = useMemo(() => {
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;
    return clients.filter(c => {
      const d = c.createdAt ? new Date(c.createdAt) : null;
      if (from && d && d < from) return false;
      if (to && d && d > to) return false;
      if (searchTerm && !c.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
  }, [clients, fromDate, toDate, searchTerm]);

  const filteredFinancialClients = useMemo(() => {
    return financialData.clients.filter(client => {
      const matchesSearch = client.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (client.clientEmail || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = paymentStatusFilter === 'all' || client.paymentStatus === paymentStatusFilter;
      return matchesSearch && matchesFilter;
    });
  }, [financialData.clients, searchTerm, paymentStatusFilter]);

  // UI helpers
  const resetFilters = () => { 
    setFromDate(""); 
    setToDate(""); 
    setStatusFilter(""); 
    setSearchTerm(""); 
    setPaymentStatusFilter("all");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { text: string; color: string }> = {
      paid: { text: 'مدفوع بالكامل', color: 'bg-green-100 text-green-800 border-green-200' },
      partial: { text: 'مدفوع جزئياً', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      unpaid: { text: 'غير مدفوع', color: 'bg-red-100 text-red-800 border-red-200' }
    };
    return badges[status] || badges.unpaid;
  };

  // export functions
  const exportToExcel = (target: Tab) => {
    let headers: string[] = [];
    let rows: any[][] = [];
    const dateStamp = new Date().toLocaleDateString("ar-EG").replace(/\//g, "-");
    
    if (target === "cases") {
      headers = ["اسم الموكل","نوع الدعوى","طبيعة","المحكمة","رقم الدعوى","السنة","الحالة","تاريخ الدعوى"];
      rows = filteredCases.map(c => [
        typeof c.client === "string" ? c.client : (c.client?.name || "غير معروف"),
        c.caseTypeOF || "-",
        c.type || "-",
        c.court || "-",
        c.caseNumber || "-",
        c.year || "-",
        c.status || "-",
        c.caseDate ? new Date(c.caseDate).toLocaleDateString("ar-EG") : "-"
      ]);
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      ws["!cols"] = headers.map(() => ({ wch: 20 }));
      XLSX.utils.book_append_sheet(wb, ws, "الدعاوى");
      XLSX.writeFile(wb, `report_cases_${dateStamp}.xlsx`);
    } else if (target === "clients") {
      headers = ["اسم الموكل","رقم التليفون","العنوان","تاريخ الإضافة"];
      rows = filteredClients.map(c => [
        c.name, 
        c.phone || "-", 
        c.address || "-", 
        c.createdAt ? new Date(c.createdAt).toLocaleDateString("ar-EG") : "-"
      ]);
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      ws["!cols"] = headers.map(() => ({ wch: 20 }));
      XLSX.utils.book_append_sheet(wb, ws, "الموكلين");
      XLSX.writeFile(wb, `report_clients_${dateStamp}.xlsx`);
    } else if (target === "sessions") {
      headers = ["اسم الموكل","رقم الدعوى","الحالة","تاريخ الجلسة"];
      rows = filteredCases.map(c => [
        typeof c.client === "string" ? c.client : (c.client?.name || "غير معروف"),
        c.caseNumber || "-",
        c.status || "-",
        c.sessiondate ? new Date(c.sessiondate).toLocaleDateString("ar-EG") : "-"
      ]);
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      ws["!cols"] = headers.map(() => ({ wch: 20 }));
      XLSX.utils.book_append_sheet(wb, ws, "الجلسات");
      XLSX.writeFile(wb, `report_sessions_${dateStamp}.xlsx`);
    } else if (target === "financial") {
      headers = ["اسم العميل", "عدد القضايا", "إجمالي الأتعاب", "المدفوع", "المتبقي", "الحالة"];
      rows = filteredFinancialClients.map(c => [
        c.clientName,
        c.cases.length,
        c.totalFees,
        c.totalPaid,
        c.totalRemaining,
        getStatusBadge(c.paymentStatus).text
      ]);
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      ws["!cols"] = headers.map(() => ({ wch: 20 }));
      XLSX.utils.book_append_sheet(wb, ws, "التقارير المالية");
      XLSX.writeFile(wb, `report_financial_${dateStamp}.xlsx`);
    }
  };

  const statusClass = (s?: string) => {
    if (!s) return "bg-gray-100 text-gray-800";
    const t = s.trim();
    if (t === "مفتوحة") return "bg-green-100 text-green-800";
    if (t === "مغلقة") return "bg-red-100 text-red-800";
    if (t === "مؤجلة") return "bg-yellow-100 text-yellow-800";
    if (t === "مشطوبة") return "bg-red-200 text-red-900";
    return "bg-gray-100 text-gray-800";
  };

  if (loading && tab === "financial") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-16 h-16 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">جاري تحميل التقارير...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold">لوحة التقارير</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            عرض وفلترة وتصدير تقارير الدعاوى، الجلسات، الموكلين، والتقارير المالية
          </p>
        </div>

        {/* toolbar */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center bg-white dark:bg-gray-800 rounded-full px-3 py-1 shadow-sm">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              placeholder={
                tab === "clients" ? "بحث باسم الموكل..." :
                tab === "financial" ? "بحث باسم العميل..." :
                "بحث برقم الدعوى أو اسم الموكل..."
              }
              className="bg-transparent outline-none px-3 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button 
            onClick={() => exportToExcel(tab)} 
            className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow"
          >
            <FileText className="w-4 h-4" /> تصدير
          </button>

          <button 
            onClick={resetFilters} 
            className="flex items-center gap-2 px-3 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg shadow"
          >
            <XCircle className="w-4 h-4" /> مسح الفلاتر
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 mb-6">
        <div className="flex gap-2 flex-wrap">
          {(["cases","sessions","clients","financial"] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl transition font-semibold ${
                tab === t 
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg" 
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              {t === "cases" ? "الدعاوى" : 
               t === "sessions" ? "الجلسات" : 
               t === "clients" ? "الموكلين" : "التقارير المالية"}
            </button>
          ))}
        </div>

        {/* filters row */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <div>
            <label className="text-xs text-gray-500">من</label>
            <input 
              type="date" 
              value={fromDate} 
              onChange={(e) => setFromDate(e.target.value)} 
              className="w-full px-3 py-2 rounded-md border bg-white dark:bg-gray-900 text-sm" 
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">إلى</label>
            <input 
              type="date" 
              value={toDate} 
              onChange={(e) => setToDate(e.target.value)} 
              className="w-full px-3 py-2 rounded-md border bg-white dark:bg-gray-900 text-sm" 
            />
          </div>

          {(tab === "cases" || tab === "sessions") && (
            <div>
              <label className="text-xs text-gray-500">الحالة</label>
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)} 
                className="w-full px-3 py-2 rounded-md border bg-white dark:bg-gray-900 text-sm"
              >
                <option value="">كل الحالات</option>
                <option value="مفتوحة">مفتوحة</option>
                <option value="مغلقة">مغلقة</option>
                <option value="مؤجلة">مؤجلة</option>
                <option value="مشطوبة">مشطوبة</option>
                <option value="مسئنفة">مسئنفة</option>
              </select>
            </div>
          )}

          {tab === "financial" && (
            <div>
              <label className="text-xs text-gray-500">حالة الدفع</label>
              <select 
                value={paymentStatusFilter} 
                onChange={(e) => setPaymentStatusFilter(e.target.value)} 
                className="w-full px-3 py-2 rounded-md border bg-white dark:bg-gray-900 text-sm"
              >
                <option value="all">جميع الحالات</option>
                <option value="paid">مدفوع بالكامل</option>
                <option value="partial">مدفوع جزئياً</option>
                <option value="unpaid">غير مدفوع</option>
              </select>
            </div>
          )}

          <div className="md:col-span-2">
            <div className="text-sm text-gray-500">
              النتائج: <span className="font-semibold">
                {tab === "clients" ? filteredClients.length : 
                 tab === "financial" ? filteredFinancialClients.length : 
                 filteredCases.length}
              </span>
            </div>
            <div className="text-xs text-gray-400">
              إجمالي: {tab === "clients" ? totalClients : tab === "financial" ? financialData.summary.totalClients : totalCases} — 
              جلسات الغد: {tomorrowSessionsCount}
            </div>
          </div>
        </div>
      </div>

      {/* Financial Stats - Only show in financial tab */}
      {tab === "financial" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-4 shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-green-700 dark:text-green-400">إجمالي الإيرادات</h3>
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold text-green-900 dark:text-green-300">
              {formatCurrency(financialData.summary.totalRevenue)}
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-blue-700 dark:text-blue-400">المبالغ المحصلة</h3>
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">
              {formatCurrency(financialData.summary.totalPaid)}
            </p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl p-4 shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-orange-700 dark:text-orange-400">المبالغ المتبقية</h3>
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold text-orange-900 dark:text-orange-300">
              {formatCurrency(financialData.summary.totalRemaining)}
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-4 shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-purple-700 dark:text-purple-400">إجمالي العملاء</h3>
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold text-purple-900 dark:text-purple-300">
              {financialData.summary.totalClients}
            </p>
            <div className="mt-1 text-xs text-purple-600 dark:text-purple-400">
              {financialData.summary.paidClients} مدفوع | {financialData.summary.partialClients} جزئي | {financialData.summary.unpaidClients} غير مدفوع
            </div>
          </div>
        </div>
      )}

      {/* content area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left big column: charts & table */}
        <div className="lg:col-span-2 space-y-6">
          {/* charts - only show for non-financial tabs */}
          {tab !== "financial" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold">توزيع الدعاوى</div>
                  <div className="text-xs text-gray-400">النوع (ابتدائي / استئناف / نقض)</div>
                </div>
                <div style={{ height: 260 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={distribution} dataKey="value" nameKey="name" outerRadius={80} label>
                        {distribution.map((entry, idx) => (
                          <Cell key={idx} fill={["#FF7A59","#6C5CE7","#24C1FF"][idx % 3]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold">القضايا بالشهور</div>
                  <div className="text-xs text-gray-400">نشاط آخر 12 شهر</div>
                </div>
                <div style={{ height: 260 }}>
                  <ResponsiveContainer>
                    <BarChart data={monthly}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#FF7A59" radius={[6,6,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="text-lg font-semibold">
                {tab === "cases" ? "قائمة الدعاوى" : 
                 tab === "sessions" ? "قائمة الجلسات" : 
                 tab === "clients" ? "قائمة الموكلين" : "التقارير المالية"}
              </div>
              <div className="text-sm text-gray-500">
                نتائج: <span className="font-semibold">
                  {tab === "clients" ? filteredClients.length : 
                   tab === "financial" ? filteredFinancialClients.length : 
                   filteredCases.length}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              {/* Cases table */}
              {tab === "cases" && (
                <table className="min-w-full text-sm table-auto text-center">
                  <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-200">
                    <tr>
                      <th className="px-3 py-2">الموكل</th>
                      <th className="px-3 py-2">نوع</th>
                      <th className="px-3 py-2">طبيعة</th>
                      <th className="px-3 py-2">رقم</th>
                      <th className="px-3 py-2">السنة</th>
                      <th className="px-3 py-2">تاريخ</th>
                      <th className="px-3 py-2">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCases.map(c => (
                      <tr key={c._id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700 text-center">
                        <td className="px-3 py-2">{ typeof c.client === "string" ? c.client : (c.client?.name || "-") }</td>
                        <td className="px-3 py-2">{c.caseTypeOF || "-"}</td>
                        <td className="px-3 py-2">{c.type || "-"}</td>
                        <td className="px-3 py-2">{c.caseNumber || "-"}</td>
                        <td className="px-3 py-2">{c.year || "-"}</td>
                        <td className="px-3 py-2">{c.caseDate ? new Date(c.caseDate).toLocaleDateString("ar-EG") : "-"}</td>
                        <td className="px-3 py-2"><span className={`${statusClass(c.status)} px-2 py-1 rounded text-xs`}>{c.status || "-"}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Sessions table */}
              {tab === "sessions" && (
                <table className="min-w-full text-sm table-auto">
                  <thead className="text-right bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-200">
                    <tr>
                      <th className="px-3 py-2">الموكل</th>
                      <th className="px-3 py-2">رقم الدعوى</th>
                      <th className="px-3 py-2">الحالة</th>
                      <th className="px-3 py-2">تاريخ الجلسة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCases.map(s => (
                      <tr key={s._id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-3 py-2">{ typeof s.client === "string" ? s.client : (s.client?.name || "-") }</td>
                        <td className="px-3 py-2">{s.caseNumber || "-"}</td>
                        <td className="px-3 py-2"><span className={`${statusClass(s.status)} px-2 py-1 rounded text-xs`}>{s.status || "-"}</span></td>
                        <td className="px-3 py-2">{s.sessiondate ? new Date(s.sessiondate).toLocaleDateString("ar-EG") : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Clients table */}
              {tab === "clients" && (
                <table className="min-w-full text-sm table-auto">
                  <thead className="text-right bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-200">
                    <tr>
                      <th className="px-3 py-2">الاسم</th>
                      <th className="px-3 py-2">الهاتف</th>
                      <th className="px-3 py-2">العنوان</th>
                      <th className="px-3 py-2">تاريخ الإضافة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClients.map(c => (
                      <tr key={c._id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-3 py-2">{c.name}</td>
                        <td className="px-3 py-2">{c.phone || "-"}</td>
                        <td className="px-3 py-2">{c.address || "-"}</td>
                        <td className="px-3 py-2">{c.createdAt ? new Date(c.createdAt).toLocaleDateString("ar-EG") : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Financial table */}
              {tab === "financial" && (
                <table className="min-w-full text-sm table-auto">
                  <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-right">العميل</th>
                      <th className="px-4 py-3 text-right">عدد القضايا</th>
                      <th className="px-4 py-3 text-right">إجمالي الأتعاب</th>
                      <th className="px-4 py-3 text-right">المدفوع</th>
                      <th className="px-4 py-3 text-right">المتبقي</th>
                      <th className="px-4 py-3 text-right">الحالة</th>
                      <th className="px-4 py-3 text-right">التفاصيل</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFinancialClients.map((client, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                              <span className="text-white font-bold">{client.clientName.charAt(0)}</span>
                            </div>
                            <div>
                              <div className="font-bold text-gray-900 dark:text-white">{client.clientName}</div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">{client.clientEmail}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">{client.cases.length}</td>
                        <td className="px-4 py-3 text-gray-900 dark:text-white font-bold">{formatCurrency(client.totalFees)}</td>
                        <td className="px-4 py-3 text-green-600 dark:text-green-400 font-bold">{formatCurrency(client.totalPaid)}</td>
                        <td className="px-4 py-3 text-orange-600 dark:text-orange-400 font-bold">{formatCurrency(client.totalRemaining)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full border ${getStatusBadge(client.paymentStatus).color}`}>
                            {getStatusBadge(client.paymentStatus).text}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <details className="cursor-pointer">
                            <summary className="text-blue-600 dark:text-blue-400 hover:underline font-medium">عرض القضايا</summary>
                            <div className="mt-3 space-y-2 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                              {client.cases.map((caseItem: any, idx: number) => (
                                <div key={idx} className="text-sm border-b border-gray-200 dark:border-gray-600 pb-2 last:border-0">
                                  <div className="font-bold text-gray-900 dark:text-white">{caseItem.caseTitle}</div>
                                  <div className="text-gray-600 dark:text-gray-400">رقم القضية: {caseItem.caseNumber}</div>
                                  <div className="flex justify-between mt-1">
                                    <span>الأتعاب: {formatCurrency(caseItem.fees)}</span>
                                    <span className="text-green-600">المدفوع: {formatCurrency(caseItem.paidAmount)}</span>
                                    <span className="text-orange-600">المتبقي: {formatCurrency(caseItem.remainingAmount)}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </details>
                        </td>
                      </tr>
                    ))}
                    {filteredFinancialClients.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center justify-center space-y-3">
                            <FileText className="w-16 h-16 text-gray-400" />
                            <p className="text-gray-500 dark:text-gray-400 font-medium">
                              لا توجد بيانات مالية للفترة المحددة
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Right column: small stats / quick actions */}
        <aside className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
            <div className="text-sm text-gray-500">إجمالي الدعاوى</div>
            <div className="text-2xl font-bold">{totalCases}</div>
            <div className="text-xs text-gray-400 mt-1">قضايا النظام كاملة</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
            <div className="text-sm text-gray-500">إجمالي الموكلين</div>
            <div className="text-2xl font-bold">{totalClients}</div>
            <div className="text-xs text-gray-400 mt-1">عدد الموكلين المسجلين</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">جلسات الغد</div>
                <div className="text-2xl font-bold">{tomorrowSessionsCount}</div>
              </div>
              <div className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
            <div className="text-xs text-gray-400 mt-1">مواعيد الغد المقررة</div>
          </div>

          {tab === "financial" && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">نسبة التحصيل</div>
                  <div className="text-2xl font-bold">
                    {financialData.summary.totalRevenue > 0 
                      ? Math.round((financialData.summary.totalPaid / financialData.summary.totalRevenue) * 100)
                      : 0}%
                  </div>
                </div>
                <div className="p-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <div className="text-xs text-gray-400 mt-1">من إجمالي الإيرادات</div>
            </div>
          )}
        </aside>
      </div>

      {/* error */}
      {error && (
        <div className="fixed bottom-6 left-6 bg-red-600 text-white px-4 py-2 rounded shadow">
          {error}
        </div>
      )}
    </motion.div>
  );
}