// src/components/DashboardHeader.tsx
"use client";
import React from "react";
import { signOut, useSession } from "next-auth/react"; // تم تصحيح import لـ signOut
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle"; // استيراد مكون تبديل الثيم
interface DashboardHeaderProps {
  userName?: string | null;
  userEmail?: string | null;
}

export function DashboardHeader({ userName, userEmail }: DashboardHeaderProps) {
  const session = useSession();
  const { data ,status} = session;
  return (
    <Card className="flex items-center justify-center bg-white dark:bg-gray-800 shadow-md">
      <CardHeader className="p-0 mb-4 md:mb-0 md:mr-4">
        <CardTitle className="text-[16px] text-center" dir="rtl">
          لوحة تحكم {data?.user?.name}
        </CardTitle>
        <CardDescription className="text-lg text-center" dir="rtl">
          مرحباً بك، {userName || "المحامي"} ({userEmail || "N/A"})!
        </CardDescription>
      </CardHeader>
      <div className="flex items-end justify-end space-x-4">
        <ModeToggle />
        <div>
          {status === "authenticated" && (

        <Button
          onClick={() => signOut({ callbackUrl: "/auth/login" })}
          variant="outline"
        >
          تسجيل الخروج
        </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
