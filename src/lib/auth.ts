/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/auth.ts
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import bcrypt from "bcryptjs";
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
     async authorize(credentials): Promise<any> {
        await dbConnect();

        const email = credentials?.email;
        const password = credentials?.password;

        const user = await User.findOne({ email }).select("+password").populate('ownerId', 'name firmInfo.firmName');

        if (!user) {
          throw new Error("لا يوجد مستخدم بهذا البريد الإلكتروني.");
        }

        // التحقق من أن الحساب نشط
        if (!user.isActive) {
          throw new Error("تم تعطيل حسابك. يرجى الاتصال بالإدارة.");
        }

        const passwordOk = user && password && typeof user.password === "string" && 
                          bcrypt.compareSync(password, user.password);

        if (!passwordOk) { 
          throw new Error("كلمة المرور غير صحيحة.");
        }

        // تحديث تاريخ آخر تسجيل دخول
        user.lastLogin = new Date();
        await user.save();

        // إرجاع بيانات المستخدم مع معلومات المكتب
        if (passwordOk) {
          const userData = {
           id: (user as any)._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            accountType: user.accountType,
            department: user.department,
            permissions: user.permissions,
          };

          // إضافة معلومات المكتب
          if (user.accountType === 'owner') {
            userData.firmInfo = user.firmInfo;
            userData.ownerId = user._id.toString(); // المالك هو نفسه
          } else if (user.ownerId) {
            userData.ownerId = user.ownerId.toString();
            userData.ownerName = user.ownerId.name;
            userData.firmName = user.ownerId.firmInfo?.firmName || 'غير محدد';
          }

          return userData;
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.accountType = user.accountType;
        token.department = user.department;
        token.permissions = user.permissions;
        token.ownerId = user.ownerId;
        token.firmInfo = user.firmInfo;
        token.ownerName = user.ownerName;
        token.firmName = user.firmName;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.accountType = token.accountType as 'owner' | 'employee';
        session.user.department = token.department as string;
        session.user.permissions = token.permissions;
        session.user.ownerId = token.ownerId as string;
        session.user.firmInfo = token.firmInfo;
        session.user.ownerName = token.ownerName as string;
        session.user.firmName = token.firmName as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
};