/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  Plus,
  FileText,
  Edit,
  Trash2,
  ArrowUpDown,
  AlertCircle,
  RefreshCw,
  Loader2,
  Calendar,
  Users,
  Scale,
  Filter,
  SortAsc,
  SortDesc,
  Eye,
  Archive,
  Clock,
  User,
  Building,
  Hash,
  FolderOpen,
  X
} from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// تحديد الـ Base URL للـ API
const API_BASE_URL = "/api";

// واجهة لتعريف شكل بيانات الدعوى (CaseDetails Interface)
interface CaseDetails {
  _id: string;
  id?: string;
  client: { _id: string; name: string } | null;
  caseTypeOF: string;
  type: string;
  court: string;
  caseNumber: string;
  year: string;
  status: string;
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

// مكون بسيط لمؤشر النشاط (Activity Indicator)
type ActivityIndicatorSize = "small" | "medium" | "large";
const ActivityIndicator = ({
  size = "medium",
  className = "text-blue-500",
}: { size?: ActivityIndicatorSize; className?: string }) => {
  const sizeClasses: Record<ActivityIndicatorSize, string> = {
    small: "h-4 w-4",
    medium: "h-8 w-8",
    large: "h-12 w-12",
  };
  return (
    <Loader2 className={`animate-spin ${sizeClasses[size]} ${className}`} />
  );
};


// مكون مودال التأكيد (Enhanced Confirmation Modal)
interface ConfirmationModalProps {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  title?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  message,
  onConfirm,
  onCancel,
  isLoading = false,
  title = "تأكيد الحذف",
  confirmText = "حذف",
  cancelText = "إلغاء",
  danger = true,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in-0 duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-md mx-auto animate-in zoom-in-95 duration-300 border dark:border-gray-700">
        <div className="flex items-center mb-6">
          <div className={`p-3 rounded-full ${danger ? 'bg-red-100 dark:bg-red-900/30' : 'bg-blue-100 dark:bg-blue-900/30'} mr-4`}>
            <AlertCircle className={`h-6 w-6 ${danger ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h3>
        </div>

        <p className="text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
          {message}
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-6 py-3 bg-gray-100 text-gray-800 rounded-xl hover:bg-gray-200 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 font-medium dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-6 py-3 ${danger ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'} text-white rounded-xl transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 disabled:opacity-50 flex items-center gap-2 font-medium`}
          >
            {isLoading && <ActivityIndicator size="small" className="text-white" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

// مكون إحصائيات سريعة
const StatsCard = ({ icon: Icon, title, value, color }: { 
  icon: any, 
  title: string, 
  value: string | number, 
  color: string 
}) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-300">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
      </div>
      <div className={`p-3 rounded-full ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
    </div>
  </div>
);

// مكون بطاقة الدعوى (Enhanced Case Card)
const CaseCard = ({ 
  caseItem, 
  onView, 
  onEdit, 
  onDelete, 
  formatDate 
}: { 
  caseItem: CaseDetails,
  onView: (id: string) => void,
  onEdit: (id: string) => void,
  onDelete: (caseItem: CaseDetails) => void,
  formatDate: (date: string) => string
}) => {
  const caseId: string = caseItem._id ?? caseItem.id ?? "";

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-300 group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Scale className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              دعوى رقم {caseItem.caseNumber || "غير محدد"}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDate(caseItem.createdAt)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-1  duration-200">
          <button
            onClick={() => onView(caseId)}
            className="p-2 text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors duration-200"
            title="عرض التفاصيل"
            disabled={!caseId}
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => onEdit(caseId)}
            className="p-2 text-indigo-600 hover:bg-indigo-100 dark:text-indigo-400 dark:hover:bg-indigo-900/30 rounded-lg transition-colors duration-200"
            title="تعديل"
            disabled={!caseId}
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(caseItem)}
            className="p-2 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors duration-200"
            title="حذف"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600 dark:text-gray-400">الموكل:</span>
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {caseItem.client?.name || "غير محدد"}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Building className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600 dark:text-gray-400">نوع الدعوى:</span>
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {caseItem.caseTypeOF || "غير محدد"}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Hash className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600 dark:text-gray-400">التصنيف:</span>
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {caseItem.type || "غير محدد"}
          </span>
        </div>

        {caseItem.files && caseItem.files.length > 0 && (
          <div className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">الملفات:</span>
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
              {caseItem.files.length} ملف
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default function AllCasesPage() {
  const { data: session, status } = useSession();
  const [cases, setCases] = useState<CaseDetails[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: string | null;
    direction: "ascending" | "descending";
  }>({ key: null, direction: "ascending" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [caseToDelete, setCaseToDelete] = useState<CaseDetails | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
const router = useRouter()
  // Function to show toast messages
  const showMessage = useCallback((msg: string, type: "success" | "error" | "warning" | "info") => {
    if (type === "success") {
      toast.success(msg);
    } else if (type === "error") {
      toast.error(msg);
    } else if (type === "warning") {
      toast.warning(msg);
    } else if (type === "info") {
      toast.info(msg);
    }
  }, []);

  // Dark mode toggle


  // Initialize dark mode


  // دالة لجلب الدعاوى من الـ API
  const fetchCases = useCallback(async () => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push('/auth/login')
      setError("غير مصرح لك بعرض هذه البيانات. يرجى تسجيل الدخول.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/cases`, {
        headers: {
          Authorization: `Bearer ${session?.user?.id}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      let casesData: CaseDetails[] = [];
      if (Array.isArray(data)) {
        casesData = data;
      } else if (data.data && Array.isArray(data.data)) {
        casesData = data.data;
      } else if (data.cases && Array.isArray(data.cases)) {
        casesData = data.cases;
      }

      setCases(casesData);
    } catch (err: any) {
      console.error("Error fetching cases:", err);
      const errorMessage = err.message.includes("Failed to fetch")
        ? "تعذر الاتصال بالخادم. تحقق من اتصال الإنترنت."
        : err.message || "حدث خطأ أثناء جلب الدعاوى.";
      setError(errorMessage);
      setCases([]);
    } finally {
      setLoading(false);
    }
  }, [router, session?.user?.id, status]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  // دالة للتعامل مع الفرز
  const sortedCases = useMemo(() => {
    if (!Array.isArray(cases)) return [];

    const sortableItems = [...cases];

    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let aValue: any, bValue: any;

        switch (sortConfig.key) {
          case "clientName":
            aValue = a.client?.name || "";
            bValue = b.client?.name || "";
            break;
          case "createdAt":
            aValue = new Date(a.createdAt || 0).getTime();
            bValue = new Date(b.createdAt || 0).getTime();
            break;
          default:
            aValue = (a as any)[sortConfig.key as keyof CaseDetails] || "";
            bValue = (b as any)[sortConfig.key as keyof CaseDetails] || "";
        }

        if (aValue < bValue) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }

    return sortableItems;
  }, [cases, sortConfig]);

  // دالة للتعامل مع البحث والفلترة
  const filteredCases = useMemo(() => {
    if (!searchTerm.trim()) return sortedCases;

    const lowercasedSearchTerm = searchTerm.toLowerCase().trim();

    return sortedCases.filter((caseItem) => {
      const clientName = caseItem.client?.name?.toLowerCase() || "";
      const caseType = caseItem.caseTypeOF?.toLowerCase() || "";
      const type = caseItem.type?.toLowerCase() || "";
      const caseNumber = String(caseItem.caseNumber || "").toLowerCase();
      const court = caseItem.court?.toLowerCase() || "";

      return (
        clientName.includes(lowercasedSearchTerm) ||
        caseType.includes(lowercasedSearchTerm) ||
        type.includes(lowercasedSearchTerm) ||
        caseNumber.includes(lowercasedSearchTerm) ||
        court.includes(lowercasedSearchTerm)
      );
    });
  }, [sortedCases, searchTerm]);

  // حساب الإحصائيات
  const stats = useMemo(() => {
    const totalCases = cases.length;
    const recentCases = cases.filter(c => {
      const caseDate = new Date(c.createdAt);
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return caseDate > monthAgo;
    }).length;
    const activeCases = cases.filter(c => c.decision === "جارية" || !c.decision).length;

    return { totalCases, recentCases, activeCases };
  }, [cases]);

  // دالة لطلب الفرز
  const requestSort = useCallback(
    (key: string) => {
      let direction: "ascending" | "descending" = "ascending";
      if (sortConfig.key === key && sortConfig.direction === "ascending") {
        direction = "descending";
      }
      setSortConfig({ key, direction });
    },
    [sortConfig]
  );

  // دالة للحصول على أيقونة الفرز
  const getSortIcon = useCallback(
    (name: string) => {
      if (sortConfig.key !== name) {
        return <ArrowUpDown className="h-4 w-4 opacity-50" />;
      }
      return sortConfig.direction === "ascending" ? 
        <SortAsc className="h-4 w-4 text-blue-600 dark:text-blue-400" /> :
        <SortDesc className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
    },
    [sortConfig]
  );

  // دالة لفتح نافذة تأكيد الحذف
  const openDeleteModal = useCallback((caseItem: CaseDetails) => {
    setCaseToDelete(caseItem);
    setIsDeleteModalOpen(true);
  }, []);

  // دالة لإغلاق نافذة تأكيد الحذف
  const closeDeleteModal = useCallback(() => {
    setIsDeleteModalOpen(false);
    setCaseToDelete(null);
  }, []);

  // دالة لاستخراج الـ public_id من Cloudinary URL
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
      console.error("Error extracting public ID from URL:", error, "from URL:", fileUrl);
      return null;
    }
  }, []);

  // دالة منفصلة لحذف ملف واحد من Cloudinary
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

        const errorMessage = errorData.message || `فشل حذف الملف (Status: ${response.status})`;
        return { success: false, error: errorMessage };
      } catch (error) {
        console.error(`خطأ في الاتصال أثناء حذف الملف ${publicId}:`, error);
        return { success: false, error: "خطأ في الاتصال" };
      }
    },
    [session]
  );

  // دالة لحذف عدة ملفات من Cloudinary
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

      let successCount = 0;
      let failureCount = 0;
      const errors: string[] = [];

      for (const publicId of publicIds) {
        const result = await deleteFileFromCloudinary(publicId);
        if (result.success) {
          successCount++;
        } else {
          failureCount++;
          errors.push(`${publicId}: ${result.error}`);
        }
      }

      return { successCount, failureCount, errors };
    },
    [deleteFileFromCloudinary, extractPublicId]
  );

  // دالة التعامل مع حذف الدعوى
  const handleDeleteCase = useCallback(async () => {
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
      // حذف الملفات من Cloudinary
      const fileUrls = caseToDelete.files || [];
      if (fileUrls.length > 0) {
        const filesResult = await deleteFilesFromCloudinary(fileUrls);
        
        if (filesResult.failureCount === 0) {
          showMessage(`تم حذف جميع الملفات (${filesResult.successCount}) بنجاح.`, "success");
        } else if (filesResult.successCount === 0) {
          showMessage(`فشل حذف جميع الملفات (${filesResult.failureCount}).`, "error");
        } else {
          showMessage(`تم حذف ${filesResult.successCount} ملف، فشل حذف ${filesResult.failureCount} ملف.`, "warning");
        }
      }

      // حذف الدعوى من قاعدة البيانات
      const response = await fetch(`${API_BASE_URL}/cases/${caseToDelete._id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.user?.id}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.message || `فشل حذف الدعوى (Status: ${response.status})`);
        // throw new Error(errorData.message || `فشل حذف الدعوى (Status: ${response.status})`);
      }

      showMessage("تم حذف الدعوى بنجاح!", "success");
      await fetchCases();
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
  }, [caseToDelete, deleteFilesFromCloudinary, showMessage, fetchCases, closeDeleteModal, session]);

