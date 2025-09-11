/* eslint-disable prefer-const */
/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
// import { useRouter } from "next/navigation"; // Commented out due to environment compilation issues
// import { useSession } from "next-auth/react"; // Commented out due to environment compatibility issues
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  ArrowLeft,
  FileText,
  UserCog,
  CalendarDays,
  Scale,
  PlusCircle,
  XCircle,
  Loader2,
  Trash2,
  Database,
  Gavel,
  Shield,
  Hash,
  Clock,
  Briefcase,
  CalendarClock,
  Users,
  CloudUpload,
  Rocket,
  Book,
  StickyNote,
  ArrowRight,
  ChartColumnBig, // Added ArrowRight for Next button
} from "lucide-react";

// --- START MOCK for next-auth/react (for environment compatibility) ---
// In a real Next.js application, you would use the actual `useSession` hook.
const mockUseSession = () => {
  const [status, setStatus] = useState<
    "loading" | "authenticated" | "unauthenticated"
  >("loading");
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setStatus("authenticated");
      setSession({
        user: {
          id: "mock_user_id_12345",
          name: "Mock User",
          email: "mock@example.com",
        },
        accessToken: "mock_access_token_12345",
        expires: new Date(Date.now() + 3600 * 1000).toISOString(),
      });
    }, 100);
    return () => clearTimeout(timer);
  }, []);
  return { data: session, status };
};

const useSession = mockUseSession;
// --- END MOCK ---

// --- START MOCK for useRouter (for environment compatibility) ---
// In a real Next.js application, you would use the actual `useRouter` hook from 'next/navigation'.
const mockUseRouter = () => {
  const router = React.useMemo(
    () => ({
      push: (path: string) => {
        console.log(`Mock Router.push: Navigating to ${path}`);
        // window.location.href = path; // For actual navigation in a browser context
      },
      back: () => {
        console.log("Mock Router.back: Simulating browser back action.");
        window.history.back();
      },
    }),
    []
  );
  return router;
};

const useRouter = mockUseRouter;
// --- END MOCK ---

// --- START INLINE ActivityIndicator (if external component not resolved) ---
// If "@/components/ui/activity-indicator" cannot be resolved, this inline version will be used.
type SizeType = "small" | "medium" | "large";

const ActivityIndicator = ({
  size = "medium" as SizeType,
  className = "text-blue-500",
}: {
  size?: SizeType;
  className?: string;
}) => {
  const sizeClasses = {
    small: "h-4 w-4",
    medium: "h-8 w-8",
    large: "h-12 w-12",
  };
  return (
    <Loader2 className={`animate-spin ${sizeClasses[size]} ${className}`} />
  );
};
// --- END INLINE ActivityIndicator ---

// Custom FileStack SVG icon (since Lucide doesn't have a direct equivalent)
const FileStack = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    <path d="M8 12h8" />
    <path d="M8 16h8" />
  </svg>
);

// Fix: Dynamically set API_BASE_URL to ensure a valid URL is constructed
const API_BASE_URL =
  typeof window !== "undefined" ? `${window.location.origin}/api` : "/api";

interface Client {
  _id: string;
  name: string;
}

interface FormData {
  client: string;
  caseTypeOF: string;
  type: string;
  court: string;
  caseNumber: string;
  year: string;
  attorneyNumber: string;
  decision: string;
  nots: string;
  status: string;
  caseDate: string;
  sessiondate: string;
  opponents: string[];
  files: string[]; // This will now store URLs of uploaded files
}

export default function AddCasePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Memoized case types and types of cases for dropdowns
  const caseTypeOptions = useMemo(() => ["مدني", "جنائي", "إداري", "أحوال شخصية", "تجاري", "عمالي"], []);
  const typeOptions = useMemo(() => ["ابتدائي", "استئناف", "نقض", "تنفيذ"], []);
