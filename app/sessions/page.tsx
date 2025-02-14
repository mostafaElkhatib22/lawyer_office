"use client";
import axios from "axios";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import Select from "react-select";
import Swal from "sweetalert2";

interface Case {
  _id: string;
  caseTypeOF: string;
  court: string;
  type: string;
  sessiondate: string;
  caseDate: string;
}

interface Option {
  value: string;
  label: string;
}

function SessionsPage() {
  const [sessions, setSessions] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<Option | null>(null);
  const router = useRouter();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("ar-EG", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get("/api/cases");
        const allSessions: Case[] = res.data.data;

        if (allSessions.length === 0) {
          setSessions([]);
          setLoading(false);
          return;
        }

        // تحديث الحالة بالجلسات
        setSessions(allSessions);

        // فلترة الجلسات المستقبلية فقط
        const currDate = new Date();
        const futureSessions = allSessions.filter(
          (session) => new Date(session.sessiondate) >= currDate
        );

        if (futureSessions.length > 0) {
          // إيجاد أقرب جلسة
          const nearestSession = futureSessions.reduce((a: Case, b: Case) => {
            const dateA = new Date(a.sessiondate).getTime();
            const dateB = new Date(b.sessiondate).getTime();
            return dateA < dateB ? a : b;
          });

          Swal.fire({
            title: "الجلسة القادمة!",
            text: `الجلسة القادمة: ${nearestSession.caseTypeOF} ${
              nearestSession.type
            } في تاريخ ${formatDate(nearestSession.sessiondate)} في محكمة ${
              nearestSession.court
            }`,
            icon: "info",
            confirmButtonText: "حسناً",
          });
        } else {
          Swal.fire({
            title: "لا توجد جلسات قادمة",
            text: "لا يوجد جلسات مستقبلية حالياً.",
            icon: "info",
            confirmButtonText: "حسناً",
          });
        }
      } catch (error) {
        console.error("Error fetching sessions:", error);
        Swal.fire({
          title: "خطأ",
          text: "حدث خطأ أثناء جلب البيانات.",
          icon: "error",
          confirmButtonText: "حسناً",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const sessionOptions = sessions.map((session) => ({
    value: session._id,
    label: `${session.caseTypeOF} - ${session.type} - ${formatDate(
      session.sessiondate
    )} - ${session.court}`,
  }));

  const handleChange = (selectedOption: Option | null) => {
    setSelectedSession(selectedOption);
    if (selectedOption) {
      router.push(`/cases/singleCase/${selectedOption.value}`);
    }
  };

  return (
    <div>
      {loading ? (
        <p>جاري التحميل...</p>
      ) : (
        <div className="w-full flex flex-col items-center mt-5">
          <label htmlFor="sessions">اختر جلسة:</label>
          {sessions.length === 0 ? (
            <div className="text-center mt-6">
              <h1 className="text-red-800 text-4xl">لا توجد جلسات حالياً!</h1>
            </div>
          ) : (
            <Select
              className="w-[400px]"
              id="sessions"
              value={selectedSession}
              onChange={handleChange}
              options={sessionOptions}
              placeholder="اختر جلسة..."
            />
          )}
        </div>
      )}
    </div>
  );
}

export default SessionsPage;
