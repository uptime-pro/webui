"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { apiRequest } from "@/lib/api";
import { useAuthStore } from "@/stores/auth.store";
import type { User } from "@/types/auth";

export function useAuth() {
  const { user, isLoading, isAuthenticated, setUser, clearUser, setLoading } =
    useAuthStore();
  const router = useRouter();

  const fetchMe = useCallback(async () => {
    setLoading(true);
    try {
      const me = await apiRequest<User>("/api/v1/auth/me");
      setUser(me);
    } catch {
      clearUser();
    }
  }, [setUser, clearUser, setLoading]);

  const login = useCallback(
    async (credentials: {
      username: string;
      password: string;
      totpCode?: string;
    }) => {
      const me = await apiRequest<User>("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      });
      setUser(me);
      router.push("/dashboard");
    },
    [setUser, router],
  );

  const logout = useCallback(async () => {
    await apiRequest("/api/v1/auth/logout", { method: "POST" }).catch(() => {});
    clearUser();
    router.push("/login");
  }, [clearUser, router]);

  return { user, isLoading, isAuthenticated, login, logout, fetchMe };
}
