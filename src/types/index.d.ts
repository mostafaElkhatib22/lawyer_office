/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// types/next-auth.d.ts
import NextAuth, { DefaultSession, DefaultJWT } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      accountType: 'owner' | 'employee';
      department: string;
      permissions: any;
      ownerId: string;
    authProvider?:any;
      firmInfo?: any;
      ownerName?: string;
      firmName?: string;
      isActive: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: string;
    accountType: 'owner' | 'employee';
    department: string;
    permissions: any;
    ownerId: string;
    firmInfo?: any;
    authProvider?:any;
    ownerName?: string;
    firmName?: string;
    isActive: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: string;
    accountType: 'owner' | 'employee';
    department: string;
    permissions: any;
    ownerId: string;
    firmInfo?: any;
    ownerName?: string;
    firmName?: string;
    isActive: boolean;
  }
}