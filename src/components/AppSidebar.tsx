// src/components/AppSidebar.tsx
"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/Sidebar";
import {
  Home,
  ClipboardList,
  PlusSquare,
  Users,
  CalendarPlus,
  LogOut,
  CalendarDays,
  Settings,
  ClipboardPlus,
} from "lucide-react";
import { ModeToggle } from "./mode-toggle";
import { Button } from "./ui/button"; // تأكد من استيراد Button من shadcn/ui
import { signOut, useSession } from "next-auth/react";

export function AppSidebar() {
  const { status } = useSession(); // استخدام useSession للتحقق من حالة الجلسة
  const pathname = usePathname();
  const { open } = useSidebar(); // لمعرفة إذا كان الـ sidebar مفتوح أم مغلق (لإخفاء النصوص)
  const navItems = [
    { href: "/dashboard", icon: Home, label: "لوحة التحكم" },
    { href: "/dashboard/all-cases", icon: ClipboardList, label: "كل الدعاوى" },
    { href: "/dashboard/add-case", icon: PlusSquare, label: "إضافة دعوى" },
    { href: "/dashboard/clients/all_clients", icon: Users, label: "الموكلين" },
    {
      href: "/dashboard/clients/add-client",
      icon: CalendarPlus,
      label: "إضافة موكل",
    },
    { href: "/dashboard/sessions", icon: CalendarDays, label: "الجلسات" },
    { href: "/dashboard/reports", icon: ClipboardPlus, label: "تقارير" },
  ];
  return (
    // 'collapsible="icon"' لجعله يتصغر إلى أيقونات فقط في وضع عدم التوسيع
    <Sidebar collapsible="icon" className="hidden md:flex">
      {" "}
      {/* يظهر فقط على الشاشات المتوسطة وما فوق */}
      <SidebarHeader className="flex items-center justify-between p-4">
        {open ? (
          <h2 className="text-2xl font-bold text-primary">المحامي الذكي</h2>
        ) : (
          <h2 className="text-2xl font-bold text-primary">💼</h2> // أيقونة صغيرة عند التصغير
        )}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>التطبيق</SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuButton
                asChild
                key={item.href}
                isActive={pathname === item.href}
              >
                <Link href={item.href}>
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>الإعدادات</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuButton
              asChild
              isActive={pathname === "/dashboard/settings"}
            >
              <Link href="/dashboard/settings">
                <Settings className="h-5 w-5" />
                <span>الإعدادات</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="flex items-center justify-between p-4">
        {/* زر تبديل الثيم */}
        <ModeToggle />
        {/* زر تسجيل الخروج يظهر فقط عندما يكون الشريط الجانبي مفتوحاً */}

        {open && (
          <div>
            {status === "authenticated" && (
              <Button
                onClick={() => signOut({ callbackUrl: "/auth/login" })}
                variant="ghost"
                className="flex items-center text-red-500 hover:bg-red-500/10 hover:text-red-600 px-4 py-2 rounded-md transition-colors duration-200"
              >
                <LogOut className="h-5 w-5 ml-2" />
                <span>تسجيل الخروج</span>
              </Button>
            )}
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
