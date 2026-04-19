"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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
import { useAuth } from "@/contexts/AuthContext";

interface ProfileUser {
  id: string;
  nickname: string;
  points: number;
}

export default function ProfilePage() {
  const { nickname } = useParams<{ nickname: string }>();
  const { user, refreshPoints } = useAuth();
  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const q = query(collection(db, "users"), where("nickname", "==", decodeURIComponent(nickname)));
    getDocs(q).then((snap) => {
      if (!snap.empty) {
        const d = snap.docs[0];
        setProfile({ id: d.id, nickname: d.data().nickname, points: d.data().points });
      }
      setLoading(false);
    });
  }, [nickname]);

  async function sendPoints() {
    if (!user || !profile) return;
    const n = Number(amount);
    if (!n || n <= 0) { setError("올바른 금액을 입력하세요."); return; }
    if (n > (user.points ?? 0)) { setError("포인트가 부족합니다."); return; }
    setSending(true);
    setError("");
    setSuccess("");
    try {
      await runTransaction(db, async (tx) => {
        const senderRef = doc(db, "users", user.id);
        const receiverRef = doc(db, "users", profile.id);
        const senderSnap = await tx.get(senderRef);
        const receiverSnap = await tx.get(receiverRef);
        const senderPoints = senderSnap.data()?.points ?? 0;
        const receiverPoints = receiverSnap.data()?.points ?? 0;
        if (senderPoints < n) throw new Error("포인트가 부족합니다.");
        tx.update(senderRef, { points: senderPoints - n });
        tx.update(receiverRef, { points: receiverPoints + n });
      });
      await addDoc(collection(db, "pointTransactions"), {
        senderId: user.id,
        receiverId: profile.id,
        amount: n,
        memo: memo.trim() || "포인트 송금",
        createdAt: new Date(),
      });
      await refreshPoints();
      setProfile((p) => p ? { ...p, points: p.points + n } : p);
      setSuccess(`${n.toLocaleString()}P 송금 완료!`);
      setAmount("");
      setMemo("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "송금에 실패했습니다.");
    } finally {
      setSending(false);
    }
  }

  if (loading) return <div className="text-center py-20 text-gray-400">불러오는 중...</div>;
  if (!profile) return <div className="text-center py-20 text-gray-400">사용자를 찾을 수 없습니다.</div>;

  const isSelf = user?.id === profile.id;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-sm p-5 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center text-3xl font-bold text-orange-500">
          {profile.nickname[0]}
        </div>
        <div>
          <p className="text-xl font-bold text-gray-900">{profile.nickname}</p>
          <p className="text-orange-500 font-semibold">{profile.points.toLocaleString()}P</p>
        </div>
      </div>

      {!isSelf && user && (
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h2 className="font-bold text-gray-800 mb-3">포인트 송금</h2>
          <div className="space-y-2">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="송금할 포인트"
              min="1"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="메모 (선택)"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {success && <p className="text-green-600 text-sm font-semibold">{success}</p>}
            <div className="text-xs text-gray-400">내 잔액: {(user.points ?? 0).toLocaleString()}P</div>
            <button
              onClick={sendPoints}
              disabled={sending}
              className="w-full bg-orange-500 text-white py-2.5 rounded-xl font-bold hover:bg-orange-600 disabled:opacity-50"
            >
              {sending ? "처리 중..." : "송금하기"}
            </button>
          </div>
        </div>
      )}

      {isSelf && (
        <div className="bg-white rounded-2xl shadow-sm p-4 text-sm text-gray-500 text-center">
          내 프로필입니다.
        </div>
      )}
    </div>
  );
}
