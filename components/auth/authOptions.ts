import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import User from "@/models/User";
import connectMongoDB from "@/lib/db_connect";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      password?: string;
    };
  }
}

export const authOptions: NextAuthOptions = {
  debug: true, // تمكين الـ debug لمتابعة أي مشاكل في Vercel
  secret: process.env.AUTH_SECRET, // التأكد من استخدام NEXTAUTH_SECRET
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      id: "credentials",
      credentials: {
        email: {
          label: "Email",
          type: "text",
          placeholder: "test@example.com",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        await connectMongoDB();
        const email = credentials?.email;
        const password = credentials?.password;

        if (!email || !password) return null;

        const user = await User.findOne({ email });
        if (!user) return null;

        const passwordOk =
          user.password && bcrypt.compareSync(password, user.password);
        if (!passwordOk) return null;

        return {
          id: (user as any)._id.toString(),
          name: (user as any).username,
          email: user.email,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
};

export default NextAuth(authOptions);
