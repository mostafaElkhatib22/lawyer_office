/* eslint-disable prefer-const */
/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
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
  ChartColumnBig,
} from "lucide-react";

// --- START MOCK for next-auth/react (for environment compatibility) ---
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
const mockUseRouter = () => {
  const router = React.useMemo(
    () => ({
      push: (path: string) => {
        console.log(`Mock Router.push: Navigating to ${path}`);
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

// --- Optimized ActivityIndicator ---
const ActivityIndicator = memo(({
  size = "medium" as "small" | "medium" | "large",
  className = "text-blue-500",
}: {
  size?: "small" | "medium" | "large";
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
});

ActivityIndicator.displayName = "ActivityIndicator";

// Custom FileStack SVG icon
const FileStack = memo((props: React.SVGProps<SVGSVGElement>) => (
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
));

FileStack.displayName = "FileStack";

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
  files: string[];
}

// Constants moved outside component for better performance
const CASE_TYPE_OPTIONS = ["مدني", "جنائي", "إداري", "أحوال شخصية", "تجاري", "عمالي"];
const TYPE_OPTIONS = ["ابتدائي", "استئناف", "نقض", "تنفيذ"];
const CASE_STATUS_OPTIONS = ["مفتوحة", "مغلقة", "مؤجلة", "استئناف", "مشطوبة"];

const INITIAL_FORM_DATA: FormData = {
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
  files: [],
};

// Memoized components for better performance
const InputField = memo(({
  id,
  type,
  label,
  placeholder,
  required,
  Icon,
  value,
  onChange,
  validationError,
  min,
  max,
}: {
  id: keyof FormData;
  type: string;
  label: string;
  placeholder: string;
  required: boolean;
  Icon: React.ElementType;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  validationError?: string;
  min?: string;
  max?: string;
}) => (
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
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      min={min}
      max={max}
      className={`h-12 rounded-lg px-4 bg-white border border-gray-300 focus:ring-2 ${
        validationError
          ? "border-red-500 ring-red-500"
          : "focus:ring-blue-400 focus:border-blue-400"
      } text-gray-800 placeholder:text-gray-500 transition-all duration-300 shadow-sm
      dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200 dark:placeholder:text-gray-500 dark:focus:ring-blue-500 dark:focus:border-blue-500`}
    />
    {validationError && (
      <p className="text-red-500 text-sm mt-1 absolute -bottom-6 right-0">
        {validationError}
      </p>
    )}
  </div>
));

InputField.displayName = "InputField";

const SelectField = memo(({
  id,
  label,
  placeholder,
  required,
  Icon,
  options,
  value,
  onChange,
  validationError,
}: {
  id: keyof FormData;
  label: string;
  placeholder: string;
  required: boolean;
  Icon: React.ElementType;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  validationError?: string;
}) => (
  <div className="space-y-2 relative">
    <Label
      htmlFor={id}
      className="flex items-center gap-2 mb-2 text-base font-medium text-gray-700 dark:text-gray-300"
    >
      <Icon className="h-5 w-5 text-blue-500 dark:text-blue-400" />
      {label} {required && <span className="text-red-500">*</span>}
    </Label>
    <Select onValueChange={onChange} value={value}>
      <SelectTrigger
        id={id}
        className={`w-full h-12 rounded-lg px-4 bg-white border border-gray-300 ${
          validationError
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
    {validationError && (
      <p className="text-red-500 text-sm mt-1 absolute -bottom-6 right-0">
        {validationError}
      </p>
    )}
  </div>
));

SelectField.displayName = "SelectField";

const OpponentList = memo(({
  opponents,
  onRemove,
}: {
  opponents: string[];
  onRemove: (index: number) => void;
}) => {
  if (opponents.length === 0) return null;

  return (
    <div className="mt-5 border border-gray-200 rounded-lg p-4 bg-gray-50 shadow-inner dark:bg-gray-900 dark:border-gray-700">
      <h4 className="text-base font-semibold mb-3 text-gray-600 dark:text-gray-400">
        الخصوم المضافين:
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {opponents.map((opponent, index) => (
          <div
            key={`${opponent}-${index}`}
            className="flex items-center justify-between p-3 bg-white rounded-md border border-gray-200 shadow-xs transition-transform duration-200 hover:scale-[1.01] dark:bg-gray-700 dark:border-gray-600"
          >
            <span className="text-base font-medium text-gray-800 dark:text-gray-200">
              {opponent}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onRemove(index)}
              className="h-9 w-9 rounded-full text-red-500 hover:bg-red-100 transition-colors duration-200 dark:hover:bg-red-900"
            >
              <XCircle className="h-5 w-5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
});

OpponentList.displayName = "OpponentList";

const FileList = memo(({
  files,
  onRemove,
  title,
  type,
}: {
  files: File[] | string[];
  onRemove: (index: number) => void;
  title: string;
  type: "selected" | "uploaded";
}) => {
  if (files.length === 0) return null;

  return (
    <div className={`mt-4 p-4 rounded-lg border shadow-sm ${
      type === "selected" 
        ? "bg-blue-50 border-blue-200 dark:bg-indigo-950 dark:border-indigo-800"
        : "bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-700"
    }`}>
      <h3 className={`text-base font-semibold mb-3 ${
        type === "selected"
          ? "text-blue-600 dark:text-blue-300"
          : "text-gray-600 dark:text-gray-400"
      }`}>
        {title}
      </h3>
      <ul className="space-y-2">
        {files.map((file, index) => (
          <li
            key={type === "selected" ? `${(file as File).name}-${index}` : `file-${index}`}
            className="flex items-center justify-between p-3 bg-white rounded border border-gray-200 shadow-xs transition-transform duration-200 hover:scale-[1.01] dark:bg-gray-700 dark:border-gray-600"
          >
            <div className="flex items-center gap-3">
              <FileText className={`h-5 w-5 ${
                type === "selected" ? "text-blue-400 dark:text-blue-500" : "text-indigo-500 dark:text-indigo-400"
              }`} />
              {type === "selected" ? (
                <span className="text-base font-medium truncate max-w-[calc(100%-60px)] text-gray-800 dark:text-gray-200">
                  {(file as File).name}
                </span>
              ) : (
                <a
                  href={file as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:underline truncate max-w-[calc(100%-60px)] dark:text-indigo-300 dark:hover:text-indigo-200"
                >
                  ملف {index + 1}
                </a>
              )}
            </div>
            {type === "selected" ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onRemove(index)}
                className="h-9 w-9 rounded-full text-red-500 hover:bg-red-100 transition-colors duration-200 dark:hover:bg-red-900"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            ) : (
              <span className="text-xs text-gray-500 dark:text-gray-400">مرفق</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
});

FileList.displayName = "FileList";

export default function AddCasePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // State management
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isClientsLoading, setIsClientsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingDuringSubmit, setUploadingDuringSubmit] = useState(false);
  const [newOpponent, setNewOpponent] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState("basic");

  // Debounced validation to reduce unnecessary re-renders
  const debouncedValidationErrors = useMemo(() => validationErrors, [validationErrors]);

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
    } catch (err: any) {
      console.error("Error fetching clients:", err);
      const errorMessage = err.response?.data?.message || err.message || "خطأ غير معروف";
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

  // Optimized change handlers
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }, [validationErrors]);

  const handleSelectChange = useCallback((name: string) => (value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }, [validationErrors]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((file) => file.size <= 10 * 1024 * 1024);
    const invalidFiles = files.filter((file) => file.size > 10 * 1024 * 1024);

    if (invalidFiles.length > 0) {
      invalidFiles.forEach((file) => {
        toast.error(`الملف "${file.name}" يتجاوز الحد الأقصى للحجم (10MB) وسيتم تجاهله.`);
      });
    }

    setSelectedFiles((prev) => [...prev, ...validFiles]);
    e.target.value = ""; // Clear input
  }, []);

  const handleRemoveSelectedFile = useCallback((indexToRemove: number) => {
    setSelectedFiles((prev) => {
      const removedFileName = prev[indexToRemove].name;
      const newFiles = prev.filter((_, index) => index !== indexToRemove);
      toast.info(`تم إزالة الملف "${removedFileName}" من قائمة الرفع.`);
      return newFiles;
    });
  }, []);

  const handleAddOpponent = useCallback(() => {
    const trimmedOpponent = newOpponent.trim();
    if (!trimmedOpponent) {
      toast.error("لا يمكن إضافة خصم فارغ.");
      return;
    }
    if (formData.opponents.includes(trimmedOpponent)) {
      toast.warning("هذا الخصم موجود بالفعل.");
      return;
    }
    
    setFormData((prev) => ({
      ...prev,
      opponents: [...prev.opponents, trimmedOpponent],
    }));
    setNewOpponent("");
    toast.success(`تم إضافة الخصم "${trimmedOpponent}"`);
  }, [newOpponent, formData.opponents]);

  const handleRemoveOpponent = useCallback((indexToRemove: number) => {
    setFormData((prev) => {
      const removedOpponentName = prev.opponents[indexToRemove];
      const newOpponents = prev.opponents.filter((_, index) => index !== indexToRemove);
      toast.info(`تم إزالة الخصم "${removedOpponentName}"`);
      return { ...prev, opponents: newOpponents };
    });
  }, []);

  const uploadFileToCloudinary = useCallback(async (file: File): Promise<string | null> => {
    const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

    if (!CLOUDINARY_UPLOAD_PRESET || !CLOUDINARY_CLOUD_NAME) {
      toast.error("إعدادات Cloudinary غير موجودة أو غير صحيحة. يرجى التحقق من ملف .env.local والبادئة NEXT_PUBLIC_.");
      return null;
    }

    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append("file", file);
    cloudinaryFormData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    try {
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`,
        cloudinaryFormData,
        { timeout: 30000 }
      );
      return response.data?.secure_url || null;
    } catch (err: any) {
      console.error(`Error uploading file ${file.name} to Cloudinary:`, err.response?.data || err.message);
      toast.error(`فشل في رفع الملف ${file.name}. يرجى المحاولة مرة أخرى.`);
      return null;
    }
  }, []);

  const validateForm = useCallback((fieldsToValidate?: (keyof FormData)[]): boolean => {
    const allRequiredFields: (keyof FormData)[] = [
      "client", "caseTypeOF", "type", "court", "caseNumber", "year", "attorneyNumber",
    ];

    const fieldsToCheck = fieldsToValidate || allRequiredFields;
    const currentErrors: Record<string, string> = {};

    // Validate required fields
    for (const field of fieldsToCheck) {
      if (allRequiredFields.includes(field)) {
        const value = formData[field];
        if (!value || (typeof value === "string" && !value.trim())) {
          currentErrors[field] = "هذا الحقل مطلوب.";
        }
      }
    }

    // Validate dates
    if (fieldsToCheck.includes("caseDate") && formData.caseDate) {
      const caseDateObj = new Date(formData.caseDate);
      if (isNaN(caseDateObj.getTime())) {
        currentErrors.caseDate = "تاريخ الدعوى غير صالح.";
      }
    }

    if (fieldsToCheck.includes("sessiondate") && formData.sessiondate) {
      const sessionDateObj = new Date(formData.sessiondate);
      if (isNaN(sessionDateObj.getTime())) {
        currentErrors.sessiondate = "تاريخ الجلسة غير صالح.";
      }
    }

    // Date comparison
    if (fieldsToCheck.includes("caseDate") && fieldsToCheck.includes("sessiondate") && 
        formData.caseDate && formData.sessiondate) {
      const caseDateObj = new Date(formData.caseDate);
      const sessionDateObj = new Date(formData.sessiondate);
      
      if (!isNaN(caseDateObj.getTime()) && !isNaN(sessionDateObj.getTime()) && 
          sessionDateObj < caseDateObj) {
        currentErrors.sessiondate = "يجب أن يكون تاريخ الجلسة بعد تاريخ الدعوى.";
      }
    }

    // Update validation errors
    setValidationErrors((prevErrors) => {
      const newErrors = { ...prevErrors };
      fieldsToCheck.forEach((field) => {
        if (!currentErrors[field]) {
          delete newErrors[field];
        }
      });
      Object.assign(newErrors, currentErrors);
      return newErrors;
    });

    return Object.keys(currentErrors).length === 0;
  }, [formData]);

  const handleNextTab = useCallback(() => {
    const tabFieldsMap = {
      basic: ["client", "caseTypeOF", "type", "court", "caseNumber", "year"] as (keyof FormData)[],
      details: ["attorneyNumber", "caseDate", "sessiondate"] as (keyof FormData)[],
    };

    const tabNextMap = { basic: "details", details: "attachments" };

    const currentTabFields = tabFieldsMap[activeTab as keyof typeof tabFieldsMap];
    const nextTab = tabNextMap[activeTab as keyof typeof tabNextMap];

    if (!currentTabFields || !nextTab) return;

    const isValid = validateForm(currentTabFields);

    if (isValid) {
      setActiveTab(nextTab);
    } else {
      toast.error("يرجى تصحيح الأخطاء في الحقول الحالية قبل المتابعة.");
    }
  }, [activeTab, validateForm]);

  const handleSubmit = useCallback(async () => {
    if (!session?.user?.id) {
      toast.error("لا توجد صلاحية لإضافة دعوى. يرجى تسجيل الدخول");
      return;
    }

    const isValid = validateForm();
    if (!isValid) {
      toast.error("يرجى تصحيح الأخطاء في النموذج قبل الحفظ.");
      
      // Navigate to first tab with errors
      if (debouncedValidationErrors.client || debouncedValidationErrors.caseTypeOF || 
          debouncedValidationErrors.type || debouncedValidationErrors.court || 
          debouncedValidationErrors.caseNumber || debouncedValidationErrors.year) {
        setActiveTab("basic");
      } else if (debouncedValidationErrors.attorneyNumber || debouncedValidationErrors.caseDate || 
                 debouncedValidationErrors.sessiondate) {
        setActiveTab("details");
      }
      return;
    }

    setIsLoading(true);
    setError(null);
    setUploadingDuringSubmit(true);

    try {
      const uploadedFileUrls: string[] = [];

      // Upload files concurrently for better performance
      if (selectedFiles.length > 0) {
        const uploadPromises = selectedFiles.map(file => uploadFileToCloudinary(file));
        const results = await Promise.all(uploadPromises);
        uploadedFileUrls.push(...results.filter((url): url is string => url !== null));
      }

      const payload = {
        ...formData,
        files: [...formData.files, ...uploadedFileUrls],
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
        
        // Reset form
        setSelectedFiles([]);
        setFormData(INITIAL_FORM_DATA);
        setNewOpponent("");
        setValidationErrors({});
        setActiveTab("basic");
        
        router.push("/dashboard/all-cases");
      } else {
        throw new Error(response.data?.message || "فشل في إضافة الدعوى");
      }
    } catch (err: any) {
      console.error("Error adding case:", err.response?.data || err.message);
      const errorMessage = err.response?.data?.message || err.message || "خطأ غير معروف";
      toast.error(`فشل في إضافة الدعوى: ${errorMessage}`);
      setError(`فشل في إضافة الدعوى: ${errorMessage}`);
    } finally {
      setIsLoading(false);
      setUploadingDuringSubmit(false);
    }
  }, [session?.user?.id, validateForm, selectedFiles, formData, router, debouncedValidationErrors, uploadFileToCloudinary]);

  // Loading states
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
            onClick={fetchClients}
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

  return (
    <div className="flex flex-col p-4 md:p-8 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen text-gray-800 font-sans relative overflow-hidden dark:from-gray-950 dark:to-gray-800 dark:text-gray-200">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 opacity-30 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-200 via-transparent to-transparent animate-pulse-light dark:from-indigo-900 dark:to-transparent"></div>

      {/* Header */}
      <div className="relative z-10 flex items-center mb-10 max-w-5xl mx-auto">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="ml-4 rtl:mr-4 rtl:ml-0 rounded-full text-gray-500 hover:bg-gray-200 transition-colors duration-300 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-700 flex items-center gap-4 drop-shadow-md dark:from-blue-400 dark:to-indigo-500">
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
          <TabsList className="grid grid-cols-1 sm:grid-cols-3 w-full h-auto bg-blue-100/70 backdrop-blur-sm border border-blue-200 rounded-xl shadow-md p-1 dark:bg-gray-900/70 dark:border-gray-700">
            <TabsTrigger
              value="basic"
              className="py-3 px-4 flex items-center gap-2 text-lg font-semibold text-gray-700 rounded-lg transition-all duration-300 data-[state=active]:bg-white data-[state=active]:text-blue-800 data-[state=active]:shadow-sm data-[state=active]:border-b-2 data-[state=active]:border-blue-500 hover:bg-blue-50 hover:text-blue-700 dark:text-gray-300 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-blue-200 dark:data-[state=active]:border-blue-400 dark:hover:bg-gray-700 dark:hover:text-blue-300"
            >
              <FileText className="w-5 h-5" /> البيانات الأساسية
            </TabsTrigger>
            <TabsTrigger
              value="details"
              className="py-3 px-4 flex items-center gap-2 text-lg font-semibold text-gray-700 rounded-lg transition-all duration-300 data-[state=active]:bg-white data-[state=active]:text-blue-800 data-[state=active]:shadow-sm data-[state=active]:border-b-2 data-[state=active]:border-blue-500 hover:bg-blue-50 hover:text-blue-700 dark:text-gray-300 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-blue-200 dark:data-[state=active]:border-blue-400 dark:hover:bg-gray-700 dark:hover:text-blue-300"
            >
              <Book className="w-5 h-5" /> التفاصيل
            </TabsTrigger>
            <TabsTrigger
              value="attachments"
              className="py-3 px-4 flex items-center gap-2 text-lg font-semibold text-gray-700 rounded-lg transition-all duration-300 data-[state=active]:bg-white data-[state=active]:text-blue-800 data-[state=active]:shadow-sm data-[state=active]:border-b-2 data-[state=active]:border-blue-500 hover:bg-blue-50 hover:text-blue-700 dark:text-gray-300 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-blue-200 dark:data-[state=active]:border-blue-400 dark:hover:bg-gray-700 dark:hover:text-blue-300"
            >
              <Users className="w-5 h-5" /> مرفقات وخصوم
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Basic Data */}
          <TabsContent value="basic">
            <Card className="bg-white/90 backdrop-blur-sm border border-gray-200 shadow-lg rounded-2xl dark:bg-gray-800/90 dark:border-gray-700">
              <CardHeader className="bg-blue-50/70 border-b border-blue-200 p-6 rounded-t-2xl dark:bg-gray-800/70 dark:border-gray-700">
                <CardTitle className="text-2xl font-bold text-blue-700 flex items-center gap-2 dark:text-blue-300">
                  <FileText className="w-6 h-6 text-blue-500 dark:text-blue-400" />
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
                    onValueChange={handleSelectChange("client")}
                    value={formData.client}
                  >
                    <SelectTrigger
                      id="client"
                      className={`w-full h-12 rounded-lg px-4 bg-white border border-gray-300 ${
                        debouncedValidationErrors.client
                          ? "border-red-500 ring-red-500"
                          : "focus:ring-blue-400 focus:border-blue-400"
                      } text-gray-800 placeholder:text-gray-500 transition-all duration-300 shadow-sm dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200 dark:placeholder:text-gray-500 dark:focus:ring-blue-500 dark:focus:border-blue-500`}
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
                  {debouncedValidationErrors.client && (
                    <p className="text-red-500 text-sm mt-1 absolute -bottom-6 right-0">
                      {debouncedValidationErrors.client}
                    </p>
                  )}
                </div>

                <SelectField
                  id="caseTypeOF"
                  label="نوع الدعوى"
                  placeholder="اختر نوع الدعوى"
                  required={true}
                  Icon={Gavel}
                  options={CASE_TYPE_OPTIONS}
                  value={formData.caseTypeOF}
                  onChange={handleSelectChange("caseTypeOF")}
                  validationError={debouncedValidationErrors.caseTypeOF}
                />

                <SelectField
                  id="status"
                  label="حالة الدعوى"
                  placeholder="اختر حالة الدعوى"
                  required={true}
                  Icon={ChartColumnBig}
                  options={CASE_STATUS_OPTIONS}
                  value={formData.status}
                  onChange={handleSelectChange("status")}
                  validationError={debouncedValidationErrors.status}
                />

                <SelectField
                  id="type"
                  label="طبيعة الدعوى"
                  placeholder="اختر طبيعة الدعوى"
                  required={true}
                  Icon={Scale}
                  options={TYPE_OPTIONS}
                  value={formData.type}
                  onChange={handleSelectChange("type")}
                  validationError={debouncedValidationErrors.type}
                />

                <InputField
                  id="court"
                  type="text"
                  label="المحكمة"
                  placeholder="مثال: محكمة القاهرة الابتدائية"
                  required={true}
                  Icon={Shield}
                  value={formData.court}
                  onChange={handleChange}
                  validationError={debouncedValidationErrors.court}
                />

                <InputField
                  id="caseNumber"
                  type="text"
                  label="رقم الدعوى"
                  placeholder="مثال: 1234"
                  required={true}
                  Icon={Hash}
                  value={formData.caseNumber}
                  onChange={handleChange}
                  validationError={debouncedValidationErrors.caseNumber}
                />

                <InputField
                  id="year"
                  type="number"
                  label="السنة"
                  placeholder="مثال: 2024"
                  required={true}
                  Icon={Clock}
                  value={formData.year}
                  onChange={handleChange}
                  validationError={debouncedValidationErrors.year}
                  min="2000"
                  max="2030"
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Details */}
          <TabsContent value="details">
            <Card className="bg-white/90 backdrop-blur-sm border border-gray-200 shadow-lg rounded-2xl dark:bg-gray-800/90 dark:border-gray-700">
              <CardHeader className="bg-blue-50/70 border-b border-blue-200 p-6 rounded-t-2xl dark:bg-gray-800/70 dark:border-gray-700">
                <CardTitle className="text-2xl font-bold text-blue-700 flex items-center gap-2 dark:text-blue-300">
                  <Book className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                  تفاصيل ومواعيد الدعوى
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  أضف معلومات إضافية ومواعيد هامة هنا.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 p-6">
                <InputField
                  id="attorneyNumber"
                  type="text"
                  label="رقم التوكيل"
                  placeholder="مثال: 5678"
                  required={true}
                  Icon={Briefcase}
                  value={formData.attorneyNumber}
                  onChange={handleChange}
                  validationError={debouncedValidationErrors.attorneyNumber}
                />

                <InputField
                  id="caseDate"
                  type="date"
                  label="تاريخ الدعوى"
                  placeholder=""
                  required={false}
                  Icon={CalendarDays}
                  value={formData.caseDate}
                  onChange={handleChange}
                  validationError={debouncedValidationErrors.caseDate}
                />

                <InputField
                  id="sessiondate"
                  type="date"
                  label="تاريخ الجلسة القادمة"
                  placeholder=""
                  required={false}
                  Icon={CalendarClock}
                  value={formData.sessiondate}
                  onChange={handleChange}
                  validationError={debouncedValidationErrors.sessiondate}
                />

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
                    className="resize-y rounded-lg px-4 py-3 bg-white border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-gray-800 placeholder:text-gray-500 transition-all duration-300 shadow-sm dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200 dark:placeholder:text-gray-500 dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  />
                  {debouncedValidationErrors.decision && (
                    <p className="text-red-500 text-sm mt-1">
                      {debouncedValidationErrors.decision}
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
                    className="resize-y rounded-lg px-4 py-3 bg-white border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-gray-800 placeholder:text-gray-500 transition-all duration-300 shadow-sm dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200 dark:placeholder:text-gray-500 dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  />
                  {debouncedValidationErrors.nots && (
                    <p className="text-red-500 text-sm mt-1">
                      {debouncedValidationErrors.nots}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: Attachments and Opponents */}
          <TabsContent value="attachments">
            <Card className="bg-white/90 backdrop-blur-sm border border-gray-200 shadow-lg rounded-2xl dark:bg-gray-800/90 dark:border-gray-700">
              <CardHeader className="bg-blue-50/70 border-b border-blue-200 p-6 rounded-t-2xl dark:bg-gray-800/70 dark:border-gray-700">
                <CardTitle className="text-2xl font-bold text-blue-700 flex items-center gap-2 dark:text-blue-300">
                  <Users className="w-6 h-6 text-blue-500 dark:text-blue-400" />
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
                      className="h-12 rounded-lg px-4 bg-white border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-gray-800 placeholder:text-gray-500 flex-1 transition-all duration-300 shadow-sm dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200 dark:placeholder:text-gray-500 dark:focus:ring-blue-500 dark:focus:border-blue-500"
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
                      className="h-12 px-6 rounded-lg gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold shadow-md shadow-blue-300/50 transition-all duration-300 transform hover:scale-105 dark:bg-blue-600 dark:hover:bg-blue-700 dark:shadow-blue-500/30"
                      disabled={!newOpponent.trim()}
                    >
                      <PlusCircle className="h-5 w-5" />
                      <span>إضافة خصم</span>
                    </Button>
                  </div>

                  <OpponentList
                    opponents={formData.opponents}
                    onRemove={handleRemoveOpponent}
                  />
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
                      className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-blue-50 transition-colors duration-300 text-gray-500 hover:text-blue-600 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-400 dark:hover:text-blue-300"
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

                  <FileList
                    files={selectedFiles}
                    onRemove={handleRemoveSelectedFile}
                    title="الملفات المختارة للرفع:"
                    type="selected"
                  />

                  <FileList
                    files={formData.files}
                    onRemove={() => {}} // No removal for already uploaded files
                    title="الملفات المرفقة بالفعل:"
                    type="uploaded"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Bottom Action Buttons */}
        <div className="sticky bottom-0 mt-8 bg-blue-50/80 backdrop-blur-sm p-4 border-t border-blue-200 rounded-b-2xl -mx-4 md:-mx-8 lg:-mx-10 flex justify-end gap-5 shadow-inner dark:bg-gray-900/80 dark:border-gray-700">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="h-12 px-8 rounded-lg text-gray-700 border border-gray-300 bg-gray-100 hover:bg-gray-200 hover:border-gray-400 transition-colors duration-300 shadow-md dark:text-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:hover:border-gray-500"
          >
            إلغاء
          </Button>

          {activeTab === "attachments" ? (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading || uploadingDuringSubmit}
              className="h-12 px-10 rounded-lg gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold shadow-md shadow-blue-300/50 transition-all duration-300 transform hover:scale-105 dark:from-blue-600 dark:to-indigo-700 dark:hover:from-blue-700 dark:hover:to-indigo-800 dark:shadow-blue-500/30"
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
              className="h-12 px-10 rounded-lg gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold shadow-md shadow-blue-300/50 transition-all duration-300 transform hover:scale-105 dark:from-blue-600 dark:to-indigo-700 dark:hover:from-blue-700 dark:hover:to-indigo-800 dark:shadow-blue-500/30"
            >
              <span>التالي</span>
              <ArrowRight className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
    )
  }