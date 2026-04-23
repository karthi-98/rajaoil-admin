import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AdminShell } from "@/components/AdminShell"
import { AuthProvider } from "@/contexts/AuthContext"
import { Toaster } from "@/components/ui/sonner"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Mithra Oil Admin",
    template: "%s | Mithra Oil Admin",
  },
  description: "Admin panel for managing Mithra Oil products, orders, media, and contact forms.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} antialiased`}
      >
        <AuthProvider>
          <AdminShell>
            {children}
          </AdminShell>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
