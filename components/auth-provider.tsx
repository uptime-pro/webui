"use client";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { fetchMe } = useAuth();
  useEffect(() => {
    fetchMe();
  }, [fetchMe]);
  return <>{children}</>;
}
