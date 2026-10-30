import express from "express";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";
import cors from "cors";
import helmet from "helmet";
import { redis } from "./lib/redis.js";
import AuthRoutes from "./modules/auth/auth.routes.js";
import VenueRoutes from "./modules/venues/venue.routes.js";
import swaggerUi from "swagger-ui-express";
import { openapiSpec } from "./docs/openapi.js";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middlewares/error.middleware.js";
import { AppError } from "./errors/appError.js";


export const app = express();

app.use(helmet());


app.use(
    cors(
        {
            origin: env.CORS_ORIGIN,
            credentials: true
        }
    )
);

app.use(express.json());
app.use(cookieParser());

app.get("/test", (_req, res) => {
  res.send("Express OK");
});
app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(openapiSpec),
);
app.use("/api/health", async (_req, res) => {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
        status: "ok",
    })
})

app.use("/api/ready", async (_req, res) => {
    try{
        await prisma.$queryRaw`SELECT 1`;

        await redis.ping();

        res.json({
            status: "ok",
            database: "ok",
            redis: "ok",
        })
    } catch (error) {
        res.status(500).json({
            status: "not ready",
            database: "not ok",
            redis: "not ok",
        })
    }
})
app.use("/api/auth", AuthRoutes);
app.use("/api/venues", VenueRoutes);

app.use((_req, _res, next) => next(new AppError("Endpoint tidak ditemukan", 404)));

// 2) PALING TERAKHIR
app.use(errorHandler);