import { Payment } from "../models/Payment.js";
import { Loan } from "../models/Loan.js";
import { AppError } from "../utils/app-error.js";
import { notifyUser } from "./notification.service.js";
import { User } from "../models/User.js";

export async function addPayment(input: { loanId: string; amount: number; utrNumber: string; paymentDate: string; collectedBy: string }) {
  const loan = await Loan.findById(input.loanId);
  if (!loan) throw new AppError(404, "Loan not found");
  if (loan.status !== "DISBURSED") throw new AppError(400, "Payments can only be added to disbursed loans");
  if (input.amount <= 0) throw new AppError(400, "Payment amount must be greater than zero");

  const existing = await Payment.findOne({ utrNumber: input.utrNumber });
  if (existing) throw new AppError(409, "UTR number must be unique");

  if (input.amount > loan.outstandingAmount) {
    throw new AppError(400, "Payment cannot exceed pending amount");
  }

  const payment = await Payment.create({
    loanId: input.loanId,
    amount: input.amount,
    utrNumber: input.utrNumber,
    paymentDate: new Date(input.paymentDate),
    collectedBy: input.collectedBy,
  });

  const fromStatus = loan.status;
  loan.paidAmount += input.amount;
  loan.outstandingAmount = Math.max(loan.totalRepayment - loan.paidAmount, 0);
  if (loan.outstandingAmount === 0) {
    loan.status = "CLOSED";
  }
  // push history entry for payment
  try {
    const user = await User.findById(input.collectedBy).select("name email").lean();
    loan.history = loan.history || [];
    loan.history.push({
      action: "PAYMENT",
      by: user?._id ?? null,
      byName: user?.name ?? null,
      byEmail: user?.email ?? null,
      amount: input.amount,
      utrNumber: input.utrNumber ?? null,
      fromStatus: fromStatus ?? null,
      toStatus: loan.status,
      balanceAfter: loan.outstandingAmount,
      at: new Date(),
    });
  } catch (err) {
    loan.history = loan.history || [];
    loan.history.push({
      action: "PAYMENT",
      by: input.collectedBy as any,
      byName: null,
      byEmail: null,
      amount: input.amount,
      utrNumber: input.utrNumber ?? null,
      fromStatus: fromStatus ?? null,
      toStatus: loan.status,
      balanceAfter: loan.outstandingAmount,
      at: new Date(),
    });
  }

  await loan.save();
  const msg = loan.outstandingAmount === 0 ? `We received ₹${input.amount}. Your loan is now fully paid and closed.` : `We received ₹${input.amount} against your loan. Outstanding: ₹${loan.outstandingAmount}`;
  await notifyUser(String(loan.borrowerId), "Payment Received", msg, "payment_received");
  return payment;
}

export async function listPaymentsByLoan(loanId: string) {
  return Payment.find({ loanId }).sort({ paymentDate: -1 }).populate("collectedBy");
}
