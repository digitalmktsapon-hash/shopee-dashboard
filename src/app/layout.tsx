import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Changed font to Inter for premium look
import "./globals.css";
import { AppShell } from "@/components/Layout/AppShell";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PhamThang PTS Dashboard",
  description: "Advanced Shopee Data Analytics & BI System for Shopee Sellers",
};

import { AuthProvider } from "@/contexts/AuthContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning>
        <AuthProvider>
          <AppShell>
            {children}
          </AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
