"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function Navbar() {
  const { user, logout, setShowAuthModal } = useAuth();

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="text-orange-500 font-bold text-xl">
          🥕 학교당근
        </Link>
        <div className="flex items-center gap-3 text-sm">
          {user ? (
            <>
              <Link href={`/profile/${user.nickname}`} className="font-semibold text-gray-700 hover:text-orange-500">
                {user.nickname}
              </Link>
              <span className="text-gray-400">|</span>
              <Link href="/chat" className="text-gray-600 hover:text-orange-500">
                채팅
              </Link>
              <span className="text-gray-400">|</span>
              <button onClick={logout} className="text-gray-500 hover:text-red-500">
                로그아웃
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="bg-orange-500 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-orange-600"
            >
              로그인
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
