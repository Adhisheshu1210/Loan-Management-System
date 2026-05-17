import crypto from "crypto";
import { User, UserRole } from "../models/User.js";
import { RefreshToken } from "../models/RefreshToken.js";
import { OtpChallenge, OtpPurpose } from "../models/OtpChallenge.js";
import { comparePassword, hashPassword } from "../utils/password.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.js";
import { AppError } from "../utils/app-error.js";
import { sendMail, sendSms } from "./notification.service.js";
import { env } from "../config/env.js";
import { canonicalizePhoneNumber, toE164PhoneNumber } from "../shared/phone.js";

export function sanitizeUser(user: { _id: unknown; name: string; email: string; role: UserRole; phone?: string }) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
  };
}

function generateOtpCode() {
  return `${crypto.randomInt(100000, 1000000)}`;
}

function hashOtpCode(code: string) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

async function createOtpChallenge(email: string, purpose: OtpPurpose) {
  const challengeId = crypto.randomUUID();
  const otpCode = generateOtpCode();
  await OtpChallenge.create({
    challengeId,
    email: email.toLowerCase(),
    purpose,
    codeHash: hashOtpCode(otpCode),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });

  await sendMail(
    email,
    `Your LMS ${purpose === "REGISTER" ? "registration" : "login"} OTP`,
    `Your verification code is ${otpCode}. It expires in 10 minutes.`,
  );

  return { challengeId, email };
}

async function verifyOtpChallenge(challengeId: string, otp: string, purpose: OtpPurpose, email: string) {
  const challenge = await OtpChallenge.findOne({ challengeId, purpose, verifiedAt: null });
  if (!challenge) {
    throw new AppError(400, "Invalid or expired OTP challenge");
  }

  if (challenge.email !== email.toLowerCase()) {
    throw new AppError(400, "OTP challenge does not match the provided email");
  }

  if (challenge.expiresAt < new Date()) {
    await challenge.deleteOne();
    throw new AppError(400, "OTP has expired");
  }

  if (challenge.attempts >= 5) {
    await challenge.deleteOne();
    throw new AppError(429, "Too many OTP attempts");
  }

  if (challenge.codeHash !== hashOtpCode(otp)) {
    challenge.attempts += 1;
    await challenge.save();
    throw new AppError(400, "Invalid OTP");
  }

  await challenge.deleteOne();
  return challenge;
}

async function sendPhoneOtpFallback(user: { phone: string; email?: string | null }, otpCode: string, fallbackMessage: string) {
  // Twilio SMS is the primary and only delivery path
  try {
    // If a Twilio OTP template ContentSid is configured, use it for WhatsApp/business-initiated messages
    const contentSid = env.TWILIO_OTP_CONTENT_SID;
    if (contentSid) {
      await sendSms(toE164PhoneNumber(user.phone), `Your verification code is ${otpCode}`, { contentSid, contentVariables: { "1": otpCode } });
    } else {
      await sendSms(
        toE164PhoneNumber(user.phone),
        `Loan Management System verification code: ${otpCode}. It expires in 10 minutes.`,
      );
    }
    return { channel: "sms", result: { ok: true, status: 200, body: "Twilio SMS sent" } };
  } catch (smsError) {
    console.warn("Twilio SMS delivery failed, falling back to email", smsError);
  }

  if (user.email) {
    await sendMail(
      user.email,
      fallbackMessage,
      `Your verification code is ${otpCode}. It expires in 10 minutes.`,
    );
  }

  return { channel: "email", result: { ok: false, status: 0, body: "Twilio SMS failed" } };
}

function tokenExpiryToDate(expiresIn: string) {
  const value = expiresIn.trim();
  const amount = Number.parseInt(value, 10);
  const now = new Date();
  if (value.endsWith("d")) now.setDate(now.getDate() + amount);
  else if (value.endsWith("h")) now.setHours(now.getHours() + amount);
  else if (value.endsWith("m")) now.setMinutes(now.getMinutes() + amount);
  else now.setDate(now.getDate() + 30);
  return now;
}

