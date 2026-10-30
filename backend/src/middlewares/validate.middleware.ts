import type { RequestHandler } from "express";
import type { ParamsDictionary } from "express-serve-static-core";
import type { ParsedQs } from "qs";
import type { z } from "zod";


export function validate<P = ParamsDictionary, B = unknown, Q = ParsedQs>(schemas: {
  params?: z.ZodType<P>;
  body?: z.ZodType<B>;
  query?: z.ZodType<Q>;
}): RequestHandler<P, unknown, B, Q> {
  return (req, _res, next) => {
    try {
      if (schemas.params) req.params = schemas.params.parse(req.params);
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.query) {
        
        Object.defineProperty(req, "query", {
          value: schemas.query.parse(req.query),
          writable: true,
          configurable: true,
          enumerable: true,
        });
      }
      next();
    } catch (error) {
      next(error); 
    }
  };
}