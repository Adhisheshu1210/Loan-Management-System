import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/async.middleware.js";
import { env } from "../config/env.js";
import {
  completeLoginOtp,
  completeRegisterOtp,
  completeSecondaryEmailVerification,
  forgotPassword,
  loginUser,
  refreshAuthSession,
  registerUser,
  resetPassword,
  revokeRefreshSession,
  startLoginOtp,
  startRegisterOtp,
  startSecondaryEmailVerification,
  startChangePhone,
  completeChangePhone,
} from "../services/auth.service.js";
import { sendResponse } from "../utils/response.js";
import { User } from "../models/User.js";

function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  const secure = env.COOKIE_SECURE === true;
  // Use SameSite=None when secure (production + HTTPS). In development we may
  // keep Lax to avoid requiring Secure cookies on HTTP, but refresh flows will
  // be allowed by the middleware change above when a refresh cookie exists.
  const sameSite: "lax" | "none" = secure ? "none" : "lax";
  const cookieOptions = { httpOnly: true, secure, sameSite, path: "/" } as const;
  res.cookie("accessToken", accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
  res.cookie("refreshToken", refreshToken, { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 * 1000 });
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  if (req.body.challengeId && req.body.otp) {
    const { user, tokens } = await completeRegisterOtp(req.body);
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    sendResponse(res, 201, { message: "Registered successfully", data: { user, accessToken: tokens.accessToken } });
    return;
  }

  const challenge = await startRegisterOtp(req.body);
  sendResponse(res, 200, { message: "OTP sent to your email", data: { challengeId: challenge.challengeId, email: challenge.email, requiresOtp: true } });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  if (req.body.challengeId && req.body.otp) {
    const { user, tokens } = await completeLoginOtp(req.body);
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    sendResponse(res, 200, { message: "Logged in successfully", data: { user, accessToken: tokens.accessToken } });
    return;
  }

  const challenge = await startLoginOtp(req.body);
  sendResponse(res, 200, { message: "OTP sent to your email", data: { challengeId: challenge.challengeId, email: challenge.email, requiresOtp: true } });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken ?? req.body.refreshToken;
  console.debug("[auth.refresh] called - cookies:", Object.keys(req.cookies || {}));
  if (!refreshToken) {
    console.debug("[auth.refresh] no refresh token present");
    return sendResponse(res, 401, { message: "Unauthorized" });
  }
  try {
    const tokens = await refreshAuthSession(refreshToken);
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    sendResponse(res, 200, { message: "Session refreshed", data: tokens });
  } catch (err) {
    console.error("[auth.refresh] error refreshing session:", err);
    // Clear cookies on failed refresh to avoid stale cookies
    res.clearCookie("accessToken", { path: "/" });
    res.clearCookie("refreshToken", { path: "/" });
    return sendResponse(res, 401, { message: "Unauthorized" });
  }
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  await revokeRefreshSession(req.cookies?.refreshToken ?? req.body.refreshToken);
  // clear with same path/options to ensure removal on client
  res.clearCookie("accessToken", { path: "/" });
  res.clearCookie("refreshToken", { path: "/" });
  sendResponse(res, 200, { message: "Logged out successfully" });
});

export const forgot = asyncHandler(async (req: Request, res: Response) => {
  const result = await forgotPassword(req.body.email);
  sendResponse(res, 200, { message: "Password reset initiated", data: result });
});

export const reset = asyncHandler(async (req: Request, res: Response) => {
  await resetPassword(req.body.email, req.body.token, req.body.password);
  sendResponse(res, 200, { message: "Password reset successfully" });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user?.id).select("name email phone role isActive secondaryEmail secondaryEmailVerifiedAt phoneVerifiedAt");
  sendResponse(res, 200, { message: "Current user fetched", data: { user: user ? { id: String(user._id), name: user.name, email: user.email, phone: user.phone, role: user.role, secondaryEmail: user.secondaryEmail, secondaryEmailVerifiedAt: user.secondaryEmailVerifiedAt, phoneVerifiedAt: user.phoneVerifiedAt } : null } });
});

export const startSecondaryEmailOtp = asyncHandler(async (req: Request, res: Response) => {
  const result = await startSecondaryEmailVerification(req.user!.id, req.body.secondaryEmail);
  sendResponse(res, 200, { message: result.message });
});

export const verifySecondaryEmailOtp = asyncHandler(async (req: Request, res: Response) => {
  await completeSecondaryEmailVerification(req.user!.id, req.body.otp);
  sendResponse(res, 200, { message: "Secondary email verified" });
});

export const startChangePhoneOtp = asyncHandler(async (req: Request, res: Response) => {
  const result = await startChangePhone(req.user!.id, req.body.newPhone);
  sendResponse(res, 200, { message: result.message, data: { delivery: result.delivery } });
});

export const verifyChangePhoneOtp = asyncHandler(async (req: Request, res: Response) => {
  await completeChangePhone(req.user!.id, req.body.otp);
  sendResponse(res, 200, { message: "Phone changed and verified" });
});
