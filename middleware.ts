import { getToken } from "next-auth/jwt";
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
export default withAuth(
  async function middleware(req) {
    // جلب الـ token مع التحقق من سرية  nextauth
    const token = await getToken({
      req,
      secret: process.env.AUTH_SECRET,
    });
    // تضبيطات توضيح الـ token  لتتمكن من تتبع المشكلة الفعلية
    console.log("token", token);
    const isAuth = !!token; // التحقق لو فيه توكن موجودة
    const isAuthPage = req.nextUrl.pathname.startsWith("/login");

    if (isAuthPage && isAuth) {
      return NextResponse.redirect(new URL("/home", req.url));
    }
    if (!isAuth && !isAuthPage) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      async authorized() {
        // This is a work-around for handling redirect on auth pages.
        return true;
      },
    },
  }
);

export const config = {
  matcher: ["/:path*"],
};
