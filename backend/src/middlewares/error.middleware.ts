import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { Prisma } from "../generated/prisma/client.js"; // sesuaikan path client Prisma-mu
import { AppError } from "../errors/appError.js";

const CODES: Record<number, string> = {
  400: "BAD_REQUEST",
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  409: "CONFLICT",
  413: "PAYLOAD_TOO_LARGE",
  422: "UNPROCESSABLE_ENTITY",
  429: "TOO_MANY_REQUESTS",
  500: "INTERNAL_ERROR",
};

const httpError = (status: number, message: string, details?: unknown) => ({
  status,
  code: CODES[status] ?? "ERROR",
  message,
  details,
});


function toHttpError(err: unknown) {
  if (err instanceof AppError) return httpError(err.statusCode, err.message);

  if (err instanceof ZodError) {
    return httpError(
      400,
      "Data tidak valid",
      err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    );
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2025": return httpError(404, "Data tidak ditemukan");
      case "P2002": return httpError(409, "Data sudah ada");
      case "P2003": return httpError(422, "Referensi data tidak valid");
    }
  }


  const status = (err as { status?: unknown } | null)?.status;
  if (typeof status === "number" && status >= 400 && status < 500) {
    return httpError(status, status === 413 ? "Ukuran request terlalu besar" : "Request tidak valid");
  }

  return httpError(500, "Terjadi kesalahan pada server");
}

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (res.headersSent) {
    next(err); // respons sudah terkirim sebagian: serahkan ke handler bawaan Express
    return;
  }

  const { status, code, message, details } = toHttpError(err);


  if (status >= 500) console.error(`[${req.method} ${req.originalUrl}]`, err); 

  res.status(status).json({ error: { code, message, ...(details ? { details } : {}) } });
};