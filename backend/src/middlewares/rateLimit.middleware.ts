import { redis } from "../lib/redis.js";
import {rateLimit} from "express-rate-limit";
import { RedisStore} from "rate-limit-redis";



export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,

    standardHeaders: "draft-8",
    legacyHeaders: false,

    store: new RedisStore({
        sendCommand: (...args: string[]) => redis.sendCommand(args),
    }),

    message: {
        message: "Too many login attempts. Please try again later.",
    },
});

export const refreshLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,

    standardHeaders: "draft-8",
    legacyHeaders: false,

    store: new RedisStore({
        sendCommand: (...args: string[]) => redis.sendCommand(args),
    }),

    message: {
        message: "Too many refresh attempts. Please try again later.",
    },
})

export const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 10,

    standardHeaders: "draft-8",
    legacyHeaders: false,

    store: new RedisStore({
        sendCommand: (...args: string[]) => redis.sendCommand(args),
    }),

    message: {
        message: "Too many registration attempts. Please try again later.",
    },
});