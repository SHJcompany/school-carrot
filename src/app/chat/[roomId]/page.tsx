"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  collection,
  doc,
  getDoc,
  addDoc,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ChatRoom, Message } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

export default function ChatRoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const { user } = useAuth();
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!roomId) return;
    getDoc(doc(db, "chatRooms", roomId)).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setRoom({ ...data, id: snap.id, createdAt: data.createdAt?.toDate?.() ?? new Date() } as ChatRoom);
      }
    });

    const q = query(
      collection(db, "chatRooms", roomId, "messages"),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setMessages(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            ...data,
            id: d.id,
            createdAt: data.createdAt?.toDate?.() ?? new Date(),
          } as Message;
        })
      );
    });
    return () => unsub();
  }, [roomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !input.trim() || !roomId) return;
    const content = input.trim();
    setInput("");
    await addDoc(collection(db, "chatRooms", roomId, "messages"), {
      senderId: user.id,
      senderNickname: user.nickname,
      content,
      createdAt: new Date(),
    });
  }

  if (!user) return <div className="text-center py-20 text-gray-400">로그인이 필요합니다.</div>;

  const otherNickname = room?.participantNicknames.find((n) => n !== user.nickname) ?? "상대방";

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      <div className="bg-white rounded-t-2xl px-4 py-3 border-b shadow-sm flex-shrink-0">
        <p className="font-bold text-gray-900">{otherNickname}</p>
        {room && <p className="text-xs text-gray-400">{room.postTitle}</p>}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-gray-50">
        {messages.map((msg) => {
          const isMine = msg.senderId === user.id;
          return (
            <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${isMine ? "bg-orange-500 text-white" : "bg-white text-gray-900 shadow-sm"}`}>
                {!isMine && (
                  <p className="text-xs font-semibold mb-1 text-orange-500">{msg.senderNickname}</p>
                )}
                <p>{msg.content}</p>
                <p className={`text-xs mt-1 ${isMine ? "text-orange-200" : "text-gray-400"}`}>
                  {new Date(msg.createdAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} className="bg-white rounded-b-2xl px-4 py-3 border-t flex gap-2 flex-shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="메시지를 입력하세요"
          className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="bg-orange-500 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-orange-600 disabled:opacity-50"
        >
          전송
        </button>
      </form>
    </div>
  );
}
