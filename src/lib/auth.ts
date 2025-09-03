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
      async authorize(credentials) {
        await dbConnect();

        const email = credentials?.email;
        const password = credentials?.password;

        const user = await User.findOne({ email }).select("+password"); // Retrieve password for comparison

        if (!user) {
          throw new Error("No user found with this email.");
        }
const passwordOk =
          user && password && typeof user.password === "string" && bcrypt.compareSync(password, user.password);
          console.log(passwordOk)
        if (!passwordOk) { 
          throw new Error("Your password not correct.");
         }
        // const isMatch = await user.matchPassword(password);
        // if (!isMatch) {
        //   throw new Error("Your password not correct.");
        // }

        // Return user object, NextAuth will automatically create a session
        if(passwordOk){

          return {
            id: user?._id.toString(), // Important: Convert ObjectId to string
            name: user?.name,
            email: user?.email,
            role: user?.role,
          };
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
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string; // Ensure id is string type
        session.user.role = token.role as string; // Ensure role is string type
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login", // Custom login page
    error: "/auth/login", // Custom error page
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
};
