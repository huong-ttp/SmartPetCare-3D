"use client";

/**
 * auth-context.tsx
 * AuthContext: quản lý JWT, user, role, logout, route guard.
 * Sử dụng localStorage để persist session.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import type { User, UserRole } from "@/types/user.type";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (token: string, user: User) => void;
  logout: () => void;
  /** Route guard — redirect nếu chưa login hoặc sai role */
  requireRole: (role: UserRole | UserRole[]) => boolean;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "spc_access_token";
const USER_KEY  = "spc_user";

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Cookie helpers đồng bộ giữa Client và Server/Middleware
  const setAuthCookie = (token: string) => {
    if (typeof document !== "undefined") {
      document.cookie = `spc_access_token=${encodeURIComponent(token)}; path=/; max-age=604800; SameSite=Lax`;
    }
  };

  const removeAuthCookie = () => {
    if (typeof document !== "undefined") {
      document.cookie = "spc_access_token=; path=/; max-age=0; SameSite=Lax";
    }
  };

  // Hydrate từ localStorage khi mount
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const raw   = localStorage.getItem(USER_KEY);

    if (token && raw) {
      try {
        const user: User = JSON.parse(raw);
        setAuthCookie(token);
        setState({ user, token, isLoading: false, isAuthenticated: true });
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        removeAuthCookie();
        setState((s) => ({ ...s, isLoading: false }));
      }
    } else {
      removeAuthCookie();
      setState((s) => ({ ...s, isLoading: false }));
    }
  }, []);

  const login = useCallback((token: string, user: User) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    setAuthCookie(token);
    setState({ user, token, isLoading: false, isAuthenticated: true });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    removeAuthCookie();
    setState({ user: null, token: null, isLoading: false, isAuthenticated: false });
    router.push("/");
  }, [router]);

  const requireRole = useCallback(
    (role: UserRole | UserRole[]): boolean => {
      /**
       * QUAN TRỌNG: Trong khi isLoading=true, AuthProvider đang đọc
       * localStorage — chưa biết user có auth hay không.
       * Tuyệt đối KHÔNG redirect ở đây, trả về false để layout
       * hiển thị spinner và chờ hydrate xong.
       */
      if (state.isLoading) return false;

      // Hydrate xong, chưa đăng nhập → đá về /login
      if (!state.isAuthenticated || !state.user) {
        router.push("/login");
        return false;
      }

      // Đăng nhập nhưng sai role → về trang chủ
      const allowed = Array.isArray(role) ? role : [role];
      if (!allowed.includes(state.user.role)) {
        router.push("/");
        return false;
      }

      return true;
    },
    [state.isLoading, state.isAuthenticated, state.user, router]
  );

  return (
    <AuthContext.Provider value={{ ...state, login, logout, requireRole }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
