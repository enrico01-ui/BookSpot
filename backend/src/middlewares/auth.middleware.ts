import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors/appError.js";
import { env } from "../config/env.js";

const extractToken = (req: Request): string | null => {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7);

  return null;
};

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
     const token = extractToken(req);
    if (!token) {
      throw new AppError("Authorization header is missing or malformed", 401);
    }


    try {
        const decoded = jwt.verify(token || "", env.JWT_SECRET, { algorithms: ["HS256"] });
        (req as any).user = decoded;
        next();
    } catch (error) {
        throw new AppError("Invalid or expired token", 401);
    }
};

export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Membaca req.user yang sudah ditempel oleh middleware authenticate
    const user = req.user;

    if (!user || !allowedRoles.includes(user.role)) {
      throw new AppError("Forbidden: You do not have access", 403);
    }

    next(); // Role sesuai ("ADMIN"), lanjut ke controller!
  };
};