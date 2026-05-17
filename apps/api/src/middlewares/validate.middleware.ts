import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";
import { AppError } from "../utils/app-error.js";

export function validate(schema: ZodSchema<any>, source: "body" | "query" | "params" = "body") {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return next(new AppError(400, "Validation failed", result.error.flatten()));
    }
    req[source] = result.data;
    next();
  };
}