  // دالة لتنسيق التاريخ
  const formatDate = useCallback((dateString: string) => {
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

  // دالة للتنقل
  const navigate = useCallback((path: string) => {
    window.location.href = path;
  }, []);

  // Navigation handlers
  const handleViewCase = useCallback((caseId: string) => {
    navigate(`/dashboard/cases/${caseId}/single_case`);
  }, [navigate]);

  const handleEditCase = useCallback((caseId: string) => {
    navigate(`/dashboard/cases/${caseId}/edit`);
  }, [navigate]);

  // شاشة التحميل الأولية
  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="mb-6">
            <ActivityIndicator size="large" className="text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">جاري تحميل الدعاوى</h2>
          <p className="text-gray-600 dark:text-gray-400">يرجى الانتظار...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-gray-900 p-4">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl max-w-md w-full text-center border dark:border-gray-700">
          <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full w-fit mx-auto mb-6">
            <AlertCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-red-700 dark:text-red-200 mb-4">حدث خطأ</h2>
          <p className="text-red-600 dark:text-red-300 mb-8 leading-relaxed">{error}</p>
          <button
            onClick={fetchCases}
            disabled={loading}
            className="px-8 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 mx-auto font-medium transition-all duration-200"
          >
            {loading ? (
              <ActivityIndicator size="small" className="text-white" />
            ) : (
              <RefreshCw className="h-5 w-5" />
            )}
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* Modern Header with Gradient */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 dark:from-blue-800 dark:via-blue-900 dark:to-indigo-950 rounded-3xl shadow-2xl mb-8 overflow-hidden relative">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative px-8 py-12">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                  <Scale className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                    نظام إدارة الدعاوى
                  </h1>
                  <p className="text-blue-100 text-lg">
                    إدارة شاملة لجميع القضايا القانونية
                  </p>
                </div>
              </div>
              
        
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatsCard
                icon={FileText}
                title="إجمالي الدعاوى"
                value={stats.totalCases}
                color="bg-gradient-to-r from-blue-500 to-blue-600"
              />
              <StatsCard
                icon={Clock}
                title="الدعاوى الحديثة"
                value={stats.recentCases}
                color="bg-gradient-to-r from-green-500 to-green-600"
              />
              <StatsCard
                icon={Archive}
                title="الدعاوى النشطة"
                value={stats.activeCases}
                color="bg-gradient-to-r from-purple-500 to-purple-600"
              />
            </div>
          </div>
        </div>

        {/* Controls Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
            
            {/* Search Bar */}
            <div className="relative w-full lg:w-2/3">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="البحث في الدعاوى (اسم الموكل، نوع الدعوى، رقم الدعوى، المحكمة...)"
                className="w-full pl-12 pr-4 py-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm bg-gray-50 dark:bg-gray-700 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 w-full lg:w-auto">
              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    viewMode === 'grid' 
                      ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm' 
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                  title="عرض البطاقات"
                >
                  <FolderOpen className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    viewMode === 'table' 
                      ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm' 
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                  title="عرض الجدول"
                >
                  <Filter className="h-4 w-4" />
                </button>
              </div>

              {/* Add Case Button */}
              <button
                onClick={() => navigate("/dashboard/add-case")}
                className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl shadow-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 text-sm font-bold group"
              >
                <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-200" />
                إضافة دعوى جديدة
              </button>
            </div>
          </div>

          {/* Search Results Info */}
          {searchTerm && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                تم العثور على <span className="font-bold">{filteredCases.length}</span> دعوى من أصل <span className="font-bold">{cases.length}</span>
              </p>
            </div>
          )}
        </div>

        {/* Empty State */}
        {filteredCases.length === 0 && !loading && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 text-center py-16">
            <div className="mb-6">
              <div className="p-6 bg-gray-100 dark:bg-gray-700 rounded-full w-fit mx-auto mb-4">
                <FileText className="h-16 w-16 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                {searchTerm ? "لا توجد نتائج" : "لا توجد دعاوى"}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
                {searchTerm
                  ? "لم يتم العثور على دعاوى تطابق معايير البحث المحددة"
                  : "ابدأ بإضافة أول دعوى قضائية في النظام"}
              </p>
            </div>
            
            {!searchTerm && (
              <button
                onClick={() => navigate("/dashboard/add-case")}
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-bold text-lg shadow-lg"
              >
                <Plus className="h-5 w-5" />
                إضافة أول دعوى
              </button>
            )}
          </div>
        )}

