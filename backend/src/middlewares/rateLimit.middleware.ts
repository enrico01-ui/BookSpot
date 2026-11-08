import { redis } from "../lib/redis.js";
import {rateLimit} from "express-rate-limit";
import { RedisStore} from "rate-limit-redis";

const isTest = () => process.env.NODE_ENV === "test" || process.env.DISABLE_RATE_LIMIT === "true";



function createLimiter(name: string, windowMs: number, limit: number, message: string) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    skip: isTest,
    store: new RedisStore({
      prefix: `rl:${name}:`, // prefix unik per limiter, lihat bagian di bawah
      sendCommand: (...args: string[]) => redis.sendCommand(args),
    }),
    message: { message },
  });
}

export const loginLimiter = createLimiter("login", 15 * 60 * 1000, 5,
  "Too many login attempts. Please try again later.");
export const refreshLimiter = createLimiter("refresh", 15 * 60 * 1000, 30,
  "Too many refresh attempts. Please try again later.");
export const registerLimiter = createLimiter("register", 60 * 60 * 1000, 5,
  "Too many registration attempts. Please try again later.");