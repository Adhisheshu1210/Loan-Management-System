import { Schema, model, Types } from "mongoose";

export type LoanStatus = "APPLIED" | "WITHDRAWN" | "SANCTIONED" | "DISBURSED" | "CLOSED" | "REJECTED";

export interface LoanDocument {
  _id: Types.ObjectId;
  borrowerId: Types.ObjectId;
  amount: number;
  tenure: number;
  interestRate: number;
  interestAmount: number;
  totalRepayment: number;
  paidAmount: number;
  outstandingAmount: number;
  status: LoanStatus;
  rejectionReason?: string | null;
  sanctionNotes?: string | null;
  transactionReference?: string | null;
  sanctionedBy?: Types.ObjectId | null;
  disbursedBy?: Types.ObjectId | null;
  disbursementProofUrl?: string | null;
  disbursementDate?: Date | null;
  dueDate?: Date | null;
  history?: Array<{
    action: string;
    by?: Types.ObjectId | null;
    byName?: string | null;
    byEmail?: string | null;
    note?: string | null;
    amount?: number | null;
    utrNumber?: string | null;
    transactionReference?: string | null;
    fromStatus?: LoanStatus | null;
    toStatus?: LoanStatus | null;
    balanceAfter?: number | null;
    at: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const loanSchema = new Schema<LoanDocument>(
  {
    borrowerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    tenure: { type: Number, required: true },
    interestRate: { type: Number, required: true, default: 12 },
    interestAmount: { type: Number, required: true },
    totalRepayment: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    outstandingAmount: { type: Number, required: true },
    status: { type: String, enum: ["APPLIED", "WITHDRAWN", "SANCTIONED", "DISBURSED", "CLOSED", "REJECTED"], default: "APPLIED" },
    rejectionReason: { type: String, default: null },
    sanctionNotes: { type: String, default: null },
    transactionReference: { type: String, default: null },
    sanctionedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    disbursedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    disbursementProofUrl: { type: String, default: null },
    disbursementDate: { type: Date, default: null },
    history: {
      type: [
        {
          action: { type: String },
          by: { type: Schema.Types.ObjectId, ref: "User", default: null },
          byName: { type: String, default: null },
          byEmail: { type: String, default: null },
          note: { type: String, default: null },
          amount: { type: Number, default: null },
          utrNumber: { type: String, default: null },
          transactionReference: { type: String, default: null },
          fromStatus: { type: String, default: null },
          toStatus: { type: String, default: null },
          balanceAfter: { type: Number, default: null },
          at: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    dueDate: { type: Date, default: null },
  },
  { timestamps: true },
);

loanSchema.index({ borrowerId: 1, status: 1 });

export const Loan = model<LoanDocument>("Loan", loanSchema);