export async function issueAuthTokens(user: { _id: string | { toString(): string }; role: UserRole; tokenVersion: number }) {
  const payload = { sub: String(user._id), role: user.role, tokenVersion: user.tokenVersion };
  const jti = crypto.randomUUID();
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken({ ...payload, jti });
  const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
  await RefreshToken.create({
    userId: user._id,
    tokenHash,
    jti,
    expiresAt: tokenExpiryToDate(process.env.JWT_REFRESH_EXPIRES_IN ?? "30d"),
  });
  return { accessToken, refreshToken };
}

export async function registerUser(input: { name: string; email: string; phone: string; password: string; role?: UserRole }) {
  const normalizedPhone = canonicalizePhoneNumber(input.phone);
  if (!input.email || !input.email.toLowerCase().endsWith("@gmail.com")) {
    throw new AppError(400, "Email must end with @gmail.com");
  }
  const existing = await User.findOne({ $or: [{ email: input.email.toLowerCase() }, { phone: normalizedPhone }] });
  if (existing) throw new AppError(409, "Email or phone already exists");

  const user = await User.create({
    name: input.name,
    email: input.email.toLowerCase(),
    phone: normalizedPhone,
    password: await hashPassword(input.password),
    role: input.role ?? "BORROWER",
  });

  const tokens = await issueAuthTokens(user);
  return { user: sanitizeUser(user), tokens };
}

export async function startRegisterOtp(input: { name: string; email: string; phone: string; password: string; role?: UserRole }) {
  const normalizedPhone = canonicalizePhoneNumber(input.phone);
  if (!input.email || !input.email.toLowerCase().endsWith("@gmail.com")) {
    throw new AppError(400, "Email must end with @gmail.com");
  }
  const existing = await User.findOne({ $or: [{ email: input.email.toLowerCase() }, { phone: normalizedPhone }] });
  if (existing) throw new AppError(409, "Email or phone already exists");
  return createOtpChallenge(input.email, "REGISTER");
}

export async function completeRegisterOtp(input: { name: string; email: string; phone: string; password: string; role?: UserRole; challengeId: string; otp: string }) {
  await verifyOtpChallenge(input.challengeId, input.otp, "REGISTER", input.email);
  return registerUser(input);
}

export async function loginUser(input: { identifier: string; password: string }) {
  const user = await authenticateUser(input.identifier, input.password);
  const tokens = await issueAuthTokens(user);
  return { user: sanitizeUser(user), tokens };
}

async function authenticateUser(identifier: string, password: string) {
  const normalizedCandidate = canonicalizePhoneNumber(identifier);
  const user = await User.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { phone: normalizedCandidate },
      { phone: identifier },
    ],
  });
  if (!user || !(await comparePassword(password, user.password))) {
    throw new AppError(401, "Invalid credentials");
  }
  if (!user.isActive) {
    throw new AppError(403, "Account is inactive");
  }
  return user;
}

export async function startLoginOtp(input: { identifier: string; password: string }) {
  const user = await authenticateUser(input.identifier, input.password);
  return createOtpChallenge(user.email, "LOGIN");
}

export async function completeLoginOtp(input: { identifier: string; password: string; challengeId: string; otp: string }) {
  const user = await authenticateUser(input.identifier, input.password);
  await verifyOtpChallenge(input.challengeId, input.otp, "LOGIN", user.email);
  const tokens = await issueAuthTokens(user);
  return { user: sanitizeUser(user), tokens };
}

