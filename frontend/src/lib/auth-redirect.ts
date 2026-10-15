import type { UserRole } from "@/types/auth";

const DEFAULT_ROUTE: Record<UserRole, string> = {
  CUSTOMER: "/dashboard",
  OWNER: "/dashboard",
  ADMIN: "/dashboard",
};

// Halaman yang tidak boleh jadi tujuan redirect (hindari loop login -> login).
const AUTH_PATHS = ["/login", "/register"];

export function getDefaultRouteForRole(role: UserRole): string {
  return DEFAULT_ROUTE[role] ?? "/";
}


export function getSafeRedirect(from: unknown): string | null {
  let path: string | null = null;

  if (typeof from === "string") {
    path = from;
  } else if (from && typeof from === "object" && "pathname" in from) {
    const { pathname, search, hash } = from as {
      pathname?: unknown;
      search?: unknown;
      hash?: unknown;
    };
    if (typeof pathname === "string") {
      path =
        pathname +
        (typeof search === "string" ? search : "") +
        (typeof hash === "string" ? hash : "");
    }
  }

  if (!path) return null;
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) {
    return null;
  }
  if ([...path].some((ch) => ch.charCodeAt(0) < 32)) return null;

  try {
    const url = new URL(path, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    if (AUTH_PATHS.includes(url.pathname)) return null;
    return url.pathname + url.search + url.hash;
  } catch {
    return null;
  }
}


export function resolvePostLoginPath(from: unknown, role: UserRole): string {
  return getSafeRedirect(from) ?? getDefaultRouteForRole(role);
}
