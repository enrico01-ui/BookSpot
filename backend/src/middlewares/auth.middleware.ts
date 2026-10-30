import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { UserRole } from "../generated/prisma/enums.js";
import { AppError } from "../errors/appError.js";
import { env } from "../config/env.js";

const extractToken = <P, B, Q>(req: Request<P, unknown, B, Q>): string | null => {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7);

  return null;
};

export const authenticate = <P, B, Q>(req: Request<P, unknown, B, Q>, _res: Response, next: NextFunction) => {
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
export const optionalAuthenticate = <P, B, Q>(req: Request<P, unknown, B, Q>, res: Response, next: NextFunction) =>
  extractToken(req) ? authenticate(req, res, next) : next();

export const authorize =
  (...allowedRoles: UserRole[]) =>
  <P, B, Q>(req: Request<P, unknown, B, Q>, _res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      throw new AppError("Forbidden: You do not have access", 403);
    }
    next();
  };