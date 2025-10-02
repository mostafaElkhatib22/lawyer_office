/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/rules-of-hooks */
"use client";

import React, { use, useState, useEffect, useMemo, useCallback } from "react";
import {
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  UploadCloud,
  XCircle,
  Loader2,
  Trash2,
  Image,
  File,
  DollarSign,
  CreditCard,
  PlusCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// --- START MOCK for next-auth/react ---
const mockUseSession = () => {
  const [status, setStatus] = useState<
    "loading" | "authenticated" | "unauthenticated"
  >("loading");
  const [session, setSession] = useState<any>(null);
  useEffect(() => {
    const timer = setTimeout(() => {
      setStatus("authenticated");
      setSession({
        user: { name: "Mock User", email: "mock@example.com" },
        accessToken: "mock_access_token_12345",
        expires: new Date(Date.now() + 3600 * 1000).toISOString(),
      });
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  console.log("Mock Session Status:", status);
  console.log("Mock Session Data:", session);

  return { data: session, status };
};

const useSession = mockUseSession;
// --- END MOCK ---

const API_BASE_URL = "/api";

interface Payment {
  amount: number;
  date: string;
  method: string;
  note?: string;
}

interface FinancialInfo {
  fees: number;
  currency: string;
  financialNotes: string;
  paidAmount: number;
  payments: Payment[];
  lastPaymentDate?: string;
}

interface CaseDetails {
  _id: string;
  client?: { _id: string; name: string } | null;
  caseTypeOF: string;
  type: string;
  court: string;
  caseNumber: string;
  year: string;
  nameOfCase: string;
  attorneyNumber: string;
  decision: string;
  status: string;
  nots: string;
  caseDate: string;
  sessiondate: string;
  opponents: string[];
  files: string[];
  financialInfo?: FinancialInfo;
  createdAt: string;
  updatedAt: string;
}

interface Client {
  _id: string;
  name: string;
}

const PAYMENT_METHODS = ["نقدي", "تحويل بنكي", "شيك", "بطاقة ائتمان", "أخرى"];
const CURRENCIES = [
  { value: "EGP", label: "EGP - الجنيه المصري" },
  { value: "USD", label: "USD - الدولار" },
  { value: "EUR", label: "EUR - اليورو" },
  { value: "SAR", label: "SAR - الريال السعودي" },
  { value: "AED", label: "AED - الدرهم الإماراتي" },
];

// Activity Indicator Component
type ActivityIndicatorSize = "small" | "medium" | "large";
const ActivityIndicator = ({
  size = "medium",
  className = "text-blue-500",
}: {
  size?: ActivityIndicatorSize;
  className?: string;
}) => {
  const sizeClasses: Record<ActivityIndicatorSize, string> = {
    small: "h-4 w-4",
    medium: "h-8 w-8",
    large: "h-12 w-12",
  };
  return (
    <Loader2 className={`animate-spin ${sizeClasses[size]} ${className}`} />
  );
};

// Confirmation Modal Component
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md mx-auto animate-in fade-in-0 zoom-in-95">
        <div className="flex items-center mb-4">
          <AlertCircle className="h-6 w-6 text-red-500 dark:text-red-400 mr-3" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            تأكيد الحذف
          </h3>
        </div>

        <p className="text-gray-700 dark:text-gray-300 mb-6">{message}</p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 dark:bg-gray-600 dark:text-gray-100 dark:hover:bg-gray-500"
          >
            إلغاء
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading && (
              <ActivityIndicator size="small" className="text-white" />
            )}
            حذف
          </button>
        </div>
      </div>
    </div>
  );
};

// Main EditCasePage Component
export default function EditCasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const unwrappedParams = use(params);
  const caseId = unwrappedParams.id;
  const router = useRouter();
  const { data: session, status } = useSession();

  const [caseData, setCaseData] = useState<Partial<CaseDetails>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [existingFiles, setExistingFiles] = useState<string[]>([]);
  const [newFilesToUpload, setNewFilesToUpload] = useState<File[]>([]);

  // Financial states
  const [financialInfo, setFinancialInfo] = useState<FinancialInfo>({
    fees: 0,
    currency: "EGP",
    financialNotes: "",
    paidAmount: 0,
    payments: [],
  });
  const [newPayment, setNewPayment] = useState({
    amount: 0,
    date: new Date().toISOString().split("T")[0],
    method: "نقدي",
    note: "",
  });

  // Modals
  const [isDeleteFileModalOpen, setIsDeleteFileModalOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [isDeletingFile, setIsDeletingFile] = useState(false);

  const caseTypeOptions = useMemo(
    () => ["مدني", "جنائي", "إداري", "أحوال شخصية", "تجاري", "عمالي"],
    []
  );
  const typeOptions = useMemo(() => ["ابتدائي", "استئناف", "نقض", "تنفيذ"], []);
  const caseStatusOptions = useMemo(
    () => ["مفتوحة", "مغلقة", "مؤجلة", "استئناف", "مشطوبة"],
    []
  );

  const getPaymentStatus = useCallback(() => {
    const fees = financialInfo.fees || 0;
    const paid = financialInfo.paidAmount || 0;
    
    if (fees === 0) return { text: "بدون أتعاب", color: "text-gray-600" };
    if (paid === 0) return { text: "غير مدفوع", color: "text-red-600" };
    if (paid >= fees) return { text: "مدفوع بالكامل", color: "text-green-600" };
    return { text: "مدفوع جزئياً", color: "text-yellow-600" };
  }, [financialInfo.fees, financialInfo.paidAmount]);

  const showMessage = useCallback(
    (msg: string, type: "success" | "error" | "warning" | "info") => {
      if (type === "success") {
        toast.success(msg);
      } else if (type === "error") {
        toast.error(msg);
      } else if (type === "warning") {
        toast.warning(msg);
      } else if (type === "info") {
        toast.info(msg);
      }
    },
    []
  );

  const fetchClients = useCallback(async () => {
    if (status === "loading" || status === "unauthenticated" || !session?.accessToken) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/clients`, {
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (data.success && data.data) {
        setClients(data.data);
      }
    } catch (err: any) {
      console.error("Error fetching clients:", err);
      showMessage("فشل جلب قائمة الموكلين", "error");
    }
  }, [status, session, showMessage]);

  const fetchCaseDetails = useCallback(async () => {
    if (!caseId || status === "loading" || status === "unauthenticated" || !session?.accessToken) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/cases/${caseId}`, {
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success && result.data) {
        setCaseData(result.data);
        setExistingFiles(result.data.files || []);
        setSelectedClient(result.data.client?._id || null);
        
        // Load financial info
        if (result.data.financialInfo) {
          setFinancialInfo(result.data.financialInfo);
        }
      } else {
        throw new Error(result.message || "فشل في جلب بيانات الدعوى");
      }
    } catch (err: any) {
      console.error("Error fetching case details:", err);
      setError(err.message || "حدث خطأ أثناء جلب تفاصيل الدعوى");
    } finally {
      setLoading(false);
    }
  }, [caseId, status, session]);

  useEffect(() => {
    if (status !== "loading") {
      fetchClients();
      fetchCaseDetails();
    }
  }, [fetchClients, fetchCaseDetails, status]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCaseData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleClientChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedClient(e.target.value);
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setNewFilesToUpload((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  }, []);

  const removeNewFile = useCallback((fileToRemove: File) => {
    setNewFilesToUpload((prev) => prev.filter((file) => file !== fileToRemove));
  }, []);

  const openDeleteFileModal = useCallback((fileUrl: string) => {
    setFileToDelete(fileUrl);
    setIsDeleteFileModalOpen(true);
  }, []);

  const closeDeleteFileModal = useCallback(() => {
    setIsDeleteFileModalOpen(false);
    setFileToDelete(null);
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
      console.error("Error extracting public ID from URL:", error);
      return null;
    }
  }, []);

  const handleDeleteExistingFile = useCallback(async () => {
    if (!fileToDelete) return;

    setIsDeletingFile(true);
    const publicId = extractPublicId(fileToDelete);

    if (!publicId) {
      showMessage("فشل استخراج معرف الملف للحذف.", "error");
      setIsDeletingFile(false);
      closeDeleteFileModal();
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/images`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({ publicId }),
      });

      if (!response.ok && response.status !== 404) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            `فشل حذف الملف من Cloudinary (Status: ${response.status})`
        );
      }

      setExistingFiles((prev) => prev.filter((url) => url !== fileToDelete));
      showMessage(`تم حذف الملف بنجاح.`, "success");
    } catch (err: any) {
      console.error("Error deleting file from Cloudinary:", err);
      showMessage(err.message || "فشل حذف الملف من Cloudinary.", "error");
    } finally {
      setIsDeletingFile(false);
      closeDeleteFileModal();
    }
  }, [fileToDelete, extractPublicId, session, showMessage, closeDeleteFileModal]);

  const handleAddPayment = useCallback(() => {
    if (!newPayment.amount || newPayment.amount <= 0) {
      showMessage("يرجى إدخال مبلغ صحيح", "error");
      return;
    }

    const paymentToAdd = {
      amount: Number(newPayment.amount),
      date: newPayment.date,
      method: newPayment.method,
      note: newPayment.note,
    };

    setFinancialInfo((prev) => {
      const updatedPayments = [...prev.payments, paymentToAdd];
      const totalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);

      return {
        ...prev,
        payments: updatedPayments,
        paidAmount: totalPaid,
        lastPaymentDate: paymentToAdd.date,
      };
    });

    setNewPayment({
      amount: 0,
      date: new Date().toISOString().split("T")[0],
      method: "نقدي",
      note: "",
    });

    showMessage("تم إضافة الدفعة بنجاح", "success");
  }, [newPayment, showMessage]);

  const handleRemovePayment = useCallback((indexToRemove: number) => {
    setFinancialInfo((prev) => {
      const updatedPayments = prev.payments.filter((_, idx) => idx !== indexToRemove);
      const totalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);

      return {
        ...prev,
        payments: updatedPayments,
        paidAmount: totalPaid,
        lastPaymentDate: updatedPayments.length > 0 
          ? updatedPayments[updatedPayments.length - 1].date 
          : undefined,
      };
    });
    showMessage("تم حذف الدفعة", "info");
  }, [showMessage]);

  const uploadNewFilesToCloudinary = useCallback(async (): Promise<string[]> => {
    if (newFilesToUpload.length === 0) return [];

    const uploadedUrls: string[] = [];
    for (const file of newFilesToUpload) {
      const reader = new FileReader();
      reader.readAsDataURL(file);

      const base64File = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
      });

      try {
        const response = await fetch(`${API_BASE_URL}/images`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.accessToken}`,
          },
          body: JSON.stringify({
            imageBase64: base64File,
            folder: "cases_files",
          }),
        });

        if (!response.ok) {
          throw new Error(`فشل تحميل الملف ${file.name}`);
        }

        const data = await response.json();
        uploadedUrls.push(data.url);
        showMessage(`تم تحميل الملف ${file.name} بنجاح`, "success");
      } catch (err: any) {
        console.error("Error uploading file:", err);
        showMessage(`فشل تحميل الملف ${file.name}`, "error");
      }
    }
    return uploadedUrls;
  }, [newFilesToUpload, session, showMessage]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseId || status === "unauthenticated" || !session?.accessToken) {
      showMessage("يجب تسجيل الدخول لتعديل الدعوى", "error");
      return;
    }

    setIsSaving(true);

    try {
      const newlyUploadedFileUrls = await uploadNewFilesToCloudinary();
      const finalFileUrls = [...existingFiles, ...newlyUploadedFileUrls];

      const updatedCasePayload = {
        client: selectedClient || null,
        caseTypeOF: caseData.caseTypeOF,
        type: caseData.type,
        court: caseData.court,
        nameOfCase: caseData.nameOfCase,
        caseNumber: caseData.caseNumber,
        year: caseData.year,
        status: caseData.status,
        attorneyNumber: caseData.attorneyNumber,
        decision: caseData.decision,
        nots: caseData.nots,
        caseDate: caseData.caseDate,
        sessiondate: caseData.sessiondate,
        opponents: caseData.opponents || [],
        files: finalFileUrls,
        financialInfo: financialInfo,
      };

      const response = await fetch(`${API_BASE_URL}/cases/${caseId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify(updatedCasePayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "فشل تحديث الدعوى");
      }

      const result = await response.json();

      if (result.success) {
        showMessage("تم تحديث الدعوى بنجاح!", "success");
        setNewFilesToUpload([]);
        router.back();
      } else {
        throw new Error(result.message || "فشل في تحديث الدعوى");
      }
    } catch (err: any) {
      console.error("Error updating case:", err);
      showMessage(err.message || "حدث خطأ أثناء تحديث الدعوى", "error");
    } finally {
      setIsSaving(false);
    }
  }, [
    caseId,
    session,
    uploadNewFilesToCloudinary,
    existingFiles,
    selectedClient,
    caseData,
    financialInfo,
    router,
    status,
    showMessage
  ]);

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <ActivityIndicator size="large" className="text-blue-600 dark:text-blue-400" />
        <span className="text-blue-600 text-lg ml-3 dark:text-blue-400">
          جاري تحميل تفاصيل الدعوى...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 p-4 dark:bg-red-950 dark:text-red-100">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <AlertCircle className="h-12 w-12 text-red-500 dark:text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-700 dark:text-red-200 mb-2">
            حدث خطأ
          </h2>
          <p className="text-red-600 dark:text-red-300 mb-6">{error}</p>
          <button
            onClick={fetchCaseDetails}
            disabled={loading}
            className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="h-4 w-4" />
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  const paymentStatus = getPaymentStatus();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-800 dark:to-blue-950 px-6 py-6 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full text-white hover:bg-blue-700 dark:hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">
            تعديل الدعوى القضائية
          </h1>
          <div className="w-10"></div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
          {/* معلومات الموكل */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              الموكل
            </label>
            <select
              value={selectedClient || ""}
              onChange={handleClientChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
            >
              <option value="">اختر موكلاً</option>
              {clients.map((client) => (
                <option key={client._id} value={client._id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          {/* بيانات الدعوى الأساسية */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                رقم الدعوى
              </label>
              <input
                type="text"
                name="caseNumber"
                value={caseData.caseNumber || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                حالة الدعوى
              </label>
              <select
                name="status"
                value={caseData.status || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
              >
                {caseStatusOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                نوع الدعوى
              </label>
              <select
                name="caseTypeOF"
                value={caseData.caseTypeOF || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
              >
                {caseTypeOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                التصنيف
              </label>
              <select
                name="type"
                value={caseData.type || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
              >
                {typeOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                المحكمة
              </label>
              <input
                type="text"
                name="court"
                value={caseData.court || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                مسمى الدعوى
              </label>
              <input
                type="text"
                name="nameOfCase"
                value={caseData.nameOfCase || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                السنة
              </label>
              <input
                type="text"
                name="year"
                value={caseData.year || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                رقم التوكيل
              </label>
              <input
                type="text"
                name="attorneyNumber"
                value={caseData.attorneyNumber || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
              />
            </div>
          </div>

          {/* التواريخ */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                تاريخ الدعوى
              </label>
              <input
                type="date"
                name="caseDate"
                value={caseData.caseDate ? new Date(caseData.caseDate).toISOString().split("T")[0] : ""}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                تاريخ الجلسة
              </label>
              <input
                type="date"
                name="sessiondate"
                value={caseData.sessiondate ? new Date(caseData.sessiondate).toISOString().split("T")[0] : ""}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
              />
            </div>
          </div>

          {/* القرار والملاحظات */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              القرار
            </label>
            <textarea
              name="decision"
              value={caseData.decision || ""}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              ملاحظات
            </label>
            <textarea
              name="nots"
              value={caseData.nots || ""}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
            />
          </div>

          {/* الخصوم */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              الخصوم (افصل بفاصلة)
            </label>
            <input
              type="text"
              name="opponents"
              value={caseData.opponents ? caseData.opponents.join(", ") : ""}
              onChange={(e) =>
                setCaseData((prev) => ({
                  ...prev,
                  opponents: e.target.value.split(",").map((s) => s.trim()),
                }))
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
            />
          </div>

          {/* البيانات المالية */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-800 dark:text-gray-200">
              <DollarSign className="h-6 w-6" />
              البيانات المالية
            </h2>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  إجمالي الأتعاب
                </label>
                <input
                  type="number"
                  value={financialInfo.fees || ""}
                  onChange={(e) =>
                    setFinancialInfo({ ...financialInfo, fees: Number(e.target.value) })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  العملة
                </label>
                <select
                  value={financialInfo.currency}
                  onChange={(e) =>
                    setFinancialInfo({ ...financialInfo, currency: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                >
                  {CURRENCIES.map((curr) => (
                    <option key={curr.value} value={curr.value}>
                      {curr.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* الملخص المالي */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-gray-600 dark:text-gray-400">المدفوع</p>
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {financialInfo.paidAmount} {financialInfo.currency}
                </p>
              </div>

              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-gray-600 dark:text-gray-400">المتبقي</p>
                <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                  {financialInfo.fees - financialInfo.paidAmount} {financialInfo.currency}
                </p>
              </div>

              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm text-gray-600 dark:text-gray-400">حالة الدفع</p>
                <p className={`text-xl font-bold ${paymentStatus.color}`}>
                  {paymentStatus.text}
                </p>
              </div>
            </div>

            {/* إضافة دفعة */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-gray-50 dark:bg-gray-900/50 mb-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2 text-gray-800 dark:text-gray-200">
                <CreditCard className="h-5 w-5" />
                إضافة دفعة جديدة
              </h3>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <input
                  type="number"
                  placeholder="المبلغ"
                  value={newPayment.amount || ""}
                  onChange={(e) => setNewPayment({ ...newPayment, amount: Number(e.target.value) })}
                  className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                />
                <input
                  type="date"
                  value={newPayment.date}
                  onChange={(e) => setNewPayment({ ...newPayment, date: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                />
                <select
                  value={newPayment.method}
                  onChange={(e) => setNewPayment({ ...newPayment, method: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                >
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
                <input
                  placeholder="ملاحظة (اختياري)"
                  value={newPayment.note}
                  onChange={(e) => setNewPayment({ ...newPayment, note: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                />
              </div>
              <button
                type="button"
                onClick={handleAddPayment}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center gap-2"
              >
                <PlusCircle className="h-5 w-5" />
                إضافة الدفعة
              </button>
            </div>

            {/* سجل المدفوعات */}
            {financialInfo.payments.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">سجل المدفوعات</h3>
                {financialInfo.payments.map((payment, index) => (
                  <div key={index} className="flex justify-between items-center p-4 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-lg text-gray-800 dark:text-gray-200">
                          {payment.amount} {financialInfo.currency}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded">
                          {payment.method}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(payment.date).toLocaleDateString("ar-EG")}
                        </span>
                      </div>
                      {payment.note && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{payment.note}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemovePayment(index)}
                      className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="حذف الدفعة"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* إدارة الملفات */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
            <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-gray-200">
              إدارة الملفات
            </h2>
            
            <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center bg-gray-50 dark:bg-gray-900/30">
              <label htmlFor="file-upload" className="cursor-pointer">
                <UploadCloud className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
                  اسحب الملفات وأفلتها هنا أو{" "}
                  <span className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                    تصفح
                  </span>
                </span>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  multiple
                  className="sr-only"
                  onChange={handleFileChange}
                />
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                PDF, DOC, DOCX, JPG, PNG, GIF (حتى 10MB)
              </p>

              {/* Display new files to upload */}
              {newFilesToUpload.length > 0 && (
                <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3 text-right">
                    ملفات جديدة للتحميل:
                  </p>
                  <ul className="space-y-2">
                    {newFilesToUpload.map((file, index) => (
                      <li
                        key={file.name + index}
                        className="flex items-center justify-between bg-white dark:bg-gray-700 p-3 rounded-md border border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex items-center">
                          {file.type.startsWith("image/") ? (
                            <Image className="h-5 w-5 mr-2 text-blue-500" />
                          ) : (
                            <File className="h-5 w-5 mr-2 text-gray-500" />
                          )}
                          <span className="text-sm text-gray-700 dark:text-gray-200">
                            {file.name}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeNewFile(file)}
                          className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                          title="إزالة ملف"
                        >
                          <XCircle className="h-5 w-5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Display existing files */}
              {existingFiles.length > 0 && (
                <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3 text-right">
                    الملفات الحالية:
                  </p>
                  <ul className="space-y-2">
                    {existingFiles.map((fileUrl) => (
                      <li
                        key={fileUrl}
                        className="flex items-center justify-between bg-white dark:bg-gray-700 p-3 rounded-md border border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex items-center">
                          {fileUrl.match(/\.(jpeg|jpg|gif|png)$/) != null ? (
                            <Image className="h-5 w-5 mr-2 text-blue-500" />
                          ) : (
                            <File className="h-5 w-5 mr-2 text-gray-500" />
                          )}
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                          >
                            {fileUrl.substring(fileUrl.lastIndexOf("/") + 1)}
                          </a>
                        </div>
                        <button
                          type="button"
                          onClick={() => openDeleteFileModal(fileUrl)}
                          className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                          title="حذف ملف"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-3 px-8 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving && (
                <ActivityIndicator size="small" className="text-white" />
              )}
              حفظ التعديلات
            </button>
          </div>
        </form>
      </div>

      {/* Delete File Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteFileModalOpen}
        message={`هل أنت متأكد أنك تريد حذف الملف "${fileToDelete?.substring(
          fileToDelete?.lastIndexOf("/") + 1
        )}"؟ سيتم حذف الملف نهائياً من التخزين السحابي.`}
        onConfirm={handleDeleteExistingFile}
        onCancel={closeDeleteFileModal}
        isLoading={isDeletingFile}
      />
    </div>
  );
}