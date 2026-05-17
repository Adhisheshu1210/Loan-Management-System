import { Schema, model, Types } from "mongoose";

export interface PaymentDocument {
  _id: Types.ObjectId;
  loanId: Types.ObjectId;
  amount: number;
  utrNumber: string;
  paymentDate: Date;
  collectedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<PaymentDocument>(
  {
    loanId: { type: Schema.Types.ObjectId, ref: "Loan", required: true },
    amount: { type: Number, required: true },
    utrNumber: { type: String, required: true, unique: true, trim: true },
    paymentDate: { type: Date, required: true },
    collectedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

export const Payment = model<PaymentDocument>("Payment", paymentSchema);
