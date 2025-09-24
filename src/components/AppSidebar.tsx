// src/components/AppSidebar.tsx
"use client";
import { usePathname } from "next/navigation";
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
import { Button } from "./ui/button";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export function AppSidebar() {
  const { status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const { open, setOpen } = useSidebar(); // إضافة setOpen للتحكم في الـ sidebar
  
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

  // دالة للتنقل وإغلاق الـ sidebar
  const handleNavigation = (href: string) => {
    router.push(href);
    // إغلاق الـ sidebar بعد التنقل (خاصة مفيد على الشاشات الصغيرة)
    if (window.innerWidth < 768) { // md breakpoint
      setOpen(false);
    }
  };

  // دالة للتعامل مع إغلاق الـ sidebar عند النقر على الإعدادات
  const handleSettingsNavigation = () => {
    router.push("/dashboard/settings/user-management");
    if (window.innerWidth < 768) {
      setOpen(false);
    }
  };

  return (
    <Sidebar collapsible="icon" className="hidden md:flex">
      <SidebarHeader className="flex items-center justify-between p-4">
        {open ? (
          <h2 className="text-2xl font-bold text-primary">المحامي الذكي</h2>
        ) : (
          <h2 className="text-2xl font-bold text-primary">💼</h2>
        )}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>التطبيق</SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuButton
                key={item.href}
                isActive={pathname === item.href}
                onClick={() => handleNavigation(item.href)}
                className="cursor-pointer"
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </SidebarMenuButton>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>الإعدادات</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuButton
              isActive={pathname === "/dashboard/settings/user-management"}
              onClick={handleSettingsNavigation}
              className="cursor-pointer"
            >
              <Settings className="h-5 w-5" />
              <span>الإعدادات</span>
            </SidebarMenuButton>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="flex items-center justify-between p-4">
        <ModeToggle />
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