export async function authenticateBorrower(input: { name: string; email: string; phone: string; password: string; mode: "register" | "login" }) {
  const normalizedPhone = canonicalizePhoneNumber(input.phone);
  const existing = await User.findOne({ $or: [{ email: input.email.toLowerCase() }, { phone: normalizedPhone }] });

  if (input.mode === "register") {
    if (existing) {
      if (existing.role !== "BORROWER") {
        throw new AppError(403, "This account is already registered as an executive account");
      }
      if (!(await comparePassword(input.password, existing.password))) {
        throw new AppError(401, "Invalid credentials");
      }
      const tokens = await issueAuthTokens(existing);
      return { user: sanitizeUser(existing), tokens, created: false };
    }

    const user = await User.create({
      name: input.name,
      email: input.email.toLowerCase(),
      phone: normalizedPhone,
      password: await hashPassword(input.password),
      role: "BORROWER",
    });

    const tokens = await issueAuthTokens(user);
    return { user: sanitizeUser(user), tokens, created: true };
  }

  if (!existing || existing.role !== "BORROWER") {
    throw new AppError(401, "Invalid credentials");
  }

  if (!(await comparePassword(input.password, existing.password))) {
    throw new AppError(401, "Invalid credentials");
  }

  const tokens = await issueAuthTokens(existing);
  return { user: sanitizeUser(existing), tokens, created: false };
}

export async function startPhoneVerification(userId: string, phone: string) {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(404, "User not found");
  }

  const normalizedPhone = canonicalizePhoneNumber(phone);
  if (canonicalizePhoneNumber(user.phone) !== normalizedPhone) {
    throw new AppError(400, "Phone number does not match your account");
  }

  const otpCode = generateOtpCode();
  user.phoneVerificationToken = hashOtpCode(otpCode);
  user.phoneVerificationExpires = new Date(Date.now() + 10 * 60 * 1000);
  user.phoneVerifiedAt = null;
  await user.save();

  const delivery = await sendPhoneOtpFallback(user, otpCode, "Verify your phone number");
  return { message: "Verification code sent", delivery };
}

export async function completePhoneVerification(userId: string, otp: string) {
  const user = await User.findById(userId);
  if (!user || !user.phoneVerificationToken || !user.phoneVerificationExpires) {
    throw new AppError(400, "Invalid or expired phone verification code");
  }

  if (user.phoneVerificationExpires < new Date()) {
    user.phoneVerificationToken = null;
    user.phoneVerificationExpires = null;
    await user.save();
    throw new AppError(400, "Invalid or expired phone verification code");
  }

  if (user.phoneVerificationToken !== hashOtpCode(otp)) {
    throw new AppError(400, "Invalid phone verification code");
  }

  user.phoneVerificationToken = null;
  user.phoneVerificationExpires = null;
  user.phoneVerifiedAt = new Date();
  await user.save();

  return { verified: true };
}

export async function startChangePhone(userId: string, newPhone: string) {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(404, "User not found");
  }

  const normalizedNew = canonicalizePhoneNumber(newPhone);
  if (canonicalizePhoneNumber(user.phone) === normalizedNew) {
    throw new AppError(400, "New phone must be different from the current phone");
  }

  const exists = await User.findOne({ phone: normalizedNew });
  if (exists) {
    throw new AppError(409, "Phone number already in use");
  }

  const otpCode = generateOtpCode();
  user.pendingPhone = normalizedNew;
  user.pendingPhoneVerificationToken = hashOtpCode(otpCode);
  user.pendingPhoneVerificationExpires = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();

  const delivery = await sendPhoneOtpFallback(
    { phone: normalizedNew, email: user.email },
    otpCode,
    "Verify your new phone number",
  );

  return { message: "Verification code sent to the new phone", delivery };
}

export async function completeChangePhone(userId: string, otp: string) {
  const user = await User.findById(userId);
  if (!user || !user.pendingPhone || !user.pendingPhoneVerificationToken || !user.pendingPhoneVerificationExpires) {
    throw new AppError(400, "Invalid or expired phone change verification code");
  }

  if (user.pendingPhoneVerificationExpires < new Date()) {
    user.pendingPhone = null;
    user.pendingPhoneVerificationToken = null;
    user.pendingPhoneVerificationExpires = null;
    await user.save();
    throw new AppError(400, "Invalid or expired phone change verification code");
  }

  if (user.pendingPhoneVerificationToken !== hashOtpCode(otp)) {
    throw new AppError(400, "Invalid phone change verification code");
  }

  // Atomically set the primary phone to the pending phone and mark verified
  user.phone = user.pendingPhone;
  user.pendingPhone = null;
  user.pendingPhoneVerificationToken = null;
  user.pendingPhoneVerificationExpires = null;
  user.phoneVerifiedAt = new Date();
  await user.save();

  return { verified: true };
}

