import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/app-error.js";

export function roleMiddleware(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, "Unauthorized"));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, "Forbidden"));
    }
    next();
  };
}
