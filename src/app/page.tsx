"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Post } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "판매중",
  RESERVED: "예약중",
  SOLD: "거래완료",
};
const STATUS_COLOR: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  RESERVED: "bg-yellow-100 text-yellow-700",
  SOLD: "bg-gray-200 text-gray-500",
};

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { requireAuth } = useAuth();

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    getDocs(q).then((snap) => {
      setPosts(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            ...data,
            id: d.id,
            createdAt: data.createdAt?.toDate?.() ?? new Date(),
          } as Post;
        })
      );
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-lg font-bold text-gray-800">중고거래</h1>
        <Link
          href="/posts/new"
          onClick={(e) => {
            e.preventDefault();
            requireAuth(() => (window.location.href = "/posts/new"));
          }}
          className="bg-orange-500 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-orange-600"
        >
          글쓰기
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">불러오는 중...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 text-gray-400">게시글이 없습니다.</div>
      ) : (
        <ul className="space-y-3">
          {posts.map((post) => (
            <li key={post.id}>
              <Link href={`/posts/${post.id}`} className="flex gap-3 bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition">
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  {post.images?.[0] ? (
                    <Image
                      src={post.images[0]}
                      alt={post.title}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">🥕</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-gray-900 truncate">{post.title}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_COLOR[post.status]}`}>
                      {STATUS_LABEL[post.status]}
                    </span>
                  </div>
                  <p className="text-orange-500 font-bold text-sm mt-1">
                    {post.price.toLocaleString()}P
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {post.authorNickname} · {timeAgo(post.createdAt)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function timeAgo(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "방금 전";
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}
