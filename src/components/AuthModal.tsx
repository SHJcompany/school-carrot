"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { loginOrRegister } from "@/lib/auth";

export default function AuthModal() {
  const { login, setShowAuthModal, pendingAction } = useAuth();
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nickname.trim() || !password.trim()) {
      setError("닉네임과 비밀번호를 입력하세요.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const user = await loginOrRegister(nickname.trim(), password);
      login(user);
      setShowAuthModal(false);
      if (pendingAction) pendingAction();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl">
        <h2 className="text-xl font-bold mb-1 text-gray-900">로그인 / 회원가입</h2>
        <p className="text-sm text-gray-500 mb-4">
          닉네임이 없으면 자동으로 가입됩니다.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="닉네임"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-50"
          >
            {loading ? "처리 중..." : "확인"}
          </button>
          <button
            type="button"
            onClick={() => setShowAuthModal(false)}
            className="w-full text-gray-500 text-sm hover:underline"
          >
            취소
          </button>
        </form>
      </div>
    </div>
  );
}
