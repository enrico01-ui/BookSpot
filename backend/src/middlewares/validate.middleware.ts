// src/middlewares/validate.middleware.ts
import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";

interface RequestValidators {
  body?: z.ZodType;
  query?: z.ZodType;
  params?: z.ZodType;
}

export function validate(schemas: RequestValidators) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query) as any;
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as any;
      }
      next();
    } catch (error) {
      next(error); // Tetap dilempar ke global error handler
    }
  };
}