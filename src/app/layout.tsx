import { Providers } from "@/components/theme-provider";
import "./globals.css";
import { Inter } from 'next/font/google';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/Sidebar";
import { AppSidebar } from "@/components/AppSidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Lawyer App",
  description: "Multi-tenant lawyer management system",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} >
        <Providers >
          <SidebarProvider  >
            <AppSidebar />
            <main className="flex-1 p-4 md:p-6" >
              <SidebarTrigger />
              {children}
            </main>
          </SidebarProvider>
        </Providers>
      </body>
    </html>
  );
}
