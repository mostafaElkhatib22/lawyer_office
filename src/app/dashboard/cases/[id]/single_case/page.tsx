/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import axios from "axios";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ArrowLeft,
  User,
  FolderOpen,
  Calendar,
  Gavel,
  FileText,
  Megaphone,
  Info,
  Edit,
  Trash2,
  Printer,
  X,
  Check,
  Loader2,
  Download,
  Clock,
  Building,
  Scale,
  FileCheck,
  Briefcase,
  ChevronDown,
  File,
  ChevronRight,
  Share2,
  Star,
  Eye,
  AlertTriangle,
} from "lucide-react";

// Components from your UI library (shadcn/ui)
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Alert, AlertDescription } from "@/components/ui/alert";

const API_BASE_URL = "/api";

interface CaseDetails {
  _id: string;
  client: { _id: string; name: string } | null;
  caseTypeOF: string;
  type: string;
  nameOfCase:string;
  court: string;
  caseNumber: string;
  year: string;
  status:string;
  attorneyNumber: string;
  decision: string;
  nots: string;
  caseDate: string;
  sessiondate: string;
  opponents: string[];
  files: string[];
  createdAt: string;
  updatedAt: string;
}

const ActivityIndicator = ({ size = "medium", color = "text-blue-500" }: {
  size?: "small" | "medium" | "large";
  color?: string;
}) => {
  const sizeClasses = {
    small: "h-4 w-4",
    medium: "h-8 w-8",
    large: "h-12 w-12",
  };
  return (
    <Loader2 className={`animate-spin ${sizeClasses[size]} ${color}`} />
  );
};

interface ConfirmationModalProps {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  message,
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in-0 duration-500">
      <Card className="max-w-md w-full bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-0 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
            <AlertTriangle className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-red-600 dark:text-red-400 text-2xl font-bold">
            تأكيد الحذف
          </CardTitle>
          <CardDescription className="text-center text-gray-600 dark:text-gray-300 mt-2 leading-relaxed text-base">
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center gap-4 pt-0">
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white flex items-center gap-2 px-8 py-3 font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="text-white" />
            ) : (
              <Check className="h-5 w-5" />
            )}
            نعم، احذف
          </Button>
          <Button
            onClick={onCancel}
            disabled={isLoading}
            variant="outline"
            className="flex items-center gap-2 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 px-8 py-3 font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <X className="h-5 w-5" />
            إلغاء
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

