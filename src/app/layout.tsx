import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ABCD ERP System",
  description: "All Business Centralized Data ERP System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-screen w-screen overflow-hidden flex bg-[#fafbfc] text-slate-800 antialiased">
        {/* Left Side: Collapsible Sidebar */}
        <Sidebar />

        {/* Right Side: Fluid main panel container */}
        <div className="flex-1 h-full overflow-y-auto flex flex-col relative">
          {children}
        </div>
      </body>
    </html>
  );
}
