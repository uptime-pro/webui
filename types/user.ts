export interface AppUser {
  id: number;
  username: string;
  email?: string;
  role: "ADMIN" | "EDITOR" | "VIEWER";
  createdAt: string;
}

export interface CreateUserDto {
  username: string;
  email?: string;
  password: string;
  role: "ADMIN" | "EDITOR" | "VIEWER";
}

export interface UpdateUserDto {
  username?: string;
  email?: string;
  role?: "ADMIN" | "EDITOR" | "VIEWER";
}
