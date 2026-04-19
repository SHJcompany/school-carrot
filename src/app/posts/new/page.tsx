"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

export default function NewPostPage() {
  const router = useRouter();
  const { user, requireAuth } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []).slice(0, 5);
    setFiles(selected);
    setPreviews(selected.map((f) => URL.createObjectURL(f)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      requireAuth(() => {});
      return;
    }
    if (!title.trim() || !description.trim() || !price) {
      setError("모든 필드를 입력하세요.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const imageUrls: string[] = [];
      for (const file of files) {
        const storageRef = ref(storage, `posts/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        imageUrls.push(url);
      }

      const docRef = await addDoc(collection(db, "posts"), {
        title: title.trim(),
        description: description.trim(),
        price: Number(price),
        images: imageUrls,
        status: "ACTIVE",
        authorId: user.id,
        authorNickname: user.nickname,
        createdAt: new Date(),
      });
      router.push(`/posts/${docRef.id}`);
    } catch {
      setError("게시글 등록에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

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

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <h1 className="text-lg font-bold text-gray-900 mb-4">글쓰기</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">사진 (최대 5장)</label>
          <input type="file" accept="image/*" multiple onChange={handleFiles} className="text-sm text-gray-600" />
          {previews.length > 0 && (
            <div className="flex gap-2 mt-2 flex-wrap">
              {previews.map((src, i) => (
                <div key={i} className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                  <Image src={src} alt="" width={80} height={80} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">제목</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="글 제목을 입력하세요"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">희망 가격 (P)</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0"
            min="0"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">내용</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="물품 상태, 거래 방법 등을 자유롭게 적어주세요."
            rows={5}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold hover:bg-orange-600 disabled:opacity-50"
        >
          {loading ? "등록 중..." : "등록하기"}
        </button>
      </form>
    </div>
  );
}
