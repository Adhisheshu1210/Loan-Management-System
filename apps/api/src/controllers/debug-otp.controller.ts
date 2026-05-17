import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/async.middleware.js";
import { sendResponse } from "../utils/response.js";
import { sendSms } from "../services/notification.service.js";

export const sendDemoOtp = asyncHandler(async (req: Request, res: Response) => {
  const phone = req.body.phone || req.query.phone;
  if (!phone) return sendResponse(res, 400, { message: "phone is required" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await sendSms(phone, `Loan Management System verification code: ${otp}. It expires in 10 minutes.`);

  sendResponse(res, 200, { message: "OTP sent", data: { otp, delivery: { ok: true, status: 200, body: "Twilio SMS sent" } } });
});