const DetailItem = ({ icon, label, value, gradient = "from-blue-500 to-purple-600" }: {
  icon: React.ReactNode;
  label: string;
  value: string | undefined;
  gradient?: string;
}) => (
  <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 transition-all duration-300 hover:shadow-xl hover:scale-105">
    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
    <div className="relative p-6">
      <div className="flex items-center gap-4">
        <div className={`flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}>
          <div className="text-white">
            {icon}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</h3>
          <p className="mt-2 text-lg font-bold text-gray-900 dark:text-gray-100 break-words leading-tight">{value || "غير محدد"}</p>
        </div>
      </div>
    </div>
  </div>
);

const AnimatedCard = ({ children, delay = 0, className = "" }: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) => (
  <div 
    className={`animate-in slide-in-from-bottom-6 fade-in-0 duration-700 ${className}`}
    style={{ animationDelay: `${delay}ms` }}
  >
    {children}
  </div>
);

export default function CaseDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const caseId = params.id as string;

  const [caseDetails, setCaseDetails] = useState<CaseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [caseToDelete, setCaseToDelete] = useState<CaseDetails | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCaseDetails = useCallback(async () => {
    if (status === "loading" || !caseId) return;

    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${API_BASE_URL}/cases/${caseId}`, {
        headers: {
          Authorization: `Bearer ${session?.user?.id}`,
          "Content-Type": "application/json",
        },
      });

      if (response.data.success) {
        setCaseDetails(response.data.data);
      } else {
        setError(response.data.message || "فشل في جلب تفاصيل الدعوى.");
        toast.error(response.data.message || "فشل في جلب تفاصيل الدعوى.");
      }
    } catch (err: any) {
      console.error("Error fetching case details:", err);
      setError(
        `فشل في جلب تفاصيل الدعوى: ${
          err.response?.data?.message || err.message || "خطأ غير معروف"
        }.`
      );
      toast.error(
        `فشل في جلب تفاصيل الدعوى: ${
          err.response?.data?.message || err.message || "خطأ غير معروف"
        }.`
      );
    } finally {
      setLoading(false);
    }
  }, [caseId, session, status, router]);

  useEffect(() => {
    if (caseId) {
      fetchCaseDetails();
    }
  }, [fetchCaseDetails, caseId]);

  const formatDate = useCallback((dateString: string | undefined) => {
    if (!dateString) return "غير محدد";
    try {
      return new Date(dateString).toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "تاريخ غير صحيح";
    }
  }, []);

  const showMessage = useCallback((message: string, type: "success" | "error" | "warning") => {
    if (type === "success") {
      toast.success(message);
    } else if (type === "error") {
      toast.error(message);
    } else if (type === "warning") {
      toast.warning(message);
    }
  }, []);

  const openDeleteModal = useCallback((caseItem: CaseDetails) => {
    setCaseToDelete(caseItem);
    setIsDeleteModalOpen(true);
  }, []);

  const closeDeleteModal = useCallback(() => {
    setIsDeleteModalOpen(false);
    setCaseToDelete(null);
  }, []);

  const extractPublicId = useCallback((fileUrl: string): string | null => {
    if (!fileUrl) return "";
    try {
      const parts = fileUrl.split("/");
      const uploadIndex = parts.indexOf("upload");
      if (uploadIndex === -1 || uploadIndex + 1 >= parts.length) {
        return "";
      }
      let publicIdWithVersion = parts.slice(uploadIndex + 1).join("/");
      const publicIdParts = publicIdWithVersion.split("/");
      if (
        publicIdParts[0] &&
        publicIdParts[0].startsWith("v") &&
        publicIdParts[0].length >= 11 &&
        !isNaN(parseInt(publicIdParts[0].substring(1)))
      ) {
        publicIdParts.shift();
        publicIdWithVersion = publicIdParts.filter(Boolean).join("/");
      }
      const lastDotIndex = publicIdWithVersion.lastIndexOf(".");
      return lastDotIndex > -1
        ? publicIdWithVersion.substring(0, lastDotIndex)
        : publicIdWithVersion;
    } catch (error) {
      console.error(
        "Error extracting public ID from URL in frontend:",
        error,
        "from URL:",
        fileUrl
      );
      return null;
    }
  }, []);

  const deleteFileFromCloudinary = useCallback(
    async (publicId: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const response = await fetch(`${API_BASE_URL}/images`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.user?.id}`,
          },
          body: JSON.stringify({ publicId }),
        });
        if (response.ok) {
          return { success: true };
        }
        if (response.status === 404) {
          console.warn(`File with publicId ${publicId} not found on Cloudinary (404). Assuming deleted.`);
          return { success: true };
        }
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: `خطأ HTTP ${response.status}` };
        }
        const errorMessage =
          errorData.message || `فشل حذف الملف (Status: ${response.status})`;
        return { success: false, error: errorMessage };
      } catch (error) {
        console.error(`خطأ في الاتصال أثناء حذف الملف ${publicId}:`, error);
        return { success: false, error: "خطأ في الاتصال" };
      }
    },
    [session]
  );

  const deleteFilesFromCloudinary = useCallback(
    async (
      fileUrls: string[]
    ): Promise<{
      successCount: number;
      failureCount: number;
      errors: string[];
    }> => {
      const publicIds = fileUrls
        .map((url) => extractPublicId(url))
        .filter((id): id is string => id !== null && id !== "");
      if (publicIds.length === 0) {
        return { successCount: 0, failureCount: 0, errors: [] };
      }
      console.log("محاولة حذف الملفات:", publicIds);
      let successCount = 0;
      let failureCount = 0;
      const errors: string[] = [];
      for (const publicId of publicIds) {
        const result = await deleteFileFromCloudinary(publicId);
        if (result.success) {
          successCount++;
          console.log(`تم حذف الملف ${publicId} بنجاح`);
        } else {
          failureCount++;
          errors.push(`${publicId}: ${result.error}`);
          console.error(`فشل حذف الملف ${publicId}:`, result.error);
        }
      }
      return { successCount, failureCount, errors };
    },
    [deleteFileFromCloudinary, extractPublicId]
  );

  const confirmDelete = useCallback(async () => {
    if (!caseToDelete) {
      showMessage("خطأ: لا توجد دعوى محددة للحذف.", "error");
      closeDeleteModal();
      return;
    }
    if (!session?.user?.id) {
      showMessage("خطأ: يجب أن تكون مسجلاً للدخول لتنفيذ هذه العملية.", "error");
      closeDeleteModal();
      return;
    }
    setIsDeleting(true);
    try {
      const fileUrls = caseToDelete.files || [];
      const filesResult = await deleteFilesFromCloudinary(fileUrls);
      if (filesResult.successCount > 0 || filesResult.failureCount > 0) {
        if (filesResult.failureCount === 0) {
          showMessage(
            `تم حذف جميع الملفات (${filesResult.successCount}) بنجاح من Cloudinary.`,
            "success"
          );
        } else if (filesResult.successCount === 0) {
          showMessage(
            `فشل حذف جميع الملفات (${filesResult.failureCount}) من Cloudinary.`,
            "error"
          );
          console.error("أخطاء حذف الملفات:", filesResult.errors);
        } else {
          showMessage(
            `تم حذف ${filesResult.successCount} ملف بنجاح، فشل حذف ${filesResult.failureCount} ملف.`,
            "warning"
          );
          console.error("أخطاء حذف بعض الملفات:", filesResult.errors);
        }
      } else {
        showMessage("لا توجد ملفات مرتبطة بالدعوى للحذف من Cloudinary.", "warning");
      }
      const response = await fetch(
        `${API_BASE_URL}/cases/${caseToDelete._id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.user?.id}`,
          },
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `فشل حذف الدعوى من قاعدة البيانات (Status: ${response.status})`
        );
      }
      showMessage("تم حذف الدعوى بنجاح!", "success");
      router.push("/dashboard/all-cases");
      closeDeleteModal();
    } catch (err: any) {
      console.error("خطأ في عملية حذف الدعوى:", err);
      const errorMessage = err.message.includes("Failed to fetch")
        ? "تعذر الاتصال بالخادم أثناء الحذف."
        : err.message || "حدث خطأ أثناء حذف الدعوى.";
      showMessage(errorMessage, "error");
    } finally {
      setIsDeleting(false);
    }
  }, [
    caseToDelete,
    deleteFilesFromCloudinary,
    showMessage,
    closeDeleteModal,
    session,
    router,
  ]);

  const handlePrintReport = useCallback(() => {
    if (!caseDetails) return;

   const generatePrintContent = (details: CaseDetails) => `
      <html>
        <head>
          <title>تقرير تفاصيل الدعوى - ${details.caseNumber}</title>
          <meta charset="utf-8">
          <style>
            body { 
              font-family: 'Arial', sans-serif; 
              direction: rtl; 
              text-align: right; 
              color: #2c3e50; 
              line-height: 1.4;
              margin: 15px;
              font-size: 13px;
              background: #f8f9fa;
            }
            
            .container {
              max-width: 100%;
              background: white;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              overflow: hidden;
            }
            
            .header {
              background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
              color: white;
              text-align: center;
              padding: 20px;
              margin: 0;
            }
            
            .header h1 {
              margin: 0;
              font-size: 24px;
              font-weight: bold;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 15px;
            }
            
            .logo {
              font-size: 28px;
            }
            
            .content {
              padding: 20px;
            }
            
            .main-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
              border: 2px solid #34495e;
              border-radius: 8px;
              overflow: hidden;
            }
            
            .section-header {
              background: linear-gradient(135deg, #34495e 0%, #2c3e50 100%);
              color: white;
              text-align: center;
              font-weight: bold;
              font-size: 16px;
              padding: 12px;
            }
            
            .main-table th {
              background: #ecf0f1;
              color: #2c3e50;
              font-weight: bold;
              padding: 12px 15px;
              border: 1px solid #bdc3c7;
              width: 25%;
              text-align: right;
              font-size: 14px;
            }
            
            .main-table td {
              padding: 12px 15px;
              border: 1px solid #bdc3c7;
              background: #ffffff;
              font-size: 13px;
            }
            
            .two-column {
              display: flex;
              gap: 15px;
              margin-bottom: 15px;
            }
            
            .column {
              flex: 1;
            }
            
            .notes-section, .opponents-section, .decision-section {
              margin-top: 15px;
              border: 2px solid #3498db;
              border-radius: 8px;
              overflow: hidden;
            }
            
            .notes-section .section-header,
            .opponents-section .section-header,
            .decision-section .section-header {
              background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
            }
            
            .content-box {
              padding: 15px;
              background: #f8f9fa;
              min-height: 60px;
              font-size: 13px;
              line-height: 1.5;
            }
            
            .opponents-list {
              padding: 0;
              margin: 0;
            }
            
            .opponent-item {
              padding: 8px 15px;
              background: #ffffff;
              border-bottom: 1px solid #ecf0f1;
              font-size: 13px;
            }
            
            .opponent-item:last-child {
              border-bottom: none;
            }
            
            .opponent-item:nth-child(even) {
              background: #f8f9fa;
            }
            
            .footer {
              text-align: center;
              margin-top: 20px;
              padding: 15px;
              background: #ecf0f1;
              border-radius: 8px;
              font-size: 12px;
              color: #7f8c8d;
              border-top: 3px solid #3498db;
            }
            
            @media print {
              body { 
                margin: 0; 
                background: white !important; 
                font-size: 12px;
              }
              
              .container {
                box-shadow: none;
                border-radius: 0;
              }
              
              .header, .section-header, .content-box {
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
              }
              
              @page { 
                size: A4; 
                margin: 1.5cm;
              }
              
              .two-column {
                page-break-inside: avoid;
              }
              
              .notes-section, .opponents-section, .decision-section {
                page-break-inside: avoid;
                margin-top: 10px;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>
                <span class="logo">⚖️</span>
                تقرير تفاصيل الدعوى
              </h1>
            </div>

            <div class="content">
              <!-- الجدول الرئيسي -->
              <table class="main-table">
                <thead>
                  <tr>
                    <th colspan="4" class="section-header">المعلومات الأساسية والتواريخ المهمة</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th>الموكل</th>
                    <td>${details.client?.name || "غير محدد"}</td>
                    <th>رقم الدعوى</th>
                    <td>${details.caseNumber || "غير محدد"}</td>
                  </tr>
                  <tr>
                  <th>السنة</th>
                  <td>${details.year || "غير محدد"}</td>
                  <th>نوع الدعوى</th>
                  <td>${details.caseTypeOF || "غير محدد"}</td>
                  </tr>
                  <tr>
                  <th>طبيعة الدعوى</th>
                  <td>${details.type || "غير محدد"}</td>
                  <th>المحكمة</th>
                    <td>${details.court || "غير محدد"}</td>
                  </tr>
                  <tr>
                  <th>مسمى الدعوى</th>
                  <td>${details.nameOfCase || "غير محدد"}</td>
                      <th>حالة الدعوى</th>
                    <td>${details.status|| "غير محدد"}</td>
                  <tr>
                    <th>رقم التوكيل</th>
                    <td>${details.attorneyNumber || "غير محدد"}</td>
                    <th>تاريخ الدعوى</th>
                    <td>${formatDate(details.caseDate)}</td>
                  </tr>
                  <tr>
                    <th>تاريخ الجلسة القادمة</th>
                    <td colspan="3" style="font-weight: bold; color: #e74c3c;">${formatDate(details.sessiondate)}</td>
                  </tr>
                  <tr>
                
                  </tr>
                </tbody>
              </table>

              <!-- الأقسام الإضافية في صفوف -->
              <div class="two-column">
              ${details.opponents && details.opponents.length > 0 ? `
                <div class="column">
                  <div class="opponents-section">
                    <div class="section-header">الخصوم (${details.opponents.length})</div>
                    <div class="opponents-list">
                      ${details.opponents.map((opp, index) => 
                        `<div class="opponent-item">${index + 1}. ${opp}</div>`
                      ).join('')}
                    </div>
                  </div>
                </div>
                ` : ''}

                ${details.decision ? `
                <div class="column">
                  <div class="decision-section">
                    <div class="section-header">القرار</div>
                    <div class="content-box">${details.decision}</div>
                  </div>
                </div>
                ` : ''}
              </div>

              ${details.nots ? `
              <div class="notes-section">
                <div class="section-header">الملاحظات</div>
                <div class="content-box">${details.nots}</div>
              </div>
              ` : ''}

              <div class="footer">
                تم إنشاء هذا التقرير بتاريخ: ${formatDate(new Date().toISOString())} | نظام إدارة الدعاوى القانونية
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(generatePrintContent(caseDetails));
      printWindow.document.close();
      printWindow.print();
    }
  }, [caseDetails, formatDate]);

  if (status === "loading" || loading) {
    return (
      <div className="flex flex-1 items-center justify-center h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20">
        <div className="text-center">
          <div className="relative">
            <div className="w-24 h-24 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin animate-reverse mx-auto mt-4 ml-4"></div>
          </div>
          <div className="mt-8 space-y-2">
            <p className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              جاري تحميل تفاصيل الدعوى
            </p>
            <p className="text-gray-600 dark:text-gray-300">
              يرجى الانتظار لحظات...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center h-screen bg-gradient-to-br from-red-100 via-pink-50 to-orange-100 dark:from-red-900/10 dark:via-pink-900/10 dark:to-orange-900/10 p-4">
        <AnimatedCard className="max-w-md w-full">
          <Card className="text-center border-0 shadow-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl">
            <CardContent className="pt-8 pb-6">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
                <X className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mb-4">حدث خطأ</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">{error}</p>
              <div className="flex flex-col gap-4">
                <Button 
                  onClick={() => window.location.reload()} 
                  className="w-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  إعادة تحميل الصفحة
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => router.back()} 
                  className="w-full border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 transform hover:scale-105"
                >
                  <ArrowLeft className="h-4 w-4 ml-2" />
                  العودة
                </Button>
              </div>
            </CardContent>
          </Card>
        </AnimatedCard>
      </div>
    );
  }

  if (!caseDetails) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center h-screen bg-gradient-to-br from-yellow-100 via-orange-50 to-red-100 dark:from-yellow-900/10 dark:via-orange-900/10 dark:to-red-900/10 p-4">
        <AnimatedCard className="max-w-md w-full">
          <Card className="text-center border-0 shadow-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl">
            <CardContent className="pt-8 pb-6">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
                <FileText className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent mb-4">الدعوى غير موجودة</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">لم يتم العثور على الدعوى بهذا الرقم التعريفي.</p>
              <Button 
                onClick={() => router.push("/dashboard/all-cases")} 
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                العودة إلى قائمة الدعاوى
              </Button>
            </CardContent>
          </Card>
        </AnimatedCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-900 text-gray-900 dark:text-gray-100">
      {/* Floating Top Toolbar */}
      <div className="sticky top-4 z-20 mx-4 mb-6">
        <div className="flex items-center justify-between p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="rounded-full hover:bg-gray-100/80 dark:hover:bg-gray-700/80 transition-all duration-300 transform hover:scale-110"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Scale className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">رقم الدعوى</p>
                <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {caseDetails.caseNumber}
                </h1>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              className="text-gray-600 dark:text-gray-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 transition-all duration-300 transform hover:scale-105 rounded-xl"
              onClick={handlePrintReport}
            >
              <Printer className="h-5 w-5 ml-2" />
              طباعة
            </Button>
            <Button
              variant="ghost"
              className="text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition-all duration-300 transform hover:scale-105 rounded-xl"
              onClick={() => router.push(`/dashboard/cases/${caseId}/edit`)}
            >
              <Edit className="h-5 w-5 ml-2" />
              تعديل
            </Button>
            <Button
              variant="ghost"
              className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-all duration-300 transform hover:scale-105 rounded-xl"
              onClick={() => caseDetails && openDeleteModal(caseDetails)}
            >
              <Trash2 className="h-5 w-5 ml-2" />
              حذف
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-4 md:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Panel */}
        <div className="lg:col-span-2 space-y-8">
          {/* Client Information Hero Card */}
          <AnimatedCard delay={100}>
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-2xl border-0 rounded-3xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-8">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <User className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1 text-white">
                    <p className="text-sm font-medium opacity-90 uppercase tracking-wider">الموكل</p>
                    <h2 className="text-3xl font-bold mt-1 drop-shadow-lg">
                      {caseDetails.client?.name || "غير محدد"}
                    </h2>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
                    <Star className="h-5 w-5 text-yellow-300" />
                    <span className="text-white font-medium">{caseDetails.status}</span>
                  </div>
                </div>
              </div>
              
              <div className="p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  <DetailItem
                    icon={<Building className="h-6 w-6" />}
                    label="المحكمة"
                    value={caseDetails.court}
                    gradient="from-blue-500 to-cyan-600"
                  />
                  <DetailItem
                    icon={<Scale className="h-6 w-6" />}
                    label="طبيعة الدعوى"
                    value={caseDetails.type}
                    gradient="from-emerald-500 to-teal-600"
                  />
                  <DetailItem
                    icon={<Briefcase className="h-6 w-6" />}
                    label="نوع الدعوى"
                    value={caseDetails.caseTypeOF}
                    gradient="from-violet-500 to-purple-600"
                  />
                  <DetailItem
                    icon={<Calendar className="h-6 w-6" />}
                    label="تاريخ الدعوى"
                    value={formatDate(caseDetails.caseDate)}
                    gradient="from-orange-500 to-red-600"
                  />
                  <DetailItem
                    icon={<Clock className="h-6 w-6" />}
                    label="الجلسة القادمة"
                    value={formatDate(caseDetails.sessiondate)}
                    gradient="from-pink-500 to-rose-600"
                  />
                  <DetailItem
                    icon={<FileCheck className="h-6 w-6" />}
                    label="رقم التوكيل"
                    value={caseDetails.attorneyNumber}
                    gradient="from-amber-500 to-yellow-600"
                  />
                  <DetailItem
                    icon={<Gavel className="h-6 w-6" />}
                    label="مسمى الدعوى"
                    value={caseDetails.nameOfCase}
                    gradient="from-amber-500 to-black"
                  />
                </div>
              </div>
            </Card>
          </AnimatedCard>

          {/* Opponents Panel */}
          {caseDetails.opponents && caseDetails.opponents.length > 0 && (
            <AnimatedCard delay={200}>
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-2xl border-0 rounded-3xl overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                      <Megaphone className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 text-white">
                      <h2 className="text-2xl font-bold drop-shadow-lg">
                        الخصوم ({caseDetails.opponents.length})
                      </h2>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid gap-4">
                    {caseDetails.opponents.map((opponent, index) => (
                      <div key={index} className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/10 dark:to-pink-900/10 p-4 border border-red-100 dark:border-red-800/30 hover:shadow-lg transition-all duration-300 transform hover:scale-102">
                        <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 to-pink-500/0 group-hover:from-red-500/5 group-hover:to-pink-500/5 transition-all duration-300"></div>
                        <div className="relative flex items-center gap-4">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
                            {index + 1}
                          </div>
                          <span className="text-lg font-semibold text-gray-800 dark:text-gray-200">{opponent}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </AnimatedCard>
          )}
        </div>

        {/* Enhanced Sidebar Panel */}
        <div className="lg:col-span-1 space-y-8">
          {/* Decision & Notes Collapsible */}
          {(caseDetails.decision || caseDetails.nots) && (
            <AnimatedCard delay={300}>
              <Collapsible className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border-0 overflow-hidden">
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between w-full p-6 cursor-pointer bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700 transition-all duration-300">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                        <Info className="h-6 w-6" />
                      </div>
                      <h3 className="text-lg font-bold">ملاحظات وقرارات</h3>
                    </div>
                    <ChevronDown className="h-6 w-6 transition-transform duration-300 data-[state=open]:rotate-180" />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="p-6 space-y-6">
                  {caseDetails.decision && (
                    <div className="space-y-3">
                      <h4 className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <Gavel className="h-4 w-4 text-teal-600" />
                        القرار
                      </h4>
                      <Alert className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/10 dark:to-cyan-900/10 border-2 border-teal-200 dark:border-teal-800 rounded-2xl">
                        <AlertDescription className="text-gray-800 dark:text-gray-200 font-medium leading-relaxed">{caseDetails.decision}</AlertDescription>
                      </Alert>
                    </div>
                  )}
                  {caseDetails.nots && (
                    <div className="space-y-3">
                      <h4 className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <Info className="h-4 w-4 text-purple-600" />
                        الملاحظات
                      </h4>
                      <Alert className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/10 dark:to-indigo-900/10 border-2 border-purple-200 dark:border-purple-800 rounded-2xl">
                        <AlertDescription className="text-gray-800 dark:text-gray-200 font-medium leading-relaxed">{caseDetails.nots}</AlertDescription>
                      </Alert>
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            </AnimatedCard>
          )}

          {/* Enhanced Files Collapsible */}
          {caseDetails.files && caseDetails.files.length > 0 && (
            <AnimatedCard delay={400}>
              <Collapsible className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border-0 overflow-hidden">
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between w-full p-6 cursor-pointer bg-gradient-to-r from-orange-500 to-amber-600 text-white hover:from-orange-600 hover:to-amber-700 transition-all duration-300">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                        <FolderOpen className="h-6 w-6" />
                      </div>
                      <h3 className="text-lg font-bold">ملفات مرفقة</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold">
                        {caseDetails.files.length}
                      </span>
                      <ChevronDown className="h-6 w-6 transition-transform duration-300 data-[state=open]:rotate-180" />
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="p-6">
                  <div className="space-y-4">
                    {caseDetails.files.map((fileUrl, index) => (
                      <div 
                        key={index} 
                        className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-700 dark:to-blue-900/20 border-2 border-gray-100 dark:border-gray-600 transition-all duration-300 hover:shadow-xl hover:scale-105 hover:border-blue-200 dark:hover:border-blue-600"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/5 group-hover:to-purple-500/5 transition-all duration-300"></div>
                        <div className="relative p-4 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4 min-w-0 flex-1">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                              <File className="h-6 w-6 text-white" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="block truncate font-bold text-gray-900 dark:text-gray-100 text-lg">
                                {decodeURIComponent(fileUrl.substring(fileUrl.lastIndexOf("/") + 1))}
                              </span>
                              <span className="text-sm text-gray-500 dark:text-gray-400">ملف مرفق</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110"
                              onClick={() => window.open(fileUrl, "_blank")}
                            >
                              <Eye className="h-5 w-5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110"
                              onClick={() => {
                                const link = document.createElement("a");
                                link.href = fileUrl;
                                link.download = decodeURIComponent(
                                  fileUrl.substring(fileUrl.lastIndexOf("/") + 1)
                                );
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }}
                            >
                              <Download className="h-5 w-5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </AnimatedCard>
          )}

          {/* Quick Actions Card */}
          <AnimatedCard delay={500}>
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-2xl border-0 rounded-3xl overflow-hidden">
              <div className="bg-gradient-to-r from-slate-600 to-gray-700 p-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                  <Share2 className="h-6 w-6" />
                  إجراءات سريعة
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <Button 
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  onClick={() => router.push(`/dashboard/cases/${caseId}/edit`)}
                >
                  <Edit className="h-5 w-5 ml-2" />
                  تعديل الدعوى
                </Button>
                <Button 
                  variant="outline"
                  className="w-full border-2 border-purple-300 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 font-bold py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  onClick={handlePrintReport}
                >
                  <Printer className="h-5 w-5 ml-2" />
                  طباعة التقرير
                </Button>
                <Button 
                  variant="outline"
                  className="w-full border-2 border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 font-bold py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  onClick={() => caseDetails && openDeleteModal(caseDetails)}
                >
                  <Trash2 className="h-5 w-5 ml-2" />
                  حذف الدعوى
                </Button>
              </div>
            </Card>
          </AnimatedCard>

          {/* Case Metadata */}
          <AnimatedCard delay={600}>
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-2xl border-0 rounded-3xl overflow-hidden">
              <div className="bg-gradient-to-r from-gray-500 to-slate-600 p-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                  <Info className="h-6 w-6" />
                  معلومات إضافية
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-700 dark:to-slate-700 rounded-2xl">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">تاريخ الإنشاء</span>
                  <span className="font-bold text-gray-900 dark:text-gray-100">{formatDate(caseDetails.createdAt)}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-2xl">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">آخر تحديث</span>
                  <span className="font-bold text-gray-900 dark:text-gray-100">{formatDate(caseDetails.updatedAt)}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 rounded-2xl">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">السنة</span>
                  <span className="font-bold text-gray-900 dark:text-gray-100">{caseDetails.year || "غير محدد"}</span>
                </div>
              </div>
            </Card>
          </AnimatedCard>
        </div>
      </div>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        message="هل أنت متأكد من حذف هذه الدعوى؟ سيتم حذف جميع الملفات المرتبطة بها نهائيًا."
        onConfirm={confirmDelete}
        onCancel={closeDeleteModal}
        isLoading={isDeleting}
      />
    </div>
  );
}