        {/* Cases Display */}
        {filteredCases.length > 0 && (
          <>
            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCases.map((caseItem: CaseDetails) => (
                  <CaseCard
                    key={caseItem._id || caseItem.id}
                    caseItem={caseItem}
                    onView={handleViewCase}
                    onEdit={handleEditCase}
                    onDelete={openDeleteModal}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            )}

            {/* Table View */}
            {viewMode === 'table' && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          <button
                            onClick={() => requestSort("caseNumber")}
                            className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none transition-colors duration-200"
                          >
                            رقم الدعوى
                            {getSortIcon("caseNumber")}
                          </button>
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          <button
                            onClick={() => requestSort("clientName")}
                            className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none transition-colors duration-200"
                          >
                            الموكل
                            {getSortIcon("clientName")}
                          </button>
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          <button
                            onClick={() => requestSort("caseTypeOF")}
                            className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none transition-colors duration-200"
                          >
                            نوع الدعوى
                            {getSortIcon("caseTypeOF")}
                          </button>
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          <button
                            onClick={() => requestSort("type")}
                            className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none transition-colors duration-200"
                          >
                            التصنيف
                            {getSortIcon("type")}
                          </button>
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          المحكمة
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          <button
                            onClick={() => requestSort("createdAt")}
                            className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none transition-colors duration-200"
                          >
                            تاريخ الإنشاء
                            {getSortIcon("createdAt")}
                          </button>
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          الإجراءات
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredCases.map((caseItem: CaseDetails) => {
                        const caseId  = caseItem?._id || caseItem?.id;
                        return (
                          <tr
                            key={caseId}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200 group"
                          >
                            <td className="px-6 py-5 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                  <Hash className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                  {caseItem.caseNumber || "غير محدد"}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                  <User className="h-4 w-4 text-green-600 dark:text-green-400" />
                                </div>
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {caseItem.client?.name || "غير محدد"}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap">
                              <span className="inline-flex px-3 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full">
                                {caseItem.caseTypeOF || "غير محدد"}
                              </span>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap">
                              <span className="inline-flex px-3 py-1 text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 rounded-full">
                                {caseItem.type || "غير محدد"}
                              </span>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Building className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                  {caseItem.court || "غير محدد"}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                  {formatDate(caseItem.createdAt)}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap text-center">
                              <div className="flex items-center justify-center gap-1 duration-200">
                                <button
                                  onClick={() => caseId && handleViewCase(caseId)}
                                  className="p-2 text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-xl transition-all duration-200 hover:scale-110"
                                  title="عرض التفاصيل"
                                  disabled={!caseId}
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => caseId && handleEditCase(caseId)}
                                  className="p-2 text-indigo-600 hover:bg-indigo-100 dark:text-indigo-400 dark:hover:bg-indigo-900/30 rounded-xl transition-all duration-200 hover:scale-110"
                                  title="تعديل"
                                  disabled={!caseId}
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => openDeleteModal(caseItem)}
                                  className="p-2 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30 rounded-xl transition-all duration-200 hover:scale-110"
                                  title="حذف"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Results Summary */}
            <div className="mt-6 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>
                  عرض {filteredCases.length} من أصل {cases.length} دعوى
                </span>
              </div>
              
              {sortConfig.key && (
                <div className="flex items-center gap-2">
                  <span>مرتب حسب:</span>
                  <span className="font-medium text-blue-600 dark:text-blue-400">
                    {sortConfig.key === 'clientName' && 'اسم الموكل'}
                    {sortConfig.key === 'caseNumber' && 'رقم الدعوى'}
                    {sortConfig.key === 'caseTypeOF' && 'نوع الدعوى'}
                    {sortConfig.key === 'type' && 'التصنيف'}
                    {sortConfig.key === 'createdAt' && 'تاريخ الإنشاء'}
                  </span>
                  <span className="text-xs">
                    ({sortConfig.direction === 'ascending' ? 'تصاعدي' : 'تنازلي'})
                  </span>
                </div>
              )}
            </div>
          </>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmationModal
          isOpen={isDeleteModalOpen}
          title="تأكيد حذف الدعوى"
          message={`هل أنت متأكد من حذف الدعوى رقم "${caseToDelete?.caseNumber}"؟\n\nسيتم حذف جميع البيانات والملفات المرتبطة بها نهائياً ولا يمكن التراجع عن هذا الإجراء.`}
          onConfirm={handleDeleteCase}
          onCancel={closeDeleteModal}
          isLoading={isDeleting}
          confirmText="حذف نهائياً"
          cancelText="إلغاء"
          danger={true}
        />
      </div>
    </div>
  );
}