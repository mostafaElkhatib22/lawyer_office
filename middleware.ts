import { getToken } from "next-auth/jwt";
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  async function middleware(req) {
    const token = await getToken({
      req,
      secret: process.env.AUTH_SECRET,
    });

    console.log("token:", token); // ✅ تتبع الجلسة في Vercel Logs

    const isAuth = !!token;
    const isAuthPage = req.nextUrl.pathname.startsWith("/login");

    if (isAuthPage && isAuth) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    if (!isAuth && !isAuthPage) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      async authorized({ req }) {
        const token = await getToken({ req, secret: process.env.AUTH_SECRET });
        return !!token; // ✅ السماح فقط للمستخدمين المصادقين
      },
    },
  }
);

// ✅ تجنب التأثير على API Routes الخاصة بالمصادقة
export const config = {
  matcher: ["/((?!api/auth).*)"],
};
