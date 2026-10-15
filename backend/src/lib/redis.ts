
import { createClient } from "redis";
import { env } from "../config/env.js";

export const redis = createClient({
  url: env.REDIS_URL,
});

redis.on("error", (err) => {
  console.error("Redis error:", err);
});

redis.on("connect", () => {
  console.log("Redis connecting...");
});

redis.on("ready", () => {
  console.log("Redis ready");
});

// Tunggu Redis terhubung sebelum module ini selesai dimuat
await redis.connect();