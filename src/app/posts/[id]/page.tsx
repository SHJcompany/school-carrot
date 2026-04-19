"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Post } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "판매중",
  RESERVED: "예약중",
  SOLD: "거래완료",
};

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, requireAuth } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);

  useEffect(() => {
    if (!id) return;
    getDoc(doc(db, "posts", id)).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setPost({ ...data, id: snap.id, createdAt: data.createdAt?.toDate?.() ?? new Date() } as Post);
      }
      setLoading(false);
    });
  }, [id]);

  async function startChat() {
    if (!user || !post) return;
    if (user.id === post.authorId) return;
    setChatLoading(true);
    try {
      const q = query(
        collection(db, "chatRooms"),
        where("postId", "==", post.id),
        where("participants", "array-contains", user.id)
      );
      const snap = await getDocs(q);
      const existing = snap.docs.find((d) =>
        d.data().participants.includes(post.authorId)
      );
      if (existing) {
        router.push(`/chat/${existing.id}`);
        return;
      }
      const newRoom = await addDoc(collection(db, "chatRooms"), {
        postId: post.id,
        postTitle: post.title,
        participants: [user.id, post.authorId],
        participantNicknames: [user.nickname, post.authorNickname],
        createdAt: new Date(),
      });
      router.push(`/chat/${newRoom.id}`);
    } finally {
      setChatLoading(false);
    }
  }

  async function updateStatus(status: "ACTIVE" | "RESERVED" | "SOLD") {
    if (!post) return;
    await updateDoc(doc(db, "posts", post.id), { status });
    setPost({ ...post, status });
  }

  if (loading) return <div className="text-center py-20 text-gray-400">불러오는 중...</div>;
  if (!post) return <div className="text-center py-20 text-gray-400">게시글을 찾을 수 없습니다.</div>;

  const isAuthor = user?.id === post.authorId;

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {post.images.length > 0 && (
        <div className="relative bg-gray-100 aspect-square">
          <Image
            src={post.images[imgIdx]}
            alt={post.title}
            fill
            className="object-contain"
          />
          {post.images.length > 1 && (
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
              {post.images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setImgIdx(i)}
                  className={`w-2 h-2 rounded-full ${i === imgIdx ? "bg-orange-500" : "bg-gray-300"}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h1 className="text-xl font-bold text-gray-900">{post.title}</h1>
          <span className="text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded-full flex-shrink-0">
            {STATUS_LABEL[post.status]}
          </span>
        </div>
        <p className="text-orange-500 font-bold text-lg mb-3">{post.price.toLocaleString()}P</p>
        <p className="text-gray-600 text-sm whitespace-pre-wrap mb-4">{post.description}</p>

        <div className="flex items-center justify-between text-xs text-gray-400 border-t pt-3">
          <Link href={`/profile/${post.authorNickname}`} className="hover:underline font-medium text-gray-600">
            {post.authorNickname}
          </Link>
          <span>{new Date(post.createdAt).toLocaleDateString("ko-KR")}</span>
        </div>

        {isAuthor ? (
          <div className="mt-4 space-y-2">
            <p className="text-xs text-gray-500 font-semibold">상태 변경</p>
            <div className="flex gap-2">
              {(["ACTIVE", "RESERVED", "SOLD"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => updateStatus(s)}
                  className={`flex-1 py-1.5 rounded-lg text-sm font-semibold border ${
                    post.status === s
                      ? "bg-orange-500 text-white border-orange-500"
                      : "border-gray-300 text-gray-600 hover:border-orange-400"
                  }`}
                >
                  {STATUS_LABEL[s]}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <button
            onClick={() => requireAuth(startChat)}
            disabled={chatLoading || post.status === "SOLD"}
            className="mt-4 w-full bg-orange-500 text-white py-3 rounded-xl font-bold hover:bg-orange-600 disabled:opacity-50"
          >
            {chatLoading ? "채팅방 이동 중..." : "채팅하기"}
          </button>
        )}
      </div>
    </div>
  );
}
