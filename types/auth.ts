export type Role = "ADMIN" | "EDITOR" | "VIEWER";

export interface User {
  id: number;
  username: string;
  email: string | null;
  role: Role;
  active: boolean;
  twoFaActive: boolean;
  timezone: string | null;
  theme: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}