const caseStatusOptions = useMemo(() => ["مفتوحة", "مغلقة", "مؤجلة", "استئناف","مشطوبة"], []);
  const [formData, setFormData] = useState<FormData>({
    client: "",
    caseTypeOF: "",
    type: "",
    court: "",
    caseNumber: "",
    caseDate: new Date().toISOString().split("T")[0],
    year: new Date().getFullYear().toString(),
    attorneyNumber: "",
    decision: "",
    status: "مفتوحة",
    nots: "",
    sessiondate: new Date().toISOString().split("T")[0],
    opponents: [],
    files: [], // This will store URLs of uploaded files *after* submission
  });

  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isClientsLoading, setIsClientsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]); // Handles multiple file selection
  const [uploadingDuringSubmit, setUploadingDuringSubmit] = useState(false);
  const [newOpponent, setNewOpponent] = useState("");
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({}); // State for validation errors
  const [activeTab, setActiveTab] = useState("basic"); // State for active tab

  const fetchClients = useCallback(async () => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }

    setIsClientsLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${API_BASE_URL}/clients`, {
        headers: {
          Authorization: `Bearer ${session?.user?.id}`,
          "Content-Type": "application/json",
        },
      });

      if (response.data?.success) {
        setClients(response.data.data || []);
      } else {
        throw new Error(response.data?.message || "فشل في جلب قائمة الموكلين");
      }
      router.push("/auth/login");
    } catch (err: any) {
      console.error("Error fetching clients:", err);
      const errorMessage =
        err.response?.data?.message || err.message || "خطأ غير معروف";
      setError(`فشل في جلب قائمة الموكلين: ${errorMessage}`);
      toast.error(`فشل في جلب قائمة الموكلين: ${errorMessage}`);
    } finally {
      setIsClientsLoading(false);
    }
  }, [session?.user?.id, status, router]);

  useEffect(() => {
    if (status !== "loading") {
      fetchClients();
    }
  }, [fetchClients, status]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
      // Clear validation error for this field when it changes
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    },
    []
  );

  const handleSelectChange = useCallback((name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear validation error for this field when it changes
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      const validFiles = files.filter((file) => file.size <= 10 * 1024 * 1024);
      const invalidFiles = files.filter((file) => file.size > 10 * 1024 * 1024);

      if (invalidFiles.length > 0) {
        invalidFiles.forEach((file) => {
          toast.error(
            `الملف "${file.name}" يتجاوز الحد الأقصى للحجم (10MB) وسيتم تجاهله.`
          );
        });
      }

      setSelectedFiles((prev) => [...prev, ...validFiles]);
      e.target.value = ""; // Clear input for re-selection
    },
    []
  );

  const handleRemoveSelectedFile = useCallback(
    (indexToRemove: number) => {
      const removedFileName = selectedFiles[indexToRemove].name;
      setSelectedFiles((prev) =>
        prev.filter((_, index) => index !== indexToRemove)
      );
      toast.info(`تم إزالة الملف "${removedFileName}" من قائمة الرفع.`);
    },
    [selectedFiles]
  );

  const handleAddOpponent = useCallback(() => {
    if (newOpponent.trim() === "") {
      toast.error("لا يمكن إضافة خصم فارغ.");
      return;
    }
    if (formData.opponents.includes(newOpponent.trim())) {
      toast.warning("هذا الخصم موجود بالفعل.");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      opponents: [...prev.opponents, newOpponent.trim()],
    }));
    setNewOpponent("");
    toast.success(`تم إضافة الخصم "${newOpponent.trim()}"`);
  }, [newOpponent, formData.opponents]);

  const handleRemoveOpponent = useCallback(
    (indexToRemove: number) => {
      const removedOpponentName = formData.opponents[indexToRemove];
      setFormData((prev) => ({
        ...prev,
        opponents: prev.opponents.filter((_, index) => index !== indexToRemove),
      }));
      toast.info(`تم إزالة الخصم "${removedOpponentName}"`);
    },
    [formData.opponents]
  );

  const uploadFileToCloudinary = async (file: File): Promise<string | null> => {
    const CLOUDINARY_UPLOAD_PRESET =
      process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

    if (!CLOUDINARY_UPLOAD_PRESET || !CLOUDINARY_CLOUD_NAME) {
      toast.error(
        "إعدادات Cloudinary غير موجودة أو غير صحيحة. يرجى التحقق من ملف .env.local والبادئة NEXT_PUBLIC_."
      );
      console.error(
        "Cloudinary environment variables are not set or are incorrectly prefixed with NEXT_PUBLIC_."
      );
      return null;
    }

    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append("file", file);
    cloudinaryFormData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    try {
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`,
        cloudinaryFormData,
        {
          timeout: 30000, // 30 seconds timeout per file
        }
      );

      return response.data?.secure_url || null;
    } catch (err: any) {
      const errorDetail =
        err.response?.data || err.message || JSON.stringify(err);
      console.error(
        `Error uploading file ${file.name} to Cloudinary:`,
        errorDetail
      );
      if (!err.response?.data && !err.message) {
        console.error(
          "Potential Cloudinary configuration issue: err.response.data and err.message are empty. Please ensure CLOUDINARY_CLOUD_NAME and CLOUDINARY_UPLOAD_PRESET are correctly set and prefixed with NEXT_PUBLIC_."
        );
      }
      toast.error(`فشل في رفع الملف ${file.name}. يرجى المحاولة مرة أخرى.`);
      return null;
    }
  };

  // Centralized validation function
  const validateForm = useCallback(
    (fieldsToValidate?: (keyof FormData)[]): boolean => {
      let currentErrors: Record<string, string> = {};
      const allRequiredFields: (keyof FormData)[] = [
        "client",
        "caseTypeOF",
        "type",
        "court",
        "caseNumber",
        "year",
        "attorneyNumber",
      ];

      // Determine which fields to check
      const fieldsToCheck = fieldsToValidate || allRequiredFields;

      // Validate required fields among those to check
      for (const field of fieldsToCheck) {
        if (allRequiredFields.includes(field)) {
          // Only validate if it's a globally required field
          const value = formData[field];
          if (!value || (typeof value === "string" && !value.trim())) {
            currentErrors[field] = "هذا الحقل مطلوب.";
          }
        }
      }

      // Validate dates if they are among fieldsToCheck
      const caseDateObj = new Date(formData.caseDate);
      const sessionDateObj = new Date(formData.sessiondate);

      if (
        fieldsToCheck.includes("caseDate") &&
        formData.caseDate &&
        isNaN(caseDateObj.getTime())
      ) {
        currentErrors.caseDate = "تاريخ الدعوى غير صالح.";
      }
      if (
        fieldsToCheck.includes("sessiondate") &&
        formData.sessiondate &&
        isNaN(sessionDateObj.getTime())
      ) {
        currentErrors.sessiondate = "تاريخ الجلسة غير صالح.";
      }

      // Date comparison only if both are valid and being checked
      if (
        fieldsToCheck.includes("caseDate") &&
        fieldsToCheck.includes("sessiondate") &&
        formData.caseDate &&
        !isNaN(caseDateObj.getTime()) &&
        formData.sessiondate &&
        !isNaN(sessionDateObj.getTime())
      ) {
        if (sessionDateObj < caseDateObj) {
          currentErrors.sessiondate =
            "يجب أن يكون تاريخ الجلسة بعد تاريخ الدعوى.";
        }
      }

      // Update validation state by merging new errors
      setValidationErrors((prevErrors) => {
        const newErrors = { ...prevErrors };
        // Clear errors for fields that were checked and are now valid
        fieldsToCheck.forEach((field) => {
          if (!currentErrors[field]) {
            delete newErrors[field];
          }
        });
        // Add new errors found
        Object.assign(newErrors, currentErrors);
        return newErrors;
      });

      return Object.keys(currentErrors).length === 0; // Return true if no errors
    },
    [formData]
  );

  const handleNextTab = useCallback(() => {
    let currentTabFields: (keyof FormData)[] = [];
    let nextTab: string = "";

    if (activeTab === "basic") {
      currentTabFields = [
        "client",
        "caseTypeOF",
        "type",
        "court",
        "caseNumber",
        "year",
      ];
      nextTab = "details";
    } else if (activeTab === "details") {
      currentTabFields = ["attorneyNumber", "caseDate", "sessiondate"]; // decision and nots are optional
      nextTab = "attachments";
    } else {
      // This case should ideally not be reached if button is hidden
      return;
    }

    const isValid = validateForm(currentTabFields);

    if (isValid) {
      setActiveTab(nextTab);
    } else {
      toast.error("يرجى تصحيح الأخطاء في الحقول الحالية قبل المتابعة.");
    }
  }, [activeTab, validateForm]);

  const handleSubmit = useCallback(async () => {
    // Changed to be called directly from button
    if (!session?.user?.id) {
      toast.error("لا توجد صلاحية لإضافة دعوى. يرجى تسجيل الدخول");
      return;
    }

    // Validate all fields before final submission
    const isValid = validateForm();
    if (!isValid) {
      toast.error("يرجى تصحيح الأخطاء في النموذج قبل الحفظ.");
      // Optional: Navigate to the first tab with an error for better UX
      if (
        validationErrors.client ||
        validationErrors.caseTypeOF ||
        validationErrors.type ||
        validationErrors.court ||
        validationErrors.caseNumber ||
        validationErrors.year
      ) {
        setActiveTab("basic");
      } else if (
        validationErrors.attorneyNumber ||
        validationErrors.caseDate ||
        validationErrors.sessiondate ||
        validationErrors.decision ||
        validationErrors.nots
      ) {
        setActiveTab("details");
      }
      return;
    }

    setIsLoading(true);
    setError(null);
    setUploadingDuringSubmit(true);

    try {
      const uploadedFileUrls: string[] = [];

      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const uploadedUrl = await uploadFileToCloudinary(file);
          if (uploadedUrl) {
            uploadedFileUrls.push(uploadedUrl);
          } else {
            console.warn(
              `Failed to upload ${file.name}. Continuing with other files.`
            );
          }
        }
      }

      const finalFilesArray = [...formData.files, ...uploadedFileUrls];

      const payload = {
        ...formData,
        opponents: formData.opponents,
        files: finalFilesArray,
      };

      const response = await axios.post(`${API_BASE_URL}/cases`, payload, {
        headers: {
          Authorization: `Bearer ${session.user.id}`,
          "Content-Type": "application/json",
        },
        timeout: 60000,
      });

      if (response.data?.success) {
        toast.success("تم إضافة الدعوى بنجاح!");
        setSelectedFiles([]);
        setFormData({
          // Reset form to initial empty state
          client: "",
          caseTypeOF: "",
          type: "",
          court: "",
          status: "مفتوحة",
          caseNumber: "",
          caseDate: new Date().toISOString().split("T")[0],
          year: new Date().getFullYear().toString(),
          attorneyNumber: "",
          decision: "",
          nots: "",
          sessiondate: new Date().toISOString().split("T")[0],
          opponents: [],
          files: [],
        });
        setNewOpponent("");
        setValidationErrors({});
        setActiveTab("basic"); // Reset to first tab
        router.push("/dashboard/all-cases");
      } else {
        throw new Error(response.data?.message || "فشل في إضافة الدعوى");
      }
    } catch (err: any) {
      console.error("Error adding case:", err.response?.data || err.message);
      const errorMessage =
        err.response?.data?.message || err.message || "خطأ غير معروف";
      toast.error(`فشل في إضافة الدعوى: ${errorMessage}`);
      setError(`فشل في إضافة الدعوى: ${errorMessage}`);
    } finally {
      setIsLoading(false);
      setUploadingDuringSubmit(false);
    }
  }, [
    session?.user?.id,
    validateForm,
    selectedFiles,
    formData,
    uploadFileToCloudinary,
    router,
    validationErrors, // Included for error tab navigation logic
  ]);

  if (status === "loading" || isClientsLoading) {
    return (
      <div className="flex flex-1 items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-950 dark:to-gray-800">
        <div className="flex flex-col items-center space-y-4">
          <ActivityIndicator
            size="large"
            className="text-blue-500 dark:text-blue-400"
          />
          <p className="text-lg text-gray-700 dark:text-gray-300">
            جاري تحميل البيانات...
          </p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex flex-1 items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-950 dark:to-gray-800">
        <p className="text-gray-700 dark:text-gray-300">
          جاري التحويل لصفحة تسجيل الدخول...
        </p>
      </div>
    );
  }

  if (error && clients.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center h-screen bg-red-100 text-red-700 p-4 rounded-lg mx-4 border border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-700">
        <p className="text-xl font-bold mb-2">خطأ:</p>
        <p className="text-lg text-center mb-4">{error}</p>
        <div className="flex space-x-4 rtl:space-x-reverse">
          <Button
            onClick={() => fetchClients()}
            variant="destructive"
            className="bg-red-600 hover:bg-red-700 text-white rounded-lg dark:bg-red-700 dark:hover:bg-red-800"
          >
            إعادة المحاولة
          </Button>
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="text-gray-700 border-gray-400 hover:bg-gray-100 rounded-lg dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            العودة
          </Button>
        </div>
      </div>
    );
  }

  // Helper function to render input fields
  const renderInputField = (
    id: keyof FormData,
    type: string,
    label: string,
    placeholder: string,
    required: boolean,
    Icon: React.ElementType // Lucide React Icon component
  ) => (
    <div className="space-y-2 relative">
      <Label
        htmlFor={id}
        className="flex items-center gap-2 mb-2 text-base font-medium text-gray-700 dark:text-gray-300"
      >
        <Icon className="h-5 w-5 text-blue-500 dark:text-blue-400" />
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Input
        id={id}
        name={id}
        type={type}
        value={formData[id] as string}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        className={`h-12 rounded-lg px-4 bg-white border border-gray-300 focus:ring-2 ${
          validationErrors[id]
            ? "border-red-500 ring-red-500"
            : "focus:ring-blue-400 focus:border-blue-400"
        } text-gray-800 placeholder:text-gray-500 transition-all duration-300 shadow-sm
        dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200 dark:placeholder:text-gray-500 dark:focus:ring-blue-500 dark:focus:border-blue-500`}
        {...(id === "year" && { min: "2000", max: "2030" })} // Specific attributes for 'year'
      />
      {validationErrors[id] && (
        <p className="text-red-500 text-sm mt-1 absolute -bottom-6 right-0">
          {validationErrors[id]}
        </p>
      )}
    </div>
  );

  // Helper function to render select fields
  const renderSelectField = (
    id: keyof FormData,
    label: string,
    placeholder: string,
    required: boolean,
    Icon: React.ElementType,
    options: string[]
  ) => (
    <div className="space-y-2 relative">
      <Label
        htmlFor={id}
        className="flex items-center gap-2 mb-2 text-base font-medium text-gray-700 dark:text-gray-300"
      >
        <Icon className="h-5 w-5 text-blue-500 dark:text-blue-400" />
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Select
        onValueChange={(value) => handleSelectChange(id, value)}
        value={formData[id] as string}
      >
        <SelectTrigger
          id={id}
          className={`w-full h-12 rounded-lg px-4 bg-white border border-gray-300 ${
            validationErrors[id]
              ? "border-red-500 ring-red-500"
              : "focus:ring-blue-400 focus:border-blue-400"
          } text-gray-800 placeholder:text-gray-500 transition-all duration-300 shadow-sm
          dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200 dark:placeholder:text-gray-500 dark:focus:ring-blue-500 dark:focus:border-blue-500`}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="dark:bg-gray-800 dark:text-gray-200 border border-gray-300 rounded-lg shadow-md dark:border-gray-700">
          {options.map((option) => (
            <SelectItem
              key={option}
              value={option}
              className="hover:bg-blue-50 focus:bg-blue-50 dark:hover:bg-gray-700 dark:focus:bg-gray-700"
            >
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {validationErrors[id] && (
        <p className="text-red-500 text-sm mt-1 absolute -bottom-6 right-0">
          {validationErrors[id]}
        </p>
      )}
    </div>
  );

  return (
    <div
      className="flex flex-col p-4 md:p-8 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen text-gray-800 font-sans relative overflow-hidden
    dark:from-gray-950 dark:to-gray-800 dark:text-gray-200"
    >
      {/* Subtle background gradient and light, airy feel */}
      <div
        className="absolute inset-0 z-0 opacity-30 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-200 via-transparent to-transparent animate-pulse-light
      dark:from-indigo-900 dark:to-transparent"
      ></div>
      {/* Removed bg-noise-light for simplicity and consistent dark mode without a specific dark noise texture */}

      {/* Header */}
      <div className="relative z-10 flex items-center mb-10 max-w-5xl mx-auto">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="ml-4 rtl:mr-4 rtl:ml-0 rounded-full text-gray-500 hover:bg-gray-200 transition-colors duration-300
          dark:text-gray-400 dark:hover:bg-gray-700"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1
          className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-700 flex items-center gap-4 drop-shadow-md
        dark:from-blue-400 dark:to-indigo-500"
        >
          <Database className="h-10 w-10 text-blue-500 dark:text-blue-400" />
          نظام إدارة الدعاوى
        </h1>
      </div>

      <div className="max-w-5xl mx-auto w-full relative z-10">
        <h2 className="text-3xl font-bold flex items-center gap-2 mb-6 text-indigo-700 dark:text-indigo-300">
          <Gavel className="w-7 h-7 text-blue-500 dark:text-blue-400" />
          إضافة دعوى جديدة
        </h2>

        {/* Tabs for form sections */}
        <Tabs
          defaultValue="basic"
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList
            className="grid grid-cols-1 sm:grid-cols-3 w-full h-auto bg-blue-100/70 backdrop-blur-sm border border-blue-200 rounded-xl shadow-md p-1
          dark:bg-gray-900/70 dark:border-gray-700"
          >
            <TabsTrigger
              value="basic"
              className="py-3 px-4 flex items-center gap-2 text-lg font-semibold text-gray-700 rounded-lg transition-all duration-300
              data-[state=active]:bg-white data-[state=active]:text-blue-800 data-[state=active]:shadow-sm data-[state=active]:border-b-2 data-[state=active]:border-blue-500
              hover:bg-blue-50 hover:text-blue-700
              dark:text-gray-300 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-blue-200 dark:data-[state=active]:border-blue-400
              dark:hover:bg-gray-700 dark:hover:text-blue-300"
            >
              <FileText className="w-5 h-5" /> البيانات الأساسية
            </TabsTrigger>
            <TabsTrigger
              value="details"
              className="py-3 px-4 flex items-center gap-2 text-lg font-semibold text-gray-700 rounded-lg transition-all duration-300
              data-[state=active]:bg-white data-[state=active]:text-blue-800 data-[state=active]:shadow-sm data-[state=active]:border-b-2 data-[state=active]:border-blue-500
              hover:bg-blue-50 hover:text-blue-700
              dark:text-gray-300 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-blue-200 dark:data-[state=active]:border-blue-400
              dark:hover:bg-gray-700 dark:hover:text-blue-300"
            >
              <Book className="w-5 h-5" /> التفاصيل
            </TabsTrigger>
            <TabsTrigger
              value="attachments"
              className="py-3 px-4 flex items-center gap-2 text-lg font-semibold text-gray-700 rounded-lg transition-all duration-300
              data-[state=active]:bg-white data-[state=active]:text-blue-800 data-[state=active]:shadow-sm data-[state=active]:border-b-2 data-[state=active]:border-blue-500
              hover:bg-blue-50 hover:text-blue-700
              dark:text-gray-300 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-blue-200 dark:data-[state=active]:border-blue-400
              dark:hover:bg-gray-700 dark:hover:text-blue-300"
            >
              <Users className="w-5 h-5" /> مرفقات وخصوم
            </TabsTrigger>
          </TabsList>

          {/* تبويب 1: البيانات الأساسية */}
          <TabsContent value="basic">
            <Card
              className="bg-white/90 backdrop-blur-sm border border-gray-200 shadow-lg rounded-2xl
            dark:bg-gray-800/90 dark:border-gray-700"
            >
              <CardHeader
                className="bg-blue-50/70 border-b border-blue-200 p-6 rounded-t-2xl
              dark:bg-gray-800/70 dark:border-gray-700"
              >
                <CardTitle className="text-2xl font-bold text-blue-700 flex items-center gap-2 dark:text-blue-300">
                  <FileText className="w-6 h-6 text-blue-500 dark:text-blue-400" />{" "}
                  البيانات الأساسية للدعوى
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  املأ الحقول الأساسية للدعوى هنا.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 p-6">
                {/* Client Selection */}
                <div className="md:col-span-2 space-y-2 relative">
                  <Label
                    htmlFor="client"
                    className="flex items-center gap-2 mb-2 text-base font-medium text-gray-700 dark:text-gray-300"
                  >
                    <UserCog className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                    الموكل <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    onValueChange={(value) =>
                      handleSelectChange("client", value)
                    }
                    value={formData.client}
                  >
                    <SelectTrigger
                      id="client"
                      className={`w-full h-12 rounded-lg px-4 bg-white border border-gray-300 ${
                        validationErrors.client
                          ? "border-red-500 ring-red-500"
                          : "focus:ring-blue-400 focus:border-blue-400"
                      } text-gray-800 placeholder:text-gray-500 transition-all duration-300 shadow-sm
                    dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200 dark:placeholder:text-gray-500 dark:focus:ring-blue-500 dark:focus:border-blue-500`}
                    >
                      <SelectValue placeholder="اختر الموكل من القائمة" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-800 dark:text-gray-200 border border-gray-300 rounded-lg shadow-md dark:border-gray-700">
                      {clients.length === 0 ? (
                        <SelectItem value="no-clients" disabled>
                          لا يوجد موكلون متاحون
                        </SelectItem>
                      ) : (
                        clients.map((client) => (
                          <SelectItem
                            key={client._id}
                            value={client._id}
                            className="hover:bg-blue-50 focus:bg-blue-50 dark:hover:bg-gray-700 dark:focus:bg-gray-700"
                          >
                            {client.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {validationErrors.client && (
                    <p className="text-red-500 text-sm mt-1 absolute -bottom-6 right-0">
                      {validationErrors.client}
                    </p>
                  )}
                </div>

                {/* Case Type Selection */}
                {renderSelectField(
                  "caseTypeOF",
                  "نوع الدعوى",
                  "اختر نوع الدعوى",
                  true,
                  Gavel,
                  caseTypeOptions
                )}
                {renderSelectField(
                  "status",
                  "حالة الدعوى",
                  "اختر حالة الدعوى",
                  true,
                  ChartColumnBig ,
                  caseStatusOptions
                )}

                {/* Type Selection */}
                {renderSelectField(
                  "type",
                  "طبيعة الدعوى",
                  "اختر طبيعة الدعوى",
                  true,
                  Scale,
                  typeOptions
                )}

                {renderInputField(
                  "court",
                  "text",
                  "المحكمة",
                  "مثال: محكمة القاهرة الابتدائية",
                  true,
                  Shield
                )}
                {renderInputField(
                  "caseNumber",
                  "text",
                  "رقم الدعوى",
                  "مثال: 1234",
                  true,
                  Hash
                )}
                {renderInputField(
                  "year",
                  "number",
                  "السنة",
                  "مثال: 2024",
                  true,
                  Clock
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* تبويب 2: التفاصيل */}
          <TabsContent value="details">
            <Card
              className="bg-white/90 backdrop-blur-sm border border-gray-200 shadow-lg rounded-2xl
            dark:bg-gray-800/90 dark:border-gray-700"
            >
              <CardHeader
                className="bg-blue-50/70 border-b border-blue-200 p-6 rounded-t-2xl
              dark:bg-gray-800/70 dark:border-gray-700"
              >
                <CardTitle className="text-2xl font-bold text-blue-700 flex items-center gap-2 dark:text-blue-300">
                  <Book className="w-6 h-6 text-blue-500 dark:text-blue-400" />{" "}
                  تفاصيل ومواعيد الدعوى
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  أضف معلومات إضافية ومواعيد هامة هنا.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 p-6">
                {renderInputField(
                  "attorneyNumber",
                  "text",
                  "رقم التوكيل",
                  "مثال: 5678",
                  true,
                  Briefcase
                )}
                {renderInputField(
                  "caseDate",
                  "date",
                  "تاريخ الدعوى",
                  "",
                  false,
                  CalendarDays
                )}
                {renderInputField(
                  "sessiondate",
                  "date",
                  "تاريخ الجلسة القادمة",
                  "",
                  false,
                  CalendarClock
                )}

                <div className="md:col-span-2 space-y-2">
                  <Label
                    htmlFor="decision"
                    className="flex items-center gap-2 mb-2 text-base font-medium text-gray-700 dark:text-gray-300"
                  >
                    <Gavel className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                    القرار
                  </Label>
                  <Textarea
                    id="decision"
                    name="decision"
                    value={formData.decision}
                    onChange={handleChange}
                    placeholder="أدخل نص القرار هنا..."
                    rows={6}
                    className="resize-y rounded-lg px-4 py-3 bg-white border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-gray-800 placeholder:text-gray-500 transition-all duration-300 shadow-sm
                    dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200 dark:placeholder:text-gray-500 dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  />
                  {validationErrors.decision && (
                    <p className="text-red-500 text-sm mt-1">
                      {validationErrors.decision}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label
                    htmlFor="nots"
                    className="flex items-center gap-2 mb-2 text-base font-medium text-gray-700 dark:text-gray-300"
                  >
                    <StickyNote className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                    ملاحظات
                  </Label>
                  <Textarea
                    id="nots"
                    name="nots"
                    value={formData.nots}
                    onChange={handleChange}
                    placeholder="أدخل أي ملاحظات إضافية هنا..."
                    rows={6}
                    className="resize-y rounded-lg px-4 py-3 bg-white border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-gray-800 placeholder:text-gray-500 transition-all duration-300 shadow-sm
                    dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200 dark:placeholder:text-gray-500 dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  />
                  {validationErrors.nots && (
                    <p className="text-red-500 text-sm mt-1">
                      {validationErrors.nots}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* تبويب 3: المرفقات والخصوم */}
          <TabsContent value="attachments">
            <Card
              className="bg-white/90 backdrop-blur-sm border border-gray-200 shadow-lg rounded-2xl
            dark:bg-gray-800/90 dark:border-gray-700"
            >
              <CardHeader
                className="bg-blue-50/70 border-b border-blue-200 p-6 rounded-t-2xl
              dark:bg-gray-800/70 dark:border-gray-700"
              >
                <CardTitle className="text-2xl font-bold text-blue-700 flex items-center gap-2 dark:text-blue-300">
                  <Users className="w-6 h-6 text-blue-500 dark:text-blue-400" />{" "}
                  الخصوم والمرفقات
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  أضف الخصوم وقم برفع الملفات المتعلقة بالدعوى.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8 p-6">
                {/* Opponents Section */}
                <div className="space-y-4">
                  <Label
                    htmlFor="opponentInput"
                    className="flex items-center gap-2 mb-2 text-base font-medium text-gray-700 dark:text-gray-300"
                  >
                    <Users className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                    إضافة خصم
                  </Label>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Input
                      id="opponentInput"
                      value={newOpponent}
                      onChange={(e) => setNewOpponent(e.target.value)}
                      placeholder="أدخل اسم الخصم ثم اضغط إضافة"
                      className="h-12 rounded-lg px-4 bg-white border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-gray-800 placeholder:text-gray-500 flex-1 transition-all duration-300 shadow-sm
                      dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200 dark:placeholder:text-gray-500 dark:focus:ring-blue-500 dark:focus:border-blue-500"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddOpponent();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={handleAddOpponent}
                      className="h-12 px-6 rounded-lg gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold shadow-md shadow-blue-300/50 transition-all duration-300 transform hover:scale-105
                      dark:bg-blue-600 dark:hover:bg-blue-700 dark:shadow-blue-500/30"
                      disabled={!newOpponent.trim()}
                    >
                      <PlusCircle className="h-5 w-5" />
                      <span>إضافة خصم</span>
                    </Button>
                  </div>

                  {formData.opponents.length > 0 && (
                    <div
                      className="mt-5 border border-gray-200 rounded-lg p-4 bg-gray-50 shadow-inner
                    dark:bg-gray-900 dark:border-gray-700"
                    >
                      <h4 className="text-base font-semibold mb-3 text-gray-600 dark:text-gray-400">
                        الخصوم المضافين:
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {formData.opponents.map((opponent, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-white rounded-md border border-gray-200 shadow-xs transition-transform duration-200 hover:scale-[1.01]
                          dark:bg-gray-700 dark:border-gray-600"
                          >
                            <span className="text-base font-medium text-gray-800 dark:text-gray-200">
                              {opponent}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveOpponent(index)}
                              className="h-9 w-9 rounded-full text-red-500 hover:bg-red-100 transition-colors duration-200
                              dark:hover:bg-red-900"
                            >
                              <XCircle className="h-5 w-5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* File Upload Section */}
                <div className="space-y-4">
                  <Label
                    htmlFor="file-upload"
                    className="flex items-center gap-2 mb-2 text-base font-medium text-gray-700 dark:text-gray-300"
                  >
                    <CloudUpload className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                    إدارة المرفقات (اختياري)
                  </Label>
                  <div className="flex items-center gap-4">
                    <Label
                      htmlFor="file-upload"
                      className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-blue-50 transition-colors duration-300 text-gray-500 hover:text-blue-600
                      dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-400 dark:hover:text-blue-300"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <FileStack className="w-12 h-12 mb-3 text-blue-400 dark:text-blue-500" />
                        <p className="mb-2 text-base">
                          <span className="font-semibold text-blue-500 dark:text-blue-400">
                            انقر لرفع ملفات
                          </span>{" "}
                          أو اسحبها هنا
                        </p>
                        <p className="text-sm">
                          PDF, DOC, DOCX, JPG, PNG (الحجم الأقصى: 10MB لكل ملف)
                        </p>
                      </div>
                      <Input
                        id="file-upload"
                        type="file"
                        onChange={handleFileChange}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        multiple
                      />
                    </Label>
                  </div>

                  {selectedFiles.length > 0 && (
                    <div
                      className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200 shadow-sm
                    dark:bg-indigo-950 dark:border-indigo-800"
                    >
                      <h3 className="text-base font-semibold text-blue-600 mb-3 dark:text-blue-300">
                        الملفات المختارة للرفع:
                      </h3>
                      <ul className="space-y-2">
                        {selectedFiles.map((file, index) => (
                          <li
                            key={index}
                            className="flex items-center justify-between p-3 bg-white rounded border border-gray-200 shadow-xs transition-transform duration-200 hover:scale-[1.01]
                          dark:bg-gray-700 dark:border-gray-600"
                          >
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-blue-400 dark:text-blue-500" />
                              <span className="text-base font-medium truncate max-w-[calc(100%-60px)] text-gray-800 dark:text-gray-200">
                                {file.name}
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveSelectedFile(index)}
                              className="h-9 w-9 rounded-full text-red-500 hover:bg-red-100 transition-colors duration-200
                              dark:hover:bg-red-900"
                            >
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {formData.files.length > 0 && (
                    <div
                      className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm
                    dark:bg-gray-900 dark:border-gray-700"
                    >
                      <h3 className="text-base font-semibold text-gray-600 mb-3 dark:text-gray-400">
                        الملفات المرفقة بالفعل:
                      </h3>
                      <ul className="space-y-2">
                        {formData.files.map((fileUrl, index) => (
                          <li
                            key={index}
                            className="flex items-center justify-between p-3 bg-white rounded border border-gray-200 shadow-xs transition-transform duration-200 hover:scale-[1.01]
                          dark:bg-gray-700 dark:border-gray-600"
                          >
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                              <a
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 hover:underline truncate max-w-[calc(100%-60px)] dark:text-indigo-300 dark:hover:text-indigo-200"
                              >
                                ملف {index + 1}
                              </a>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              مرفق
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* أزرار الحفظ أو التالي أسفل الشاشة */}
        <div
          className="sticky bottom-0 mt-8 bg-blue-50/80 backdrop-blur-sm p-4 border-t border-blue-200 rounded-b-2xl -mx-4 md:-mx-8 lg:-mx-10 flex justify-end gap-5 shadow-inner
        dark:bg-gray-900/80 dark:border-gray-700"
        >
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="h-12 px-8 rounded-lg text-gray-700 border border-gray-300 bg-gray-100 hover:bg-gray-200 hover:border-gray-400 transition-colors duration-300 shadow-md
            dark:text-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:hover:border-gray-500"
          >
            إلغاء
          </Button>

          {activeTab === "attachments" ? (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading || uploadingDuringSubmit}
              className="h-12 px-10 rounded-lg gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold shadow-md shadow-blue-300/50 transition-all duration-300 transform hover:scale-105
              dark:from-blue-600 dark:to-indigo-700 dark:hover:from-blue-700 dark:hover:to-indigo-800 dark:shadow-blue-500/30"
            >
              {isLoading || uploadingDuringSubmit ? (
                <>
                  <ActivityIndicator size="small" className="text-white" />
                  <span>جاري الحفظ...</span>
                </>
              ) : (
                <>
                  <Rocket className="h-5 w-5" />
                  <span>حفظ الدعوى</span>
                </>
              )}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleNextTab}
              className="h-12 px-10 rounded-lg gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold shadow-md shadow-blue-300/50 transition-all duration-300 transform hover:scale-105
              dark:from-blue-600 dark:to-indigo-700 dark:hover:from-blue-700 dark:hover:to-indigo-800 dark:shadow-blue-500/30"
            >
              <span>التالي</span>
              <ArrowRight className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}