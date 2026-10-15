
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { queryClient } from "../lib/query-client";
import api from "../lib/api";
import { tokenStorage } from "../lib/token-storage";
import type {
  AuthUser,
  LoginInput,
  RegisterInput,
  AuthResponse,
  RefreshResponse,
   UpdateProfileInput,
  ChangePasswordInput,
} from "../types/auth";

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<AuthUser>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (input: UpdateProfileInput) => Promise<void>;
  changePassword: (input: ChangePasswordInput) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

let restorePromise: Promise<AuthUser> | null = null;

async function restoreSession(): Promise<AuthUser> {
  const refresh = await api.post<RefreshResponse>(
    "/auth/refresh",
    {},
    { withCredentials: true },
  );
  tokenStorage.setAccessToken(refresh.data.token);

  const me = await api.get<{ user: AuthUser }>("/auth/me", {
  headers: {
    Authorization: `Bearer ${tokenStorage.getAccessToken()}`,
  },
});
  return me.data.user;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = user !== null;


  
  useEffect(() => {
    let active = true;

    restorePromise ??= restoreSession().finally(() => {
      restorePromise = null;
    });

    restorePromise
      .then((u) => {
        if (active) setUser(u);
      })
      .catch(() => {
        tokenStorage.clearTokens();
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  
  useEffect(() => {
    const handleAuthLogout = () => {
      tokenStorage.clearTokens();
      queryClient.clear();
      setUser(null);
    };

    window.addEventListener("auth:logout", handleAuthLogout);

    return () => {
      window.removeEventListener("auth:logout", handleAuthLogout);
    };
  }, []);

  const login = async (input: LoginInput) => {
    const response = await api.post<AuthResponse>(
      "/auth/login",
      input,
      { withCredentials: true },
    );

    tokenStorage.setAccessToken(response.data.token);
    setUser(response.data.user);
    return response.data.user;
  };

  const register = async (input: RegisterInput) => {
    await api.post("/auth/register", input);
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout", {}, { withCredentials: true });
    } finally {
      tokenStorage.clearTokens();
      queryClient.clear();
      setUser(null);
    }
  };
    const updateProfile = async (input: UpdateProfileInput) => {
      const response = await api.put<{ user: AuthUser }>("/auth/me/update", input);
      setUser(response.data.user);
    };

    const changePassword = async (input: ChangePasswordInput) => {
      await api.patch("/auth/me/password", input);
    };
  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}