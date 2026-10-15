
import { Request, Response, NextFunction } from "express";
import { z} from "zod";

export function validate(schema: z.ZodType) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
}