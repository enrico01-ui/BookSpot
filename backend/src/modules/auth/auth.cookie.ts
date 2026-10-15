
import type { CookieOptions } from "express";
import { env } from "../../config/env.js";

export const REFRESH_COOKIE_NAME = "bookspot_refresh";

export const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/api/auth",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};