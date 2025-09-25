/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { SessionProvider } from "next-auth/react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/Sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useEffect, useState } from "react";

function ConditionalLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div>{children}</div>;
  }

  // Public pages that don't need authentication
  const publicPages = [
    "/",
    "/about",
    "/contact", 
    "/pricing",
    "/features",
    "/auth/login",
    "/auth/register",
    "/auth/forgot-password",
    "/dashboard/unauthorized"
  ];

  const isPublicPage = publicPages.some(page => 
    pathname === page || pathname.startsWith(page + "/")
  );

  // If it's a public page or user is not authenticated, show simple layout
  if (isPublicPage || !session) {
    return (
      <div className="min-h-screen">
        {children}
      </div>
    );
  }

  // If user is authenticated and it's a dashboard route, show sidebar layout
  if (session && pathname.startsWith("/dashboard")) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <main className="flex-1 p-4 md:p-6">
          <SidebarTrigger />
          {children}
        </main>
      </SidebarProvider>
    );
  }

  // Default layout for other routes
  return <div>{children}</div>;
}

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ConditionalLayoutContent>
        {children}
      </ConditionalLayoutContent>
    </SessionProvider>
  );
}