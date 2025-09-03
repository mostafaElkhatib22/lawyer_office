"use client";

import { useEffect, useState, createContext, useContext } from "react";
import { motion } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  BriefcaseIcon,
  MapPinIcon,
  UserIcon,
  UsersIcon,
  CalendarDaysIcon,
  GavelIcon,
} from "lucide-react";

const arabicDateLocale = ar;

// Mock implementations for Shadcn UI components
interface ToastProps {
  id: string;
  title: string;
  description: string;
  variant?: "default" | "destructive";
}

const ToastContext = createContext<{
  toast: (props: Omit<ToastProps, "id">) => void;
}>({
  toast: () => {},
});

const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const toast = (props: Omit<ToastProps, "id">) => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { ...props, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000); // 5 seconds
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.3 }}
            className={`relative p-4 rounded-md shadow-md text-white ${
              t.variant === "destructive" ? "bg-red-500" : "bg-gray-800"
            }`}
          >
            <div className="font-bold">{t.title}</div>
            <div>{t.description}</div>
          </motion.div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const useToast = () => useContext(ToastContext);

const Spinner = () => (
  <svg
    className="animate-spin h-8 w-8 text-indigo-600 dark:text-indigo-400"
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

interface Case {
  _id: string;
  caseTypeOF: string;
  court: string;
    caseNumber: string;

  type: string;
  sessiondate: string;
  caseDate: string;
  client: { _id: string; name: string } | null;
  opponents: string[];
}

interface SessionOption {
  value: string;
  label: string;
  details: Case;
}

export default function SessionPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<SessionOption | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/cases");
        const allCases: Case[] = (await res.json()).data;
        
        if (allCases.length === 0) {
          toast({
            title: "لا توجد قضايا",
            description: "لم يتم العثور على قضايا لعرضها.",
            variant: "destructive"
          });
          setCases([]);
          setLoading(false);
          return;
        }

        setCases(allCases);
        
        // Filter for upcoming sessions and find the nearest one
        const currDate = new Date();
        const futureSessions = allCases.filter(
          (c) => new Date(c.sessiondate) >= currDate
        );
        
        if (futureSessions.length > 0) {
          const nearestSession = futureSessions.reduce((a: Case, b: Case) => {
            const dateA = new Date(a.sessiondate).getTime();
            const dateB = new Date(b.sessiondate).getTime();
            return dateA < dateB ? a : b;
          });
          toast({
            title: "الجلسة القادمة",
            description: `أقرب جلسة قادمة بتاريخ: ${format(new Date(nearestSession.sessiondate), "dd MMMM yyyy", { locale: arabicDateLocale })}`,
          });
        } else {
          toast({
            title: "لا توجد جلسات قادمة",
            description: "لا توجد جلسات مجدولة في المستقبل.",
            variant: "destructive"
          });
        }
        
      } catch (error) {
        console.error("Error fetching cases:", error);
        toast({
          title: "خطأ",
          description: "حدث خطأ أثناء جلب البيانات.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const sessionOptions: SessionOption[] = cases
    .filter((c) => c.sessiondate) // Filter out cases without a session date
    .map((c) => ({
      value: c._id,
      label: `${c.caseTypeOF} - ${c.type} - ${format(new Date(c.sessiondate), "dd/MM/yyyy", { locale: arabicDateLocale })} - ${c.court}`,
      details: c,
    }));

  const handleChange = (selectedValue: string) => {
    const option = sessionOptions.find(opt => opt.value === selectedValue);
    if (option) {
      setSelectedSession(option);
    }
  };

  return (
    <ToastProvider>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen p-8 dark:bg-gradient-to-br dark:from-gray-600 dark:to-gray-900 dark:text-white flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-100 "
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col  items-center w-full max-w-3xl">
          <motion.h1 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-5xl font-extrabold text-center mb-12 text-gray-900 dark:text-gray-100 drop-shadow-lg"
          >
            إدارة الجلسات
          </motion.h1>

          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex justify-center items-center h-48"
            >
              <Spinner />
            </motion.div>
          ) : (
            <div className="w-full flex flex-col items-center">
              <motion.label
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                htmlFor="sessions"
                className="mb-4 text-xl font-semibold text-gray-700 dark:text-gray-300"
              >
                اختر جلسة:
              </motion.label>
              
              {sessionOptions.length === 0 ? (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="text-center mt-6 p-6 rounded-2xl bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 shadow-xl border border-red-200"
                >
                  <h1 className="text-2xl font-bold">
                    لا توجد جلسات حالياً!
                  </h1>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="w-full max-w-xl"
                >
                  <Select onValueChange={handleChange} value={selectedSession?.value || ""}>
                    <SelectTrigger className="w-full h-14 rounded-xl shadow-md border-2 border-indigo-200 dark:border-indigo-800 bg-white dark:bg-gray-700 hover:border-indigo-400 transition-all">
                      <SelectValue placeholder="اختر جلسة..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {sessionOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </motion.div>
              )}
            </div>
          )}

          {selectedSession && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-12 p-8 w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 transform hover:scale-[1.01] transition-transform"
            >
              <h2 className="text-3xl font-bold text-center mb-6 text-gray-900 dark:text-gray-100">
                تفاصيل الجلسة المختارة
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-lg text-gray-700 dark:text-gray-300">
                <div className="flex items-center space-x-4">
                  <BriefcaseIcon className="w-6 h-6 text-indigo-500" />
                  <span className="font-semibold text-gray-900 dark:text-gray-100">نوع القضية:</span>
                  <span>{selectedSession.details.caseTypeOF}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <MapPinIcon className="w-6 h-6 text-purple-500" />
                  <span className="font-semibold text-gray-900 dark:text-gray-100">المحكمة:</span>
                  <span>{selectedSession.details.court}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <GavelIcon className="w-6 h-6 text-green-500" />
                  <span className="font-semibold text-gray-900 dark:text-gray-100">النوع:</span>
                  <span>{selectedSession.details.type}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <UserIcon className="w-6 h-6 text-red-500" />
                  <span className="font-semibold text-gray-900 dark:text-gray-100">الموكل:</span>
                  <span>{selectedSession.details.client?.name || "غير محدد"}</span>
                </div>
                <div className="flex items-center space-x-4 md:col-span-2">
                  <UsersIcon className="w-6 h-6 text-teal-500" />
                  <span className="font-semibold text-gray-900 dark:text-gray-100">الخصوم:</span>
                  <span>{selectedSession.details.opponents.join(", ") || "لا يوجد"}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <UserIcon className="w-6 h-6 text-red-500" />
                  <span className="font-semibold text-gray-900 dark:text-gray-100">رقم الدعوى:</span>
                  <span>{selectedSession.details.caseNumber || "غير محدد"}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <CalendarDaysIcon className="w-6 h-6 text-orange-500" />
                  <span className="font-semibold text-gray-900 dark:text-gray-100">تاريخ الجلسة:</span>
                  <span>{format(new Date(selectedSession.details.sessiondate), "dd MMMM yyyy", { locale: arabicDateLocale })}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <CalendarDaysIcon className="w-6 h-6 text-blue-500" />
                  <span className="font-semibold text-gray-900 dark:text-gray-100">تاريخ القضية:</span>
                  <span>{format(new Date(selectedSession.details.caseDate), "dd MMMM yyyy", { locale: arabicDateLocale })}</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </ToastProvider>
  );
}
