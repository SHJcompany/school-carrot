"use client";

import { useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  runTransaction,
  doc,
  addDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState("");
  const [nickname, setNickname] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw }),
    });
    if (res.ok) setAuthed(true);
    else setMessage("비밀번호가 틀렸습니다.");
  }

  async function grantPoints(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(amount);
    if (!nickname.trim() || !n || n <= 0) {
      setMessage("닉네임과 올바른 금액을 입력하세요.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const q = query(collection(db, "users"), where("nickname", "==", nickname.trim()));
      const snap = await getDocs(q);
      if (snap.empty) { setMessage("사용자를 찾을 수 없습니다."); return; }
      const userDoc = snap.docs[0];
      await runTransaction(db, async (tx) => {
        const ref = doc(db, "users", userDoc.id);
        const curr = await tx.get(ref);
        tx.update(ref, { points: (curr.data()?.points ?? 0) + n });
      });
      await addDoc(collection(db, "pointTransactions"), {
        senderId: "admin",
        receiverId: userDoc.id,
        amount: n,
        memo: memo.trim() || "어드민 지급",
        createdAt: new Date(),
      });
      setMessage(`✅ ${nickname}님에게 ${n.toLocaleString()}P 지급 완료!`);
      setNickname("");
      setAmount("");
      setMemo("");
    } catch {
      setMessage("오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  if (!authed) {
    return (
      <div className="max-w-sm mx-auto mt-20 bg-white rounded-2xl shadow-sm p-6">
        <h1 className="text-xl font-bold text-gray-900 mb-4">어드민 로그인</h1>
        <form onSubmit={handleLogin} className="space-y-3">
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="어드민 비밀번호"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          {message && <p className="text-red-500 text-sm">{message}</p>}
          <button type="submit" className="w-full bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600">
            확인
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <h1 className="text-xl font-bold text-gray-900 mb-5">어드민 — 포인트 지급</h1>
      <form onSubmit={grantPoints} className="space-y-3">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">닉네임</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="수신자 닉네임"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">지급 포인트</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            min="1"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">메모 (선택)</label>
          <input
            type="text"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="지급 사유"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
        {message && (
          <p className={`text-sm ${message.startsWith("✅") ? "text-green-600 font-semibold" : "text-red-500"}`}>
            {message}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-orange-500 text-white py-2.5 rounded-xl font-bold hover:bg-orange-600 disabled:opacity-50"
        >
          {loading ? "처리 중..." : "포인트 지급"}
        </button>
      </form>
    </div>
  );
}
