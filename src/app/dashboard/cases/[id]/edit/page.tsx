/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/rules-of-hooks */
"use client";

import React, { use, useState, useEffect, useMemo, useCallback } from "react"; // Added 'use' import
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
} from "lucide-react";
// import { useSession } from "next-auth/react"; // Commented out due to environment compilation issues
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// --- START MOCK for next-auth/react (for environment compatibility) ---
// In a real Next.js application, you would use the actual `useSession` hook.
const mockUseSession = () => {
  // Simulate an authenticated session with a dummy token
  const [status, setStatus] = useState<
    "loading" | "authenticated" | "unauthenticated"
  >("loading");
  const [session, setSession] = useState<any>(null);
  useEffect(() => {
    // Simulate API call or session check delay
    const timer = setTimeout(() => {
      setStatus("authenticated");
      setSession({
        user: { name: "Mock User", email: "mock@example.com" },
        accessToken: "mock_access_token_12345", // Provide a dummy token for API calls
        expires: new Date(Date.now() + 3600 * 1000).toISOString(), // 1 hour from now
      });
    }, 100); // Short delay to simulate async behavior

    // For debugging, you can also simulate an unauthenticated state by uncommenting below:
    // const timer = setTimeout(() => {
    //   setStatus('unauthenticated');
    //   setSession(null);
    // }, 100);

    return () => clearTimeout(timer);
  }, []);

  console.log("Mock Session Status:", status);
  console.log("Mock Session Data:", session);

  return { data: session, status };
};

// Use the mock hook in this environment
const useSession = mockUseSession;
// --- END MOCK ---

// Base URL for API calls
const API_BASE_URL = "/api";

// CaseDetails Interface for type safety
interface CaseDetails {
  _id: string;
  client?: { _id: string; name: string } | null;
  caseTypeOF: string;
  type: string;
  court: string;
  caseNumber: string;
  year: string;
  nameOfCase:string;
  attorneyNumber: string;
  decision: string;
  status: string;
  nots: string;
  caseDate: string;
  sessiondate: string;
  opponents: string[];
  files: string[];
  createdAt: string;
  updatedAt: string;
}

