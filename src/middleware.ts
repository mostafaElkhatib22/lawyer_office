/* eslint-disable @typescript-eslint/no-unused-vars */
// src/middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import jwt from "jsonwebtoken";

interface RoutePermission {
  category: string;
  action: string;
  requireOwnership?: boolean;
}

// 🛑 خريطة الصلاحيات المطلوبة لكل صفحة (ثابتة أو ديناميكية)
const routePermissions: Record<string, RoutePermission> = {
  // Cases
  "/dashboard/add-case": { category: "cases", action: "create"},
  "/dashboard/all-cases": { category: "cases", action: "viewAll" },

  "/dashboard/cases/[id]/single_case": { category: "cases", action: "view" },
  "/dashboard/cases/[id]/edit": { category: "cases", action: "edit" },

  // Clients
  "/dashboard/clients/add-client": { category: "clients", action: "create" },
  "/dashboard/clients/all_clients": { category: "clients", action: "view" },
  "/dashboard/clients/edit/[id]": { category: "clients", action: "edit" },

  // Appointments
  "/dashboard/appointments/add": { category: "appointments", action: "create" },
  "/dashboard/appointments/[id]": { category: "appointments", action: "view" },
  "/dashboard/appointments/[id]/edit": { category: "appointments", action: "edit" },

  // Documents
  "/dashboard/documents/upload": { category: "documents", action: "upload" },
  "/dashboard/documents/[id]": { category: "documents", action: "view" },

  // Financial
  "/dashboard/reports/financial": { category: "reports", action: "viewFinancial" },
  "/dashboard/financial": { category: "financial", action: "viewReports" },
  "/dashboard/invoices": { category: "financial", action: "createInvoices" },

  // Employees (Owner only)
  "/dashboard/employees": { category: "employees", action: "view", requireOwnership: true },
  "/dashboard/employees/add": { category: "employees", action: "create", requireOwnership: true },
  "/dashboard/employees/[id]/edit": { category: "employees", action: "edit", requireOwnership: true },

  // Settings
  "/dashboard/settings": { category: "firmSettings", action: "viewSettings" },
  "/dashboard/settings/firm": { category: "firmSettings", action: "editSettings", requireOwnership: true },
};

// 🔍 Debug helper
function debugLog(message: string, data?: any) {
  if (process.env.NODE_ENV === "development") {
    console.log(`🔍 [Middleware Debug] ${message}`, data ? JSON.stringify(data, null, 2) : "");
  }
}

// 🛠️ دالة لمطابقة المسارات (ثابتة أو ديناميكية)
function matchRoute(pathname: string): RoutePermission | null {
  for (const route in routePermissions) {
    if (route.includes("[id]")) {
      const regex = new RegExp("^" + route.replace("[id]", "[^/]+") + "$");
      if (regex.test(pathname)) return routePermissions[route];
    } else {
      if (pathname === route) return routePermissions[route];
    }
  }
  return null;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  debugLog(`🚀 Request to: ${pathname}`);

  // 🚨 NextAuth API routes allowed
  if (pathname.startsWith("/api/auth/")) return NextResponse.next();

  // static files allowed
  if (
    pathname.startsWith("/_next/static") ||
    pathname.startsWith("/_next/image") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/images/") ||
    pathname.startsWith("/icons/")
  ) {
    return NextResponse.next();
  }

  // 🏠 Public pages
  const publicPages = [
    "/",
    "/about",
    "/contact",
    "/pricing",
    "/features",
    "/auth/login",
    "/auth/register",
    "/auth/forgot-password",
    "/dashboard/unauthorized", // unauthorized page
  ];

  if (publicPages.some((page) => pathname === page || pathname.startsWith(page + "/"))) {
    debugLog("✅ Public page - allowing access");
    return NextResponse.next();
  }

  // 📱 Protected pages
  const protectedPages = ["/dashboard", "/profile", "/settings", "/admin"];
  const isProtectedPage = protectedPages.some((page) => pathname.startsWith(page));

  if (!isProtectedPage) {
    debugLog("ℹ️ Not a protected page - allowing access");
    return NextResponse.next();
  }

  debugLog("🔒 Protected page detected");

  // 🧑‍💻 extract user
  let user: any = null;
  let isAuth = false;

  // 1. try next-auth token
  try {
    const nextAuthToken = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (nextAuthToken) {
      isAuth = true;
      user = {
        id: nextAuthToken.sub || nextAuthToken.id,
        email: nextAuthToken.email,
        accountType: nextAuthToken.accountType,
        role: nextAuthToken.role,
        permissions: nextAuthToken.permissions,
        isActive: nextAuthToken.isActive,
        ownerId: nextAuthToken.ownerId,
        ...nextAuthToken.user,
      };
    }
  } catch (error) {
    debugLog("❌ NextAuth token error", error);
  }

  // 2. try JWT header
  if (!isAuth) {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.split(" ")[1];
    if (token) {
      try {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
        isAuth = true;
        user = decoded;
      } catch (error) {
        debugLog("❌ JWT token error", error);
      }
    }
  }

  // 🚫 Not authenticated
  if (!isAuth || !user) {
    return NextResponse.redirect(new URL("/auth/login?callbackUrl=" + encodeURIComponent(pathname), req.url));
  }

  // 🛡️ Check active status
  if (user.isActive === false) {
    return NextResponse.redirect(new URL("/auth/login?error=account_disabled", req.url));
  }

  // 🔒 Route permission check (مع دعم dynamic routes)
  const requiredPermission = matchRoute(pathname);
  if (requiredPermission) {
    const permissionResult = checkUserPermission(user, requiredPermission);
    if (!permissionResult.hasPermission) {
      return NextResponse.redirect(
        new URL(`/dashboard/unauthorized?reason=${encodeURIComponent(permissionResult.reason)}`, req.url)
      );
    }
  }

  return NextResponse.next();
}

// 🔧 check permissions
function checkUserPermission(
  user: any,
  permission: RoutePermission
): { hasPermission: boolean; reason: string } {
  const { category, action, requireOwnership } = permission;

  // require owner
  if (requireOwnership && user.accountType !== "owner") {
    return { hasPermission: false, reason: "هذه العملية متاحة لصاحب المكتب فقط" };
  }

  // owner full access
  if (user.accountType === "owner" && !requireOwnership) {
    return { hasPermission: true, reason: "Owner has full access" };
  }

  if (!user.permissions) {
    return { hasPermission: false, reason: "لا توجد صلاحيات محددة لحسابك" };
  }

  let hasPermission = false;

  // Object case
  if (typeof user.permissions === "object" && !Array.isArray(user.permissions)) {
    const categoryPermissions = user.permissions[category];
    if (categoryPermissions && categoryPermissions[action] === true) {
      hasPermission = true;
    }
  }

  // Array case
  if (Array.isArray(user.permissions)) {
    const permKey = `${category}.${action}`;
    if (user.permissions.includes(permKey)) {
      hasPermission = true;
    }
  }

  if (!hasPermission) {
    return { hasPermission: false, reason: `ليس لديك صلاحية ${action} في ${category}` };
  }

  return { hasPermission: true, reason: "Permission granted" };
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
