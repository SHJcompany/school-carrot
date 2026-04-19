export interface User {
  id: string;
  nickname: string;
  passwordHash: string;
  points: number;
  createdAt: Date;
}

export interface Post {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  status: "ACTIVE" | "RESERVED" | "SOLD";
  authorId: string;
  authorNickname: string;
  createdAt: Date;
}

export interface ChatRoom {
  id: string;
  postId: string;
  postTitle: string;
  participants: string[];
  participantNicknames: string[];
  createdAt: Date;
}

export interface Message {
  id: string;
  senderId: string;
  senderNickname: string;
  content: string;
  createdAt: Date;
}

export interface PointTransaction {
  id: string;
  senderId: string;
  receiverId: string;
  amount: number;
  memo: string;
  createdAt: Date;
}

export interface AuthUser {
  id: string;
  nickname: string;
  points: number;
}
