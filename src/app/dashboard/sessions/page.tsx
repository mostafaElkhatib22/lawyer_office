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

// Toast Context
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
    }, 5000);
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
            className={`relative p-4 rounded-xl shadow-2xl text-white backdrop-blur-md ${
              t.variant === "destructive"
                ? "bg-red-500/90"
                : "bg-gray-900/90 border border-gray-700"
            }`}
          >
            <div className="font-bold">{t.title}</div>
            <div className="opacity-90">{t.description}</div>
          </motion.div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const useToast = () => useContext(ToastContext);

const Spinner = () => (
  <div className="flex items-center justify-center">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
      className="h-10 w-10 rounded-full border-4 border-indigo-600 border-t-transparent"
    />
  </div>
);

interface Case {
  _id: string;
  caseTypeOF: string;
  court: string;
  caseNumber: string;
  type: string;
  nameOfCase:string;
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
  const [selectedSession, setSelectedSession] =
    useState<SessionOption | null>(null);
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
            variant: "destructive",
          });
          setCases([]);
          setLoading(false);
          return;
        }

        setCases(allCases);

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
            description: `أقرب جلسة بتاريخ: ${format(
              new Date(nearestSession.sessiondate),
              "dd MMMM yyyy",
              { locale: arabicDateLocale }
            )}`,
          });
        } else {
          toast({
            title: "لا توجد جلسات قادمة",
            description: "لا توجد جلسات مجدولة.",
            variant: "destructive",
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
    .filter((c) => c.sessiondate)
    .map((c) => ({
      value: c._id,
      label: `${c.caseTypeOF} - ${c.type} - ${format(
        new Date(c.sessiondate),
        "dd/MM/yyyy",
        { locale: arabicDateLocale }
      )} - ${c.court}`,
      details: c,
    }));

  const handleChange = (selectedValue: string) => {
    const option = sessionOptions.find((opt) => opt.value === selectedValue);
    if (option) setSelectedSession(option);
  };

  return (
    <ToastProvider>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen p-8 bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 dark:from-gray-900 dark:via-gray-800 dark:to-black flex items-center justify-center"
      >
        <div className="flex flex-col items-center w-full max-w-4xl space-y-10">
          <motion.h1
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-5xl font-extrabold text-center text-gray-900 dark:text-white drop-shadow-md tracking-wide"
          >
            📅 إدارة الجلسات
          </motion.h1>

          {loading ? (
            <Spinner />
          ) : (
            <div className="w-full flex flex-col items-center space-y-6">
              <label className="text-lg font-semibold text-gray-800 dark:text-gray-300">
                اختر جلسة:
              </label>

              {sessionOptions.length === 0 ? (
                <div className="p-6 rounded-2xl bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 shadow-xl border border-red-300 w-full text-center">
                  <h1 className="text-2xl font-bold">🚫 لا توجد جلسات حالياً</h1>
                </div>
              ) : (
                <Select
                  onValueChange={handleChange}
                  value={selectedSession?.value || ""}
                >
                  <SelectTrigger className="w-full h-14 rounded-xl shadow-lg border-2 border-indigo-300 dark:border-indigo-700 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm hover:border-indigo-500 transition-all">
                    <SelectValue placeholder="اختر جلسة..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-md">
                    {sessionOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {selectedSession && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="p-8 w-full rounded-3xl shadow-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-300 dark:border-gray-700"
            >
              <h2 className="text-3xl font-bold text-center mb-6 text-indigo-700 dark:text-indigo-300">
                تفاصيل الجلسة
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-lg">
                <SessionDetail
                  icon={<BriefcaseIcon className="w-6 h-6 text-blue-500" />}
                  label="نوع القضية"
                  value={selectedSession.details.caseTypeOF}
                />
                <SessionDetail
                  icon={<MapPinIcon className="w-6 h-6 text-blue-500" />}
                  label="المحكمة"
                  value={selectedSession.details.court}
                />
                <SessionDetail
                  icon={<GavelIcon className="w-6 h-6 text-blue-500" />}
                  label="النوع"
                  value={selectedSession.details.type}
                />
                <SessionDetail
                  icon={<UserIcon className="w-6 h-6 text-blue-500" />}
                  label="الموكل"
                  value={selectedSession.details.client?.name || "غير محدد"}
                />
                <SessionDetail
                  icon={<UsersIcon className="w-6 h-6 text-blue-500" />}
                  label="الخصوم"
                  value={
                    selectedSession.details.opponents.join(", ") || "لا يوجد"
                  }
                  
                />
                <SessionDetail
                  icon={<UsersIcon className="w-6 h-6 text-blue-500" />}
                  label="الخصوم"
                  value={
                    selectedSession.details.nameOfCase || "لا يوجد"
                  }
                  
                />
                <SessionDetail
                  icon={<UserIcon className="w-6 h-6 text-blue-500" />}
                  label="رقم الدعوى"
                  value={selectedSession.details.caseNumber || "غير محدد"}
                />
                <SessionDetail
                  icon={<CalendarDaysIcon className="w-6 h-6 text-blue-500" />}
                  label="تاريخ الجلسة"
                  value={format(
                    new Date(selectedSession.details.sessiondate),
                    "dd MMMM yyyy",
                    { locale: arabicDateLocale }
                  )}
                />
                <SessionDetail
                  icon={<CalendarDaysIcon className="w-6 h-6 text-blue-500" />}
                  label="تاريخ القضية"
                  value={format(
                    new Date(selectedSession.details.caseDate),
                    "dd MMMM yyyy",
                    { locale: arabicDateLocale }
                  )}
                />
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </ToastProvider>
  );
}

function SessionDetail({
  icon,
  label,
  value,
  full,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  full?: boolean;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      className={`flex items-center space-x-3 p-4 rounded-xl shadow-md bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 ${
        full ? "md:col-span-2" : ""
      }`}
    >
      {icon}
      <span className="font-semibold text-gray-900 dark:text-gray-100">
        {label}:
      </span>
      <span className="text-gray-700 dark:text-gray-300">{value}</span>
    </motion.div>
  );
}
