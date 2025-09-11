/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";

const SpinnerIcon = () => (
  <svg
    className="animate-spin h-5 w-5 text-gray-500 dark:text-gray-400"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

// Define data types
interface Client {
  _id: string;
  name: string;
  phone?: string;
  address?: string;
  createdAt: any;
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
  caseDate: string;
}

type ReportType = "cases" | "clients" | "sessions";

const ReportsPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reportType, setReportType] = useState<ReportType>("cases");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [allCases, setAllCases] = useState<Case[]>([]);
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);

  const componentRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Function to handle printing
  const handlePrint = () => {
    window.print();
  };

  // Function to export to Excel
  const exportToExcel = () => {
    let data: any[] = [];
    let headers: string[] = [];
    let filename = "";

    if (reportType === "cases") {
      headers = [
        "اسم الموكل",
        "نوع الدعوى",
        "طبيعة الدعوى",
        "المحكمة",
        "رقم الدعوى",
        "السنة",
        "الحالة",
        "تاريخ الدعوى",
      ];
      data = filteredCases.map((c) => [
        c.client.name,
        c.caseTypeOF,
        c.type,
        c.court,
        c.caseNumber,
        c.year,
        c.status,
        new Date(c.caseDate).toLocaleDateString("ar-EG"),
      ]);
      filename = "تقرير_الدعاوى";
    } else if (reportType === "clients") {
      headers = ["اسم الموكل", "رقم التليفون", "العنوان", "تاريخ الإضافة"];
      data = filteredClients.map((c) => [
        c.name,
        c.phone || "غير محدد",
        c.address || "غير محدد",
        new Date(c.createdAt).toLocaleDateString("ar-EG"),
      ]);
      filename = "تقرير_الموكلين";
    } else if (reportType === "sessions") {
      headers = ["اسم الموكل", "رقم الدعوى", "الحالة", "تاريخ الجلسة"];
      data = filteredCases.map((s) => [
        s.client.name,
        s.caseNumber,
        s.status,
        new Date(s.sessiondate).toLocaleDateString("ar-EG"),
      ]);
      filename = "تقرير_الجلسات";
    }

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);

    // Set column widths for better Arabic text display
    const colWidths = headers.map(() => ({ wch: 20 }));
    ws["!cols"] = colWidths;

    // Add the worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "التقرير");

    // Generate Excel file and download
    const currentDate = new Date()
      .toLocaleDateString("ar-EG")
      .replace(/\//g, "-");
    XLSX.writeFile(wb, `${filename}_${currentDate}.xlsx`);
  };

  // Function to download template
  const downloadTemplate = () => {
    let headers: string[] = [];
    let sampleData: any[] = [];
    let filename = "";

    if (reportType === "clients") {
      headers = ["اسم الموكل", "رقم التليفون", "العنوان"];
      sampleData = [
        ["أحمد محمد", "01234567890", "القاهرة"],
        ["فاطمة علي", "01987654321", "الجيزة"],
      ];
      filename = "قالب_استيراد_الموكلين";
    } else if (reportType === "cases") {
      headers = [
        "اسم الموكل",
        "نوع الدعوى",
        "طبيعة الدعوى",
        "المحكمة",
        "رقم الدعوى",
        "السنة",
        "الحالة",
      ];
      sampleData = [
        ["أحمد محمد", "مدني", "دين", "محكمة القاهرة", "123", "2024", "مفتوحة"],
        ["فاطمة علي", "جنائي", "سرقة", "محكمة الجيزة", "124", "2024", "مؤجلة"],
      ];
      filename = "قالب_استيراد_الدعاوى";
    }

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);

    // Set column widths
    const colWidths = headers.map(() => ({ wch: 20 }));
    ws["!cols"] = colWidths;

    // Add the worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "القالب");

    // Generate Excel file and download
    XLSX.writeFile(wb, `${filename}.xlsx`);
  };

  // Function to handle file import
  // const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   if (e.target.files && e.target.files[0]) {
  //     setImportFile(e.target.files[0]);
  //   }
  // };

  // Function to process imported Excel file
  // const processImportedFile = async () => {
  //   if (!importFile) return;

  //   try {
  //     const data = await importFile.arrayBuffer();
  //     const workbook = XLSX.read(data);
  //     const sheetName = workbook.SheetNames[0];
  //     const worksheet = workbook.Sheets[sheetName];
  //     const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  //     // Skip header row
  //     const rows = jsonData.slice(1) as any[][];

  //     if (reportType === "clients") {
  //       // Process client data
  //       const clientsToImport = rows
  //         .filter((row) => row[0]) // Filter out empty rows
  //         .map((row, index) => ({
  //           name: row[0] || `موكل ${index + 1}`,
  //           phone: row[1] || "",
  //           address: row[2] || "",
  //           owner: "PLACEHOLDER_LAWYER_ID", // Replace with actual lawyer ID from session/auth

  //           createdAt: new Date().toISOString(),
  //         }));

  //       // Here you would typically send this data to your API
  //       for (const client of clientsToImport) {
  //         await fetch("/api/clients", {
  //           method: "POST",
  //           headers: {
  //             "Content-Type": "application/json",
  //           },
  //           body: JSON.stringify(client),
  //         });
  //         console.log("Clients to import:", clientsToImport);
  //       }
  //       alert(
  //         `تم تحضير ${clientsToImport.length} موكل للاستيراد. يرجى ربط هذه الوظيفة بـ API الخاص بك.`
  //       );
  //     } else if (reportType === "cases") {
  //       // Process case data
  //       const casesToImport = rows
  //         .filter((row) => row[0]) // Filter out empty rows
  //         .map((row, index) => ({
  //           client: { name: row[0] || `موكل ${index + 1}` },
  //           caseTypeOF: row[1] || "",
  //           type: row[2] || "",
  //           court: row[3] || "",
  //           caseNumber: row[4] || `${Date.now()}-${index + 1}`,
  //           year: row[5] || new Date().getFullYear().toString(),
  //           status: row[6] || "مفتوحة",
  //           caseDate: new Date().toISOString(),
  //           sessiondate: new Date().toISOString(),
  //         }));

  //       console.log("Cases to import:", casesToImport);
  //       alert(
  //         `تم تحضير ${casesToImport.length} دعوى للاستيراد. يرجى ربط هذه الوظيفة بـ API الخاص بك.`
  //       );
  //     }

  //     // Reset file input
  //     setImportFile(null);
  //     if (fileInputRef.current) {
  //       fileInputRef.current.value = "";
  //     }
  //   } catch (error) {
  //     console.error("Error importing file:", error);
  //     alert("حدث خطأ أثناء استيراد الملف. يرجى التأكد من صحة تنسيق الملف.");
  //   }
  // };

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const casesRes = await fetch("/api/cases");
      const casesData = await casesRes.json();
      if (casesData.success) {
        const casesWithCaseDate = casesData.data.map((c: any) => ({
          ...c,
          caseDate: c.caseDate || c.sessiondate, // Use caseDate if available, otherwise sessiondate
        }));
        setAllCases(casesWithCaseDate);
      } else {
        setError(casesData.message || "فشل في جلب بيانات القضايا.");
      }

      const clientsRes = await fetch("/api/clients");
      const clientsData = await clientsRes.json();
      if (clientsData.success) {
        setAllClients(clientsData.data);
      } else {
        setError(clientsData.message || "فشل في جلب بيانات الموكلين.");
      }
      setIsDataLoaded(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    if (status === "unauthenticated") {
      router.replace("/auth/login");
    }
  }, []);

  const filteredCases = allCases.filter((c) => {
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;

    // Filter based on report type
    if (reportType === "sessions") {
      const sessionDate = new Date(c.sessiondate);
      if (from && sessionDate < from) return false;
      if (to && sessionDate > to) return false;
    } else if (reportType === "cases") {
      const caseDate = new Date(c.caseDate);
      if (from && caseDate < from) return false;
      if (to && caseDate > to) return false;
    }

    // Filter by status
    if (statusFilter && c.status.trim() !== statusFilter.trim()) return false;

    // Filter by search term
    if (
      searchTerm &&
      !c.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !c.client.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
      return false;

    return true;
  });

  const filteredClients = allClients.filter((c) => {
    // Date filtering for clients
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;
    const clientDate = new Date(c.createdAt);

    if (from && clientDate < from) return false;
    if (to && clientDate > to) return false;

    // Search term filtering
    if (searchTerm && !c.name.toLowerCase().includes(searchTerm.toLowerCase()))
      return false;

    return true;
  });

  const getRowColor = (status: string) => {
    switch (status.trim()) {
      case "مفتوحة":
        return "bg-green-100 dark:bg-green-800 dark:text-green-50";
      case "مغلقة":
        return "bg-red-100 dark:bg-red-800 dark:text-red-50";
      case "مؤجلة":
        return "bg-yellow-100 dark:bg-yellow-800 dark:text-yellow-50";
      case "مشطوبة":
        return "bg-red-200 dark:bg-red-900 dark:text-red-100";
      case "مسئنفة":
        return "bg-blue-200 dark:bg-blue-900 dark:text-blue-100";
      default:
        return "bg-white dark:bg-gray-700";
    }
  };

  const sessions = filteredCases;

  const clearFilters = () => {
    setFromDate("");
    setToDate("");
    setStatusFilter("");
    setSearchTerm("");
  };
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <SpinnerIcon />
        <span className="mr-2 text-gray-500 dark:text-gray-400">
          جاري التحقق...
        </span>
      </div>
    );
  }
  if (status === "authenticated") {
    return (
      <div
        className="bg-gray-50 min-h-screen flex items-center justify-center p-6 transition-colors duration-300 dark:bg-gray-900 text-gray-800 dark:text-gray-200"
        dir="rtl"
      >
        <style jsx>{`
          @media print {
            body {
              margin: 0;
              padding: 0;
              font-family: "Cairo", Arial, sans-serif;
              background: #fff;
              color: #000;
              line-height: 1.6;
            }

            .no-print {
              display: none !important;
            }

            .print-container {
              width: 100%;
              margin: 0 auto;
              padding: 20px;
              background: #fff;
            }

            /* العناوين */
            .print-container h1 {
              text-align: center;
              font-size: 22px;
              margin-bottom: 10px;
              color: #222;
            }

            .print-container h2 {
              text-align: center;
              font-size: 18px;
              margin-bottom: 20px;
              color: #444;
            }

            /* الجداول */
            .print-container table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
              font-size: 13px;
            }

            .print-container th,
            .print-container td {
              border: 1px solid #aaa;
              padding: 10px;
              text-align: right;
            }

            .print-container thead th {
              background: #f4f4f4;
              color: #111;
              font-weight: bold;
              text-align: center;
            }

            .print-container tbody tr:nth-child(even) {
              background: #fafafa;
            }

            .print-container tbody tr:nth-child(odd) {
              background: #fff;
            }

            /* إزالة تأثيرات Tailwind أثناء الطباعة */
            .print-container tr[class*="bg-"] {
              background: #fff !important;
              color: #000 !important;
            }
          }
        `}</style>

        <div
          className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 w-full max-w-6xl relative print-container"
          ref={componentRef}
        >
          <h1 className="text-4xl font-extrabold text-gray-800 dark:text-gray-100 text-center mb-8 no-print">
            لوحة تقارير القضايا والموكلين
          </h1>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 text-center mb-4">
            تقرير{" "}
            {reportType === "cases"
              ? "الدعاوى"
              : reportType === "sessions"
              ? "الجلسات"
              : "الموكلين"}
          </h2>

          <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded-2xl mb-8 border border-gray-200 dark:border-gray-600 no-print">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
              <div className="col-span-1">
                <label
                  htmlFor="reportType"
                  className="block text-gray-700 dark:text-gray-300 font-semibold mb-1"
                >
                  نوع التقرير
                </label>
                <select
                  id="reportType"
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as ReportType)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
                >
                  <option value="cases">تقارير الدعاوى</option>
                  <option value="sessions">تقارير الجلسات</option>
                  <option value="clients">تقارير الموكلين</option>
                </select>
              </div>

              <div className="col-span-1">
                <label
                  htmlFor="fromDate"
                  className="block text-gray-700 dark:text-gray-300 font-semibold mb-1"
                >
                  {reportType === "cases"
                    ? "من تاريخ الدعوى"
                    : reportType === "sessions"
                    ? "من تاريخ الجلسة"
                    : "من تاريخ الإضافة"}
                </label>
                <input
                  type="date"
                  id="fromDate"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
                />
              </div>

              <div className="col-span-1">
                <label
                  htmlFor="toDate"
                  className="block text-gray-700 dark:text-gray-300 font-semibold mb-1"
                >
                  {reportType === "cases"
                    ? "إلى تاريخ الدعوى"
                    : reportType === "sessions"
                    ? "إلى تاريخ الجلسة"
                    : "إلى تاريخ الإضافة"}
                </label>
                <input
                  type="date"
                  id="toDate"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
                />
              </div>

              {reportType !== "clients" && (
                <div className="col-span-1">
                  <label
                    htmlFor="statusFilter"
                    className="block text-gray-700 dark:text-gray-300 font-semibold mb-1"
                  >
                    حالة الدعوى
                  </label>
                  <select
                    id="statusFilter"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
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

              <div className="col-span-1">
                <label
                  htmlFor="searchTerm"
                  className="block text-gray-700 dark:text-gray-300 font-semibold mb-1"
                >
                  بحث
                </label>
                <input
                  type="text"
                  id="searchTerm"
                  placeholder={
                    reportType === "clients"
                      ? "بحث باسم الموكل"
                      : "بحث برقم الدعوى أو اسم الموكل"
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
                />
              </div>
            </div>

            <div className="mt-4 text-center">
              <button
                onClick={clearFilters}
                className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 focus:outline-none focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-800"
              >
                مسح الفلاتر
              </button>
            </div>
          </div>

          <div className="no-print mb-6">
            <div className="flex gap-4 justify-center flex-wrap items-center">
              <button
                onClick={handlePrint}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-full transition-colors duration-300 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 shadow-lg"
              >
                طباعة التقرير
              </button>

              <button
                onClick={exportToExcel}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-full transition-colors duration-300 focus:outline-none focus:ring-4 focus:ring-green-300 dark:focus:ring-green-800 shadow-lg"
              >
                تصدير إلى Excel
              </button>

              {/* {(reportType === "clients" || reportType === "cases") && (
                <>
                  <button
                    onClick={downloadTemplate}
                    className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-full transition-colors duration-300 focus:outline-none focus:ring-4 focus:ring-purple-300 dark:focus:ring-purple-800 shadow-lg"
                  >
                    تحميل القالب
                  </button> 
     
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileImport}
                      className="hidden"
                      id="fileImport"
                    />
                    <label
                      htmlFor="fileImport"
                      className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-full transition-colors duration-300 focus:outline-none focus:ring-4 focus:ring-orange-300 dark:focus:ring-orange-800 shadow-lg cursor-pointer"
                    >
                      اختيار ملف Excel
                    </label>
                    
                    {importFile && (
                      <button
                        onClick={processImportedFile}
                        className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-full transition-colors duration-300 focus:outline-none focus:ring-4 focus:ring-red-300 dark:focus:ring-red-800 shadow-lg"
                      >
                        استيراد البيانات
                      </button>
                    )}
                  </div> 
                </>
              )} */}

              <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                {reportType === "cases" && (
                  <span>عدد النتائج: {filteredCases.length}</span>
                )}
                {reportType === "clients" && (
                  <span>عدد النتائج: {filteredClients.length}</span>
                )}
                {reportType === "sessions" && (
                  <span>عدد النتائج: {sessions.length}</span>
                )}
              </div>
            </div>

            {importFile && (
              <div className="mt-4 p-4 bg-yellow-100 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700 rounded-lg text-center">
                <p className="text-yellow-800 dark:text-yellow-200">
                  تم اختيار الملف: <strong>{importFile.name}</strong>
                </p>
                <p className="text-sm text-yellow-600 dark:text-yellow-300 mt-1">
                  انقر على "استيراد البيانات" لبدء عملية الاستيراد
                </p>
              </div>
            )}
          </div>

          {isLoading && (
            <div className="text-center p-8">
              <SpinnerIcon />
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                جاري تحميل البيانات...
              </p>
            </div>
          )}

          {error && (
            <div
              className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg relative text-center mb-6"
              role="alert"
            >
              {error}
            </div>
          )}

          {!isDataLoaded && !isLoading && !error && (
            <div className="text-center text-gray-500 dark:text-gray-400 p-8 border-dashed border-2 rounded-lg border-gray-300 dark:border-gray-600">
              <p>يرجى الانتظار، يتم جلب البيانات...</p>
            </div>
          )}

          {/* No results message */}
          {isDataLoaded && !isLoading && (
            <>
              {reportType === "cases" && filteredCases.length === 0 && (
                <div className="text-center text-gray-500 dark:text-gray-400 p-8 border-dashed border-2 rounded-lg border-gray-300 dark:border-gray-600">
                  <p>لا توجد دعاوى تطابق معايير البحث المحددة</p>
                </div>
              )}
              {reportType === "clients" && filteredClients.length === 0 && (
                <div className="text-center text-gray-500 dark:text-gray-400 p-8 border-dashed border-2 rounded-lg border-gray-300 dark:border-gray-600">
                  <p>لا يوجد موكلين يطابقون معايير البحث المحددة</p>
                </div>
              )}
              {reportType === "sessions" && sessions.length === 0 && (
                <div className="text-center text-gray-500 dark:text-gray-400 p-8 border-dashed border-2 rounded-lg border-gray-300 dark:border-gray-600">
                  <p>لا توجد جلسات تطابق معايير البحث المحددة</p>
                </div>
              )}
            </>
          )}

          <div className="overflow-x-auto rounded-xl shadow-lg">
            {reportType === "cases" && filteredCases.length > 0 && (
              <table className="min-w-full table-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600">
                <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-right text-sm">
                  <tr>
                    <th className="px-4 py-3 border-b-2 border-gray-200 dark:border-gray-600">
                      اسم الموكل
                    </th>
                    <th className="px-4 py-3 border-b-2 border-gray-200 dark:border-gray-600">
                      نوع الدعوى
                    </th>
                    <th className="px-4 py-3 border-b-2 border-gray-200 dark:border-gray-600">
                      طبيعة الدعوى
                    </th>
                    <th className="px-4 py-3 border-b-2 border-gray-200 dark:border-gray-600">
                      المحكمة
                    </th>
                    <th className="px-4 py-3 border-b-2 border-gray-200 dark:border-gray-600">
                      رقم الدعوى
                    </th>
                    <th className="px-4 py-3 border-b-2 border-gray-200 dark:border-gray-600">
                      السنة
                    </th>
                    <th className="px-4 py-3 border-b-2 border-gray-200 dark:border-gray-600">
                      الحالة
                    </th>
                    <th className="px-4 py-3 border-b-2 border-gray-200 dark:border-gray-600">
                      تاريخ الدعوى
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCases.map((c) => (
                    <tr
                      key={c._id}
                      className={`${getRowColor(
                        c.status
                      )} hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors`}
                    >
                      <td className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        {c.client.name}
                      </td>
                      <td className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        {c.caseTypeOF}
                      </td>
                      <td className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        {c.type}
                      </td>
                      <td className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        {c.court}
                      </td>
                      <td className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        {c.caseNumber}
                      </td>
                      <td className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        {c.year}
                      </td>
                      <td className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        {c.status}
                      </td>
                      <td className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        {new Date(c.caseDate).toLocaleDateString("ar-EG")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportType === "clients" && filteredClients.length > 0 && (
              <table className="min-w-full table-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600">
                <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-right text-sm">
                  <tr>
                    <th className="px-4 py-3 border-b-2 border-gray-200 dark:border-gray-600">
                      اسم الموكل
                    </th>
                    <th className="px-4 py-3 border-b-2 border-gray-200 dark:border-gray-600">
                      رقم التليفون
                    </th>
                    <th className="px-4 py-3 border-b-2 border-gray-200 dark:border-gray-600">
                      العنوان
                    </th>
                    <th className="px-4 py-3 border-b-2 border-gray-200 dark:border-gray-600">
                      تاريخ الإضافة
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((c) => (
                    <tr
                      key={c._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <td className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        {c.name}
                      </td>
                      <td className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 text-sm">
                        {c.phone || "غير محدد"}
                      </td>
                      <td className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 text-sm">
                        {c.address || "غير محدد"}
                      </td>
                      <td className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 text-sm">
                        {new Date(c.createdAt).toLocaleDateString("ar-EG")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportType === "sessions" && sessions.length > 0 && (
              <table className="min-w-full table-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600">
                <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-right text-sm">
                  <tr>
                    <th className="px-4 py-3 border-b-2 border-gray-200 dark:border-gray-600">
                      اسم الموكل
                    </th>
                    <th className="px-4 py-3 border-b-2 border-gray-200 dark:border-gray-600">
                      رقم الدعوى
                    </th>
                    <th className="px-4 py-3 border-b-2 border-gray-200 dark:border-gray-600">
                      الحالة
                    </th>
                    <th className="px-4 py-3 border-b-2 border-gray-200 dark:border-gray-600">
                      تاريخ الجلسة
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => (
                    <tr
                      key={s._id}
                      className={`${getRowColor(
                        s.status
                      )} hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`}
                    >
                      <td className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        {s.client.name}
                      </td>
                      <td className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        {s.caseNumber}
                      </td>
                      <td className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        {s.status}
                      </td>
                      <td className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        {new Date(s.sessiondate).toLocaleDateString("ar-EG")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    );
  }
};

export default ReportsPage;
