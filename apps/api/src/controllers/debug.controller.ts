import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/async.middleware.js";
import { sendSms } from "../services/notification.service.js";
import { sendResponse } from "../utils/response.js";
import { User } from "../models/User.js";
import { issueAuthTokens, sanitizeUser } from "../services/auth.service.js";
import { signAccessToken, signRefreshToken } from "../utils/jwt.js";
import crypto from "crypto";
import { env } from "../config/env.js";

export const smsTest = asyncHandler(async (req: Request, res: Response) => {
  const { phone, message } = req.body;
  if (!phone) return sendResponse(res, 400, { message: "phone is required" });
  const msg = message || `Test SMS: ${new Date().toISOString()}`;
  await sendSms(phone, msg);
  sendResponse(res, 200, { message: "SMS triggered (check server logs/Twilio)" });
});

export const impersonate = asyncHandler(async (req: Request, res: Response) => {
  if (env.NODE_ENV !== "development") return sendResponse(res, 403, { message: "Not allowed" });
  const email = req.body.email || req.query.email;
  if (!email) return sendResponse(res, 400, { message: "email is required" });
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return sendResponse(res, 404, { message: "User not found" });
  let tokens;
  try {
    tokens = await issueAuthTokens({ _id: String(user._id), role: user.role, tokenVersion: user.tokenVersion });
  } catch (err) {
    console.warn("issueAuthTokens failed, falling back to unsigned persistence-free tokens", err);
    const payload = { sub: String(user._id), role: user.role, tokenVersion: user.tokenVersion };
    const jti = crypto.randomUUID();
    tokens = { accessToken: signAccessToken(payload), refreshToken: signRefreshToken({ ...payload, jti }) };
  }
  const secure = env.COOKIE_SECURE === true;
  const sameSite: "lax" | "none" = secure ? "none" : "lax";
  const cookieOptions = { httpOnly: true, secure, sameSite, path: "/" } as const;
  res.cookie("accessToken", tokens.accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
  res.cookie("refreshToken", tokens.refreshToken, { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 * 1000 });
  sendResponse(res, 200, { message: "Impersonated", data: { user: sanitizeUser(user) } });
});
