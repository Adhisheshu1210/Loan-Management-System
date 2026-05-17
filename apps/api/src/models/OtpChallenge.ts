import { Schema, model, Types } from "mongoose";

export type OtpPurpose = "REGISTER" | "LOGIN";

export interface OtpChallengeDocument {
  _id: Types.ObjectId;
  challengeId: string;
  email: string;
  purpose: OtpPurpose;
  codeHash: string;
  attempts: number;
  expiresAt: Date;
  verifiedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const otpChallengeSchema = new Schema<OtpChallengeDocument>(
  {
    challengeId: { type: String, required: true, unique: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    purpose: { type: String, enum: ["REGISTER", "LOGIN"], required: true },
    codeHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
    verifiedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

otpChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OtpChallenge = model<OtpChallengeDocument>("OtpChallenge", otpChallengeSchema);