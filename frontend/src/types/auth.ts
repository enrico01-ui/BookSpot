export type UserRole = "CUSTOMER" | "OWNER" | "ADMIN";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  role: UserRole;
  status: string;
}

export interface UpdateProfileInput {
  name: string;
  phone: string | null;

}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
  avatarUrl?: string;
  role: UserRole;
}

export interface AuthResponse {
  message: string;
  user: AuthUser;
  token: string;
}

export interface RefreshResponse {
  message: string;
  token: string;
}