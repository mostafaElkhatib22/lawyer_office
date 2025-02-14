import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";

import { ThemeProvider } from "@/context/ThemeContext";
import { Toaster } from "react-hot-toast";
import AppProvider from "@/components/SessionProvider";
import App from "@/components/SessionProvider";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "مكتب الاستاذ مصطفى الخطيب",
  description: "تم الانشاء بواسطة مصطفى الخطيب",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
      >
        <AppProvider>

        <ThemeProvider>
        <Toaster />
          <Navbar />
             {children}    
        </ThemeProvider>
        </AppProvider>
      </body>
    </html>
  );
}
