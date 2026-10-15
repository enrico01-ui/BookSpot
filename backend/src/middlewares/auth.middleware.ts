import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors/appError.js";
import { env } from "../config/env.js";

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        throw new AppError("Authorization header is missing", 401);
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token || "", env.JWT_SECRET);
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