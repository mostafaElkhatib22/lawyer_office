import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import jwt from "jsonwebtoken";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isLoginPage = pathname.startsWith("/auth/login");

  let isAuth = false;

  // 1. جرب تجيب التوكن من next-auth
  const nextAuthToken = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
  });
  if (nextAuthToken) {
    isAuth = true;
  }

  // 2. لو مفيش → جرب من Authorization header
  if (!isAuth) {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.split(" ")[1];
    if (token) {
      try {
        jwt.verify(token, process.env.JWT_SECRET!);
        isAuth = true;
      } catch {
        isAuth = false;
      }
    }
  }

  // 🚫 مش عامل تسجيل دخول → redirect للـ login مهما كانت الصفحة
  if (!isAuth && !isLoginPage) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  // ✅ عامل تسجيل دخول وحاول يدخل login → redirect للـ dashboard
  if (isAuth && isLoginPage) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  // يطبق على كل الصفحات ماعدا الملفات الداخلية
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