interface Client {
  _id: string;
  name: string;
}

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
  // Use React.use to unwrap the params Promise if it's a Promise
  const unwrappedParams = use(params);
  const caseId = unwrappedParams.id;
  const router = useRouter();

  // Authentication session
  const { data: session, status } = useSession();

  // Component states
  const [caseData, setCaseData] = useState<Partial<CaseDetails>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);

  // File management states
  const [existingFiles, setExistingFiles] = useState<string[]>([]);
  const [newFilesToUpload, setNewFilesToUpload] = useState<File[]>([]);

  // Modals
  const [isDeleteFileModalOpen, setIsDeleteFileModalOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [isDeletingFile, setIsDeletingFile] = useState(false);

  // Memoized case types and types of cases for dropdowns
  const caseTypeOptions = useMemo(
    () => ["مدني", "جنائي", "إداري", "أحوال شخصية", "تجاري", "عمالي"],
    []
  );
  const typeOptions = useMemo(() => ["ابتدائي", "استئناف", "نقض", "تنفيذ"], []);
  const caseStatusOptions = useMemo(
    () => ["مفتوحة", "مغلقة", "مؤجلة", "استئناف", "مشطوبة"],
    []
  );

  // Function to show toast messages
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

  // Fetch all clients for the dropdown
  const fetchClients = useCallback(async () => {
    if (status === "loading") {
      console.log("Clients fetch: Session still loading, skipping.");
      return;
    }
    if (status === "unauthenticated" || !session?.accessToken) {
      console.warn(
        "Clients fetch: User unauthenticated or no access token. Skipping fetch."
      );
      setClients([]);
      return;
    }
    try {
      console.log("Clients fetch: Attempting to fetch clients...");
      const response = await fetch(`${API_BASE_URL}/clients`, {
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success && data.data) {
        setClients(data.data);
        console.log("Clients fetched successfully:", data.data.length);
      } else {
        setClients([]);
        console.log(
          "Clients fetch: API response indicated no success or data."
        );
      }
    } catch (err: any) {
      console.error("Error fetching clients:", err);
      showMessage("فشل جلب قائمة الموكلين.", "error");
    }
  }, [status, session, showMessage]);

  // Fetch case details by ID
  const fetchCaseDetails = useCallback(async () => {
    // Only attempt to fetch if session status is resolved and caseId is available
    if (!caseId || status === "loading") {
      console.log(
        `Case details fetch: Skipping. caseId=${caseId}, status=${status}`
      );
      return;
    }

    if (status === "unauthenticated" || !session?.accessToken) {
      setError("غير مصرح لك بعرض هذه البيانات. يرجى تسجيل الدخول.");
      setLoading(false);
      console.warn(
        "Case details fetch: User unauthenticated or no access token. Skipping fetch."
      );
      return;
    }
    setLoading(true);
    setError(null);
    console.log(
      `Case details fetch: Attempting to fetch case details for ID: ${caseId}`
    );
    try {
      const response = await fetch(`${API_BASE_URL}/cases/${caseId}`, {
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }
      const result = await response.json();
      if (result.success && result.data) {
        setCaseData(result.data);
        setExistingFiles(result.data.files || []);
        setSelectedClient(result.data.client?._id || null);
        console.log("Case details fetched successfully:", result.data);
      } else {
        throw new Error(result.message || "فشل في جلب بيانات الدعوى");
      }
    } catch (err: any) {
      console.error("Error fetching case details:", err);
      const errorMessage = err.message.includes("Failed to fetch")
        ? "تعذر الاتصال بالخادم. تحقق من اتصال الإنترنت."
        : err.message || "حدث خطأ أثناء جلب تفاصيل الدعوى.";
      setError(errorMessage);
    } finally {
      setLoading(false);
      console.log("Case details fetch: Finished. Loading state set to false.");
    }
  }, [caseId, status, session]);

  // Initial data fetch on component mount and when session status changes
  useEffect(() => {
    if (status !== "loading") {
      // Only fetch when session status is resolved
      fetchClients();
      fetchCaseDetails();
    }
  }, [fetchClients, fetchCaseDetails, status]);

  // Handle form field changes
  const handleChange = useCallback(
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >
    ) => {
      const { name, value } = e.target;
      setCaseData((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  // Handle client selection change
  const handleClientChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setSelectedClient(e.target.value);
    },
    []
  );

  // Handle file selection (new files to upload)
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        setNewFilesToUpload((prev) =>
          e.target.files ? [...prev, ...Array.from(e.target.files)] : prev
        );
      }
    },
    []
  );

  // Remove a newly selected file before upload
  const removeNewFile = useCallback((fileToRemove: File) => {
    setNewFilesToUpload((prev) => prev.filter((file) => file !== fileToRemove));
  }, []);

  // Open modal to confirm deletion of an existing file
  const openDeleteFileModal = useCallback((fileUrl: string) => {
    setFileToDelete(fileUrl);
    setIsDeleteFileModalOpen(true);
  }, []);

  // Close file deletion modal
  const closeDeleteFileModal = useCallback(() => {
    setIsDeleteFileModalOpen(false);
    setFileToDelete(null);
  }, []);

  // Extract public_id from Cloudinary URL
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

  // Handle deleting an existing file
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
      console.log(
        `File ${fileToDelete} deleted from Cloudinary and removed from state.`
      );
    } catch (err: any) {
      console.error("Error deleting file from Cloudinary:", err);
      showMessage(err.message || "فشل حذف الملف من Cloudinary.", "error");
    } finally {
      setIsDeletingFile(false);
      closeDeleteFileModal();
    }
  }, [
    fileToDelete,
    extractPublicId,
    session,
    showMessage,
    closeDeleteFileModal,
  ]);

  // Upload new files to Cloudinary
  const uploadNewFilesToCloudinary = useCallback(async (): Promise<
    string[]
  > => {
    if (newFilesToUpload.length === 0) return [];

    const uploadedUrls: string[] = [];
    console.log(
      `Uploading ${newFilesToUpload.length} new files to Cloudinary.`
    );

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
          const errorData = await response.json();
          throw new Error(
            errorData.message ||
              `فشل تحميل الملف ${file.name} (Status: ${response.status})`
          );
        }

        const data = await response.json();
        uploadedUrls.push(data.url);
        showMessage(`تم تحميل الملف ${file.name} بنجاح.`, "success");
        console.log(`File ${file.name} uploaded successfully: ${data.url}`);
      } catch (err: any) {
        console.error("Error uploading file:", err);
        showMessage(`فشل تحميل الملف ${file.name}: ${err.message}`, "error");
      }
    }
    return uploadedUrls;
  }, [newFilesToUpload, session, showMessage]);

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!caseId) {
        showMessage("معرف الدعوى غير موجود.", "error");
        return;
      }
      if (status === "unauthenticated" || !session?.accessToken) {
        showMessage("يجب تسجيل الدخول لتعديل الدعوى.", "error");
        return;
      }

      setIsSaving(true);
      console.log("Attempting to save case details...");

      try {
        // 1. Upload new files to Cloudinary
        const newlyUploadedFileUrls = await uploadNewFilesToCloudinary();

        // 2. Combine existing files with newly uploaded files
        const finalFileUrls = [...existingFiles, ...newlyUploadedFileUrls];

        // 3. Prepare data for updating the case - متوافق مع الباك إند
        const updatedCasePayload = {
          client: selectedClient || null,
          caseTypeOF: caseData.caseTypeOF,
          type: caseData.type,
          court: caseData.court,
          nameOfCase:caseData.nameOfCase,
          caseNumber: caseData.caseNumber,
          year: caseData.year,
          status: caseData.status, // 👈 هنا الحالة
          attorneyNumber: caseData.attorneyNumber,
          decision: caseData.decision,
          nots: caseData.nots,
          caseDate: caseData.caseDate,
          sessiondate: caseData.sessiondate,
          opponents: caseData.opponents || [],
          files: finalFileUrls,
        };
        console.log("Payload for case update:", updatedCasePayload);

        // 4. Update case in the database
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
          throw new Error(
            errorData.message || `فشل تحديث الدعوى (Status: ${response.status})`
          );
        }

        const result = await response.json();

        if (result.success) {
          showMessage("تم تحديث الدعوى بنجاح!", "success");
          console.log("Case updated successfully.");
          setNewFilesToUpload([]);
          router.back();
          fetchCaseDetails(); // Re-fetch to ensure UI is in sync
        } else {
          throw new Error(result.message || "فشل في تحديث الدعوى");
        }
      } catch (err: any) {
        console.error("Error updating case:", err);
        showMessage(err.message || "حدث خطأ أثناء تحديث الدعوى.", "error");
      } finally {
        setIsSaving(false);
        console.log(
          "Finished saving case details. IsSaving state set to false."
        );
      }
    },
    [
      caseId,
      session?.accessToken,
      showMessage,
      uploadNewFilesToCloudinary,
      existingFiles,
      selectedClient,
      caseData.caseTypeOF,
      caseData.type,
      caseData.court,
      caseData.caseNumber,
      caseData.year,
      caseData.nameOfCase,
      caseData.attorneyNumber,
      caseData.decision,
      caseData.status,
      caseData.nots,
      caseData.caseDate,
      caseData.sessiondate,
      caseData.opponents,
      router,
      fetchCaseDetails,
    ]
  );

  // Navigation back
  const goBack = useCallback(() => {
    window.history.back();
  }, []);

  // Render loading/error states
  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <ActivityIndicator
          size="large"
          className="text-blue-600 dark:text-blue-400"
        />
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-800 dark:to-blue-950 px-6 py-6 flex items-center justify-between">
          <button
            onClick={goBack}
            className="p-2 rounded-full text-white hover:bg-blue-700 dark:hover:bg-blue-700 transition-colors"
            title="العودة"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white text-center flex-grow">
            تعديل الدعوى القضائية
          </h1>
          <div className="w-10"></div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          {/* Client Selection */}
          <div>
            <label
              htmlFor="client"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              الموكل
            </label>
            <select
              id="client"
              name="client"
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

          {/* Case Number */}
          <div>
            <label
              htmlFor="caseNumber"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              رقم الدعوى
            </label>
            <input
              type="text"
              id="caseNumber"
              name="caseNumber"
              value={caseData.caseNumber || ""}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
              required
            />
          </div>

          {/* Case Type OF */}
          <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              حالة الدعوى
            </label>
            <select
              id="status"
              name="status"
              value={caseData.status || ""}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
              required
            >
              <option value="">اختر حالة الدعوى</option>
              {caseStatusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="caseTypeOF"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              نوع الدعوى
            </label>
            <select
              id="caseTypeOF"
              name="caseTypeOF"
              value={caseData.caseTypeOF || ""}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
              required
            >
              <option value="">اختر نوع الدعوى</option>
              {caseTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {/* Type (Classification) */}
          <div>
            <label
              htmlFor="type"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              التصنيف
            </label>
            <select
              id="type"
              name="type"
              value={caseData.type || ""}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
              required
            >
              <option value="">اختر التصنيف</option>
              {typeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {/* Court */}
          <div>
            <label
              htmlFor="court"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              المحكمة
            </label>
            <input
              type="text"
              id="court"
              name="court"
              value={caseData.court || ""}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
              required
            />
          </div>
          {/* nameOfCase */}
          <div>
            <label
              htmlFor="nameOfCase"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              المحكمة
            </label>
            <input
              type="text"
              id="nameOfCase"
              name="nameOfCase"
              value={caseData.nameOfCase || ""}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
              required
            />
          </div>

          {/* Year */}
          <div>
            <label
              htmlFor="year"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              السنة
            </label>
            <input
              type="text"
              id="year"
              name="year"
              value={caseData.year || ""}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
            />
          </div>

          {/* Attorney Number */}
          <div>
            <label
              htmlFor="attorneyNumber"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              رقم التوكيل
            </label>
            <input
              type="text"
              id="attorneyNumber"
              name="attorneyNumber"
              value={caseData.attorneyNumber || ""}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
            />
          </div>

          {/* Decision */}
          <div>
            <label
              htmlFor="decision"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              القرار
            </label>
            <textarea
              id="decision"
              name="decision"
              value={caseData.decision || ""}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
            ></textarea>
          </div>

          {/* Notes */}
          <div>
            <label
              htmlFor="nots"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              ملاحظات
            </label>
            <textarea
              id="nots"
              name="nots"
              value={caseData.nots || ""}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
            ></textarea>
          </div>

          {/* Case Date */}
          <div>
            <label
              htmlFor="caseDate"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              تاريخ الدعوى
            </label>
            <input
              type="date"
              id="caseDate"
              name="caseDate"
              value={
                caseData.caseDate
                  ? new Date(caseData.caseDate).toISOString().split("T")[0]
                  : ""
              }
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
            />
          </div>

          {/* Session Date */}
          <div>
            <label
              htmlFor="sessiondate"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              تاريخ الجلسة
            </label>
            <input
              type="date"
              id="sessiondate"
              name="sessiondate"
              value={
                caseData.sessiondate
                  ? new Date(caseData.sessiondate).toISOString().split("T")[0]
                  : ""
              }
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
            />
          </div>

          {/* Opponents */}
          <div>
            <label
              htmlFor="opponents"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              الخصوم (افصل بفاصلة)
            </label>
            <input
              type="text"
              id="opponents"
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

          {/* File Upload Section */}
          <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
            <label htmlFor="file-upload" className="cursor-pointer">
              <UploadCloud className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
              <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
                اسحب الملفات وأفلتها هنا أو{" "}
                <span className="text-blue-600 hover:text-blue-800">تصفح</span>
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
                      className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded-md"
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
                        className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900"
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
                      className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded-md"
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
                        className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900"
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

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
          fileToDelete.lastIndexOf("/") + 1
        )}"؟ سيتم حذف الملف نهائياً من التخزين السحابي.`}
        onConfirm={handleDeleteExistingFile}
        onCancel={closeDeleteFileModal}
        isLoading={isDeletingFile}
      />
    </div>
  );
}
