"use client";

import React, { useState, useEffect } from "react";

interface Client {
  _id: string;
  name: string;
}

interface Case {
  _id: string;
  client: { name: string };
  caseTypeOF: string;
  type: string;
  court: string;
  caseNumber: string;
  year: string;
  status: string;
  sessiondate: string;
}

type ReportType = "cases" | "clients" | "sessions";

const ReportsPage = () => {
  const [reportType, setReportType] = useState<ReportType>("cases");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // فقط للدعاوى
  const [searchTerm, setSearchTerm] = useState("");

  const [cases, setCases] = useState<Case[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  // جلب البيانات حسب النوع
  useEffect(() => {
    const fetchData = async () => {
      if (reportType === "cases") {
        const res = await fetch("/api/cases");
        const data = await res.json();
        if (data.success) setCases(data.data);
      } else if (reportType === "clients") {
        const res = await fetch("/api/clients");
        const data = await res.json();
        if (data.success) setClients(data.data);
      }
    };
    fetchData();
  }, [reportType]);

  // فلترة البيانات حسب التاريخ + حالة الدعوى + البحث
  const filteredCases = cases.filter((c) => {
    const sessionDate = new Date(c.sessiondate);
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;

    if (from && sessionDate < from) return false;
    if (to && sessionDate > to) return false;
    if (statusFilter && c.status !== statusFilter) return false;
    if (searchTerm && !c.caseNumber.includes(searchTerm)) return false;

    return true;
  });

  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">التقارير</h1>

      {/* اختيار نوع التقرير */}
      <div className="mb-4 flex gap-2">
        <select
          value={reportType}
          onChange={(e) => setReportType(e.target.value as ReportType)}
          className="border p-1"
        >
          <option value="cases">التقارير عن الدعاوى</option>
          <option value="clients">التقارير عن الموكلين</option>
          <option value="sessions">التقارير عن الجلسات</option>
        </select>

        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="border p-1"
        />
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="border p-1"
        />

        {/* فلتر حالة الدعوى يظهر فقط لو نوع التقرير دعاوى */}
        {reportType === "cases" && (
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border p-1"
          >
            <option value="">كل الحالات</option>
            <option value="مفتوحة">مفتوحة</option>
            <option value="مغلقة">مغلقة</option>
            <option value="قيد الانتظار">قيد الانتظار</option>
          </select>
        )}

        {/* البحث */}
        <input
          type="text"
          placeholder={
            reportType === "cases" ? "بحث برقم الدعوى" : "بحث باسم الموكل"
          }
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border p-1 flex-1"
        />
      </div>

      {/* عرض النتائج */}
      {reportType === "cases" && (
        <table className="w-full table-auto border border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-2 py-1">اسم الموكل</th>
              <th className="border px-2 py-1">نوع الدعوى</th>
              <th className="border px-2 py-1">طبيعة الدعوى</th>
              <th className="border px-2 py-1">المحكمة</th>
              <th className="border px-2 py-1">رقم الدعوى</th>
              <th className="border px-2 py-1">السنة</th>
              <th className="border px-2 py-1">الحالة</th>
              <th className="border px-2 py-1">تاريخ الجلسة</th>
            </tr>
          </thead>
          <tbody>
            {filteredCases.map((c) => (
              <tr key={c._id}>
                <td className="border px-2 py-1">{c.client.name}</td>
                <td className="border px-2 py-1">{c.caseTypeOF}</td>
                <td className="border px-2 py-1">{c.type}</td>
                <td className="border px-2 py-1">{c.court}</td>
                <td className="border px-2 py-1">{c.caseNumber}</td>
                <td className="border px-2 py-1">{c.year}</td>
                <td className="border px-2 py-1">{c.status}</td>
                <td className="border px-2 py-1">
                  {new Date(c.sessiondate).toLocaleDateString("ar-EG")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {reportType === "clients" && (
        <table className="w-full table-auto border border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-2 py-1">اسم الموكل</th>
              <th className="border px-2 py-1">ID</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.map((c) => (
              <tr key={c._id}>
                <td className="border px-2 py-1">{c.name}</td>
                <td className="border px-2 py-1">{c._id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {reportType === "sessions" && (
        <p className="text-gray-600">سيتم إضافة تقارير الجلسات لاحقًا.</p>
      )}
    </div>
  );
};

export default ReportsPage;
