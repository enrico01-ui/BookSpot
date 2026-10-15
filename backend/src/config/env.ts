import "dotenv/config";

import { z } from "zod";

const schema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]),
    PORT : z.coerce.number().default(4000),
    DATABASE_URL : z.string().min(1),
    CORS_ORIGIN : z.string().default("http://localhost:5173"),
    REDIS_URL : z.string().default("redis://localhost:6379"),
    JWT_SECRET : z.string().min(1),
    REFRESH_SECRET : z.string().min(1),
})

export const env = schema.parse(process.env);