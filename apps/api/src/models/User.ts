import { Schema, model, Types } from "mongoose";

export type UserRole = "ADMIN" | "SALES" | "SANCTION" | "DISBURSEMENT" | "COLLECTION" | "BORROWER";

export interface UserDocument {
  _id: Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  isActive: boolean;
  tokenVersion: number;
  phoneVerificationToken?: string | null;
  phoneVerificationExpires?: Date | null;
  phoneVerifiedAt?: Date | null;
  phoneVerificationDeliveredAt?: Date | null;
  pendingPhone?: string | null;
  pendingPhoneVerificationToken?: string | null;
  pendingPhoneVerificationExpires?: Date | null;
  secondaryEmail?: string | null;
  secondaryEmailVerificationToken?: string | null;
  secondaryEmailVerificationExpires?: Date | null;
  secondaryEmailVerifiedAt?: Date | null;
  resetPasswordToken?: string | null;
  resetPasswordExpires?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["ADMIN", "SALES", "SANCTION", "DISBURSEMENT", "COLLECTION", "BORROWER"],
      default: "BORROWER",
      required: true,
    },
    isActive: { type: Boolean, default: true },
    tokenVersion: { type: Number, default: 0 },
    phoneVerificationToken: { type: String, default: null },
    phoneVerificationExpires: { type: Date, default: null },
    phoneVerifiedAt: { type: Date, default: null },
    phoneVerificationDeliveredAt: { type: Date, default: null },
    pendingPhone: { type: String, default: null, trim: true },
    pendingPhoneVerificationToken: { type: String, default: null },
    pendingPhoneVerificationExpires: { type: Date, default: null },
    secondaryEmail: { type: String, default: null, lowercase: true, trim: true },
    secondaryEmailVerificationToken: { type: String, default: null },
    secondaryEmailVerificationExpires: { type: Date, default: null },
    secondaryEmailVerifiedAt: { type: Date, default: null },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
  },
  { timestamps: true },
);

export const User = model<UserDocument>("User", userSchema);
