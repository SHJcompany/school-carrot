"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ChatRoom } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

export default function ChatListPage() {
  const { user, requireAuth } = useAuth();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const q = query(
      collection(db, "chatRooms"),
      where("participants", "array-contains", user.id)
    );
    getDocs(q).then((snap) => {
      const list = snap.docs.map((d) => {
        const data = d.data();
        return {
          ...data,
          id: d.id,
          createdAt: data.createdAt?.toDate?.() ?? new Date(),
        } as ChatRoom;
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRooms(list);
      setLoading(false);
    });
  }, [user]);

  if (!user) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 mb-4">로그인이 필요합니다.</p>
        <button
          onClick={() => requireAuth(() => {})}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg font-semibold"
        >
          로그인
        </button>
      </div>
    );
  }

  if (loading) return <div className="text-center py-20 text-gray-400">불러오는 중...</div>;

  return (
    <div>
      <h1 className="text-lg font-bold text-gray-800 mb-4">채팅 목록</h1>
      {rooms.length === 0 ? (
        <div className="text-center py-20 text-gray-400">채팅 내역이 없습니다.</div>
      ) : (
        <ul className="space-y-2">
          {rooms.map((room) => {
            const other = room.participantNicknames.find((n) => n !== user.nickname) ?? "알 수 없음";
            return (
              <li key={room.id}>
                <Link
                  href={`/chat/${room.id}`}
                  className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition"
                >
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 font-bold text-sm">
                    {other[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{other}</p>
                    <p className="text-xs text-gray-400 truncate">{room.postTitle}</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
