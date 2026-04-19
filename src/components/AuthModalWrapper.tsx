"use client";

import { useAuth } from "@/contexts/AuthContext";
import AuthModal from "./AuthModal";

export default function AuthModalWrapper() {
  const { showAuthModal } = useAuth();
  return showAuthModal ? <AuthModal /> : null;
}
