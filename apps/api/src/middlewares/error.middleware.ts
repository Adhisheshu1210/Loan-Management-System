import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/app-error.js";

export function notFound(_req: Request, _res: Response, next: NextFunction) {
  next(new AppError(404, "Route not found"));
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  const appError = error instanceof AppError ? error : new AppError(500, "Internal server error");
  res.status(appError.statusCode).json({
    success: false,
    message: appError.message,
    errors: appError.errors ?? null,
  });
}
