"use client"

import { Geist, Geist_Mono, Inter} from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext"
import { Toaster } from "@/components/ui/sonner"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
          {children}
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
