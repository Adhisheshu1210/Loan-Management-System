import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/async.middleware.js";
import { runBre } from "../utils/bre.js";
import { createBorrowerProfile, applyLoan, getBorrowerDashboard, withdrawLoan } from "../services/loan.service.js";
import { sendResponse } from "../utils/response.js";
import { storeUpload } from "../services/upload.service.js";
import { Document } from "../models/Document.js";
import { Loan } from "../models/Loan.js";
import { User } from "../models/User.js";
import { authenticateBorrower, completePhoneVerification, startPhoneVerification } from "../services/auth.service.js";
import { canonicalizePhoneNumber } from "../shared/phone.js";

function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  const secure = process.env.COOKIE_SECURE === "true";
  res.cookie("accessToken", accessToken, { httpOnly: true, secure, sameSite: secure ? "none" : "lax", maxAge: 15 * 60 * 1000 });
  res.cookie("refreshToken", refreshToken, { httpOnly: true, secure, sameSite: secure ? "none" : "lax", maxAge: 30 * 24 * 60 * 60 * 1000 });
}

export const borrowerAuth = asyncHandler(async (req: Request, res: Response) => {
  const result = await authenticateBorrower(req.body);
  setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);
  sendResponse(res, result.created ? 201 : 200, {
    message: result.created ? "Borrower account created" : "Borrower authenticated",
    data: { user: result.user, accessToken: result.tokens.accessToken, created: result.created },
  });
});

export const upsertProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.id);
  if (!user) {
    return sendResponse(res, 404, { message: "User not found" });
  }

  // Phone verification is no longer required to save profile.

  const bre = runBre(req.body);
  const profile = await createBorrowerProfile({ ...req.body, userId: req.user!.id });

  if (typeof req.body.name === "string" && req.body.name.trim()) {
    user.name = req.body.name.trim();
  }

  if (typeof req.body.phone === "string" && req.body.phone.trim()) {
    user.phone = canonicalizePhoneNumber(req.body.phone);
  }

  await user.save();
  profile.breEligible = bre.eligible;
  profile.breReasons = bre.reasons;
  await profile.save();
  sendResponse(res, 200, { message: bre.eligible ? "Profile saved" : "BRE failed", data: { profile, bre, user: { id: String(user._id), name: user.name, email: user.email, phone: user.phone, role: user.role, secondaryEmail: user.secondaryEmail, secondaryEmailVerifiedAt: user.secondaryEmailVerifiedAt } } });
});

export const uploadDocument = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    return sendResponse(res, 400, { message: "File is required" });
  }
  const uploaded = await storeUpload(req.file);
  const record = await Document.create({
    borrowerId: req.user!.id,
    fileUrl: uploaded.fileUrl,
    fileType: req.file.mimetype,
    publicId: uploaded.publicId,
    uploadedAt: new Date(),
  });
  sendResponse(res, 201, { message: "Document uploaded", data: record });
});

export const submitLoanApplication = asyncHandler(async (req: Request, res: Response) => {
  const loan = await applyLoan({ borrowerId: req.user!.id, amount: req.body.amount, tenure: req.body.tenure });
  sendResponse(res, 201, { message: "Loan application created", data: loan });
});

export const withdrawLoanApplication = asyncHandler(async (req: Request, res: Response) => {
  const loan = await withdrawLoan(String(req.params.id), req.user!.id);
  sendResponse(res, 200, { message: "Loan application withdrawn", data: loan });
});

export const myLoans = asyncHandler(async (req: Request, res: Response) => {
  const loans = await Loan.find({ borrowerId: req.user!.id }).sort({ createdAt: -1 });
  sendResponse(res, 200, { message: "Borrower loans fetched", data: loans });
});

export const dashboard = asyncHandler(async (req: Request, res: Response) => {
  const data = await getBorrowerDashboard({ borrowerId: req.user!.id });
  sendResponse(res, 200, { message: "Borrower dashboard fetched", data });
});

export const startPhoneOtp = asyncHandler(async (req: Request, res: Response) => {
  const result = await startPhoneVerification(req.user!.id, req.body.phone);
  sendResponse(res, 200, { message: result.message, data: { delivery: result.delivery } });
});

export const verifyPhoneOtp = asyncHandler(async (req: Request, res: Response) => {
  await completePhoneVerification(req.user!.id, req.body.otp);
  sendResponse(res, 200, { message: "Phone number verified" });
});
