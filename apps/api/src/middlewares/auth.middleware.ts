import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/jwt.js";
import { AppError } from "../utils/app-error.js";

export function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const cookieToken = req.cookies?.accessToken as string | undefined;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : cookieToken;

  if (!token) {
    return next(new AppError(401, "Unauthorized"));
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      role: payload.role,
      tokenVersion: payload.tokenVersion,
    };
    next();
  } catch {
    next(new AppError(401, "Unauthorized"));
  }
}