export async function startSecondaryEmailVerification(userId: string, secondaryEmail: string) {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(404, "User not found");
  }

  const normalizedSecondaryEmail = secondaryEmail.toLowerCase();
  if (normalizedSecondaryEmail === user.email.toLowerCase()) {
    throw new AppError(400, "Secondary email must be different from the registered email");
  }

  const otpCode = generateOtpCode();
  user.secondaryEmail = normalizedSecondaryEmail;
  user.secondaryEmailVerificationToken = hashOtpCode(otpCode);
  user.secondaryEmailVerificationExpires = new Date(Date.now() + 10 * 60 * 1000);
  user.secondaryEmailVerifiedAt = null;
  await user.save();

  await sendMail(
    normalizedSecondaryEmail,
    "Verify your secondary email",
    `Your secondary email verification code is ${otpCode}. It expires in 10 minutes.`,
  );

  return { message: "Secondary email verification code sent" };
}

export async function completeSecondaryEmailVerification(userId: string, otp: string) {
  const user = await User.findById(userId);
  if (!user || !user.secondaryEmail || !user.secondaryEmailVerificationToken || !user.secondaryEmailVerificationExpires) {
    throw new AppError(400, "Invalid or expired secondary email verification code");
  }

  if (user.secondaryEmailVerificationExpires < new Date()) {
    user.secondaryEmailVerificationToken = null;
    user.secondaryEmailVerificationExpires = null;
    await user.save();
    throw new AppError(400, "Invalid or expired secondary email verification code");
  }

  if (user.secondaryEmailVerificationToken !== hashOtpCode(otp)) {
    throw new AppError(400, "Invalid secondary email verification code");
  }

  user.secondaryEmailVerificationToken = null;
  user.secondaryEmailVerificationExpires = null;
  user.secondaryEmailVerifiedAt = new Date();
  await user.save();

  return { verified: true };
}

export async function refreshAuthSession(refreshToken: string) {
  const payload = verifyRefreshToken(refreshToken);
  const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
  const stored = await RefreshToken.findOne({ jti: payload.jti, tokenHash, revokedAt: null });
  if (!stored) throw new AppError(401, "Invalid refresh token");

  const user = await User.findById(payload.sub);
  if (!user) throw new AppError(401, "User not found");

  stored.revokedAt = new Date();
  await stored.save();
  return issueAuthTokens(user);
}

export async function revokeRefreshSession(refreshToken?: string) {
  if (!refreshToken) return;
  try {
    const payload = verifyRefreshToken(refreshToken);
    const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
    await RefreshToken.updateOne({ jti: payload.jti, tokenHash }, { $set: { revokedAt: new Date() } });
  } catch {
    return;
  }
}

export async function forgotPassword(email: string) {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return { message: "If the account exists, a reset link was sent." };

  const resetToken = crypto.randomBytes(32).toString("hex");
  user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  user.resetPasswordExpires = new Date(Date.now() + 1000 * 60 * 30);
  await user.save();

  const resetUrl = `${process.env.CLIENT_ORIGIN ?? "http://localhost:3000"}/reset-password?email=${encodeURIComponent(user.email)}&token=${encodeURIComponent(resetToken)}`;
  await sendMail(
    user.email,
    "Reset your LMS password",
    `We received a password reset request for your account.\n\nReset link: ${resetUrl}\n\nOr paste this token into the reset form: ${resetToken}\n\nThis token expires in 30 minutes. If you did not request this, ignore this email.`,
  );

  return { resetToken };
}

export async function resetPassword(email: string, token: string, password: string) {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !user.resetPasswordToken || !user.resetPasswordExpires) {
    throw new AppError(400, "Invalid or expired reset token");
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  if (user.resetPasswordToken !== tokenHash || user.resetPasswordExpires < new Date()) {
    throw new AppError(400, "Invalid or expired reset token");
  }

  user.password = await hashPassword(password);
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  user.tokenVersion += 1;
  await user.save();
  await RefreshToken.deleteMany({ userId: user._id });
}
