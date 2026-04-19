import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import AuthModalWrapper from "@/components/AuthModalWrapper";

export const metadata: Metadata = {
  title: "학교당근",
  description: "학교 중고거래 플랫폼",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-gray-50 min-h-screen">
        <AuthProvider>
          <Navbar />
          <main className="max-w-2xl mx-auto px-4 py-4">{children}</main>
          <AuthModalWrapper />
        </AuthProvider>
      </body>
    </html>
  );
}
