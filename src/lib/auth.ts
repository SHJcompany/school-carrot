import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
  updateDoc,
} from "firebase/firestore";
import bcrypt from "bcryptjs";
import { db } from "./firebase";
import { AuthUser } from "@/types";

const USERS_COLLECTION = "users";

export async function loginOrRegister(
  nickname: string,
  password: string
): Promise<AuthUser> {
  const usersRef = collection(db, USERS_COLLECTION);
  const q = query(usersRef, where("nickname", "==", nickname));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    const passwordHash = await bcrypt.hash(password, 10);
    const newDocRef = doc(usersRef);
    const newUser = {
      nickname,
      passwordHash,
      points: 0,
      createdAt: new Date(),
    };
    await setDoc(newDocRef, newUser);
    return { id: newDocRef.id, nickname, points: 0 };
  }

  const userDoc = snapshot.docs[0];
  const userData = userDoc.data();
  const valid = await bcrypt.compare(password, userData.passwordHash);
  if (!valid) throw new Error("비밀번호가 틀렸습니다.");

  return { id: userDoc.id, nickname: userData.nickname, points: userData.points };
}

export async function refreshUserPoints(userId: string): Promise<number> {
  const ref = doc(db, USERS_COLLECTION, userId);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data().points : 0;
}

export function saveAuthToStorage(user: AuthUser) {
  localStorage.setItem("authUser", JSON.stringify(user));
}

export function loadAuthFromStorage(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("authUser");
  return raw ? JSON.parse(raw) : null;
}

export function clearAuthFromStorage() {
  localStorage.removeItem("authUser");
}
