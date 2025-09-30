/* eslint-disable @typescript-eslint/no-explicit-any */
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

  // Sessions - إزالة requireOwnership
  "/dashboard/sessions": { category: "sessions", action: "view" },

  // Documents
  // "/dashboard/documents/upload": { category: "documents", action: "upload" },
  // "/dashboard/documents/[id]": { category: "documents", action: "view" },

  // Financial
  "/dashboard/reports": { category: "reports", action: "viewFinancial" },
  "/dashboard/financial": { category: "financial", action: "viewReports" },
  "/dashboard/invoices": { category: "financial", action: "createInvoices" },

  // Settings - إضافة مسارات الإعدادات
  "/dashboard/settings": { category: "firmSettings", action: "viewSettings" },
  "/dashboard/settings/profile": { category: "firmSettings", action: "viewSettings" },
  "/dashboard/settings/notifications": { category: "firmSettings", action: "viewSettings" },
  "/dashboard/settings/security": { category: "firmSettings", action: "viewSettings" },

  // Employees (Owner only)
  "/dashboard/employees": { category: "employees", action: "view", requireOwnership: true },
  "/dashboard/employees/add": { category: "employees", action: "create", requireOwnership: true },
  "/dashboard/employees/[id]/edit": { category: "employees", action: "edit", requireOwnership: true },

  // Advanced Settings (Owner only)
  "/dashboard/settings/user-management": { category: "firmSettings", action: "viewSettings", },
  "/dashboard/settings/subscription": { category: "subscription", action: "subscription",requireOwnership: true },
};

// 🔍 Debug helper
function debugLog(message: string, data?: any) {
  console.log(`🔍 [Middleware] ${message}`, data ? JSON.stringify(data, null, 2) : "");
}

// 🛠️ دالة لمطابقة المسارات (ثابتة أو ديناميكية)
function matchRoute(pathname: string): RoutePermission | null {
  for (const route in routePermissions) {
    if (route.includes("[id]")) {
      const regex = new RegExp("^" + route.replace(/\[id\]/g, "[^/]+") + "$");
      if (regex.test(pathname)) return routePermissions[route];
    } else {
      if (pathname === route) return routePermissions[route];
    }
  }
  return null;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Skip middleware for API routes and static files
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.includes(".") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  debugLog(`🚀 Processing: ${pathname}`);

  // Get token to check if user is authenticated
  let token = null;
  try {
    const cookieName = req.nextUrl.hostname.includes('vercel.app') 
      ? '__Secure-next-auth.session-token'
      : 'next-auth.session-token';
    
    token = await getToken({ 
      req, 
      secret: process.env.NEXTAUTH_SECRET,
      cookieName: cookieName,
      secureCookie: req.nextUrl.hostname.includes('vercel.app')
    });
    
    debugLog("Token found:", token ? "✅" : "❌");
    
  } catch (error) {
    debugLog("❌ Token error:", error);
  }

  // 🏠 If user is authenticated and on home page, redirect to dashboard
  if (token && pathname === "/") {
    debugLog("✅ Authenticated user on home page - redirecting to dashboard");
    return NextResponse.redirect(new URL("/dashboard", req.url));
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
    "/dashboard/unauthorized"
  ];

  const isPublicPage = publicPages.some(page => 
    pathname === page || pathname.startsWith(page + "/")
  );

  if (isPublicPage) {
    debugLog("✅ Public page - allowing access");
    return NextResponse.next();
  }

  // Check if it's a protected dashboard route
  if (!pathname.startsWith("/dashboard")) {
    debugLog("ℹ️ Not a dashboard route - allowing access");
    return NextResponse.next();
  }

  debugLog("🔒 Dashboard route detected - checking auth");

  // If no token, redirect to login
  if (!token) {
    debugLog("🚫 No token - redirecting to login");
    return NextResponse.redirect(
      new URL(`/auth/login?callbackUrl=${encodeURIComponent(pathname)}`, req.url)
    );
  }

  // Create user object from token
  const user = {
    id: token.sub || token.id,
    email: token.email,
    accountType: token.accountType,
    role: token.role,
    permissions: token.permissions,
    isActive: token.isActive,
    ownerId: token.ownerId,
    ...(token.user && typeof token.user === 'object' ? token.user : {}),
  };

  debugLog("User data:", { 
    id: user.id, 
    email: user.email, 
    accountType: user.accountType,
    isActive: user.isActive 
  });

  // Check if account is active
  if (user.isActive === false) {
    debugLog("🚫 Account disabled");
    return NextResponse.redirect(
      new URL("/auth/login?error=account_disabled", req.url)
    );
  }

  // Check route permissions
  const requiredPermission = matchRoute(pathname);
  if (requiredPermission) {
    debugLog("🔐 Checking permissions for:", requiredPermission);
    
    const permissionResult = checkUserPermission(user, requiredPermission);
    
    if (!permissionResult.hasPermission) {
      debugLog("🚫 Permission denied:", permissionResult.reason);
      return NextResponse.redirect(
        new URL(`/dashboard/unauthorized?reason=${encodeURIComponent(permissionResult.reason)}`, req.url)
      );
    }
    
    debugLog("✅ Permission granted");
  }

  // Add user info to headers for pages to use
  const response = NextResponse.next();
  response.headers.set('x-user-id', user.id || '');
  response.headers.set('x-user-email', user.email || '');
  
  debugLog("✅ Access granted - proceeding");
  return response;
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

  // owner full access (except ownership-required routes)
  if (user.accountType === "owner") {
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
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)",
  ],
};