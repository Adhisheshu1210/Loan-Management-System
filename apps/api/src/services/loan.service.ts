import { Loan } from "../models/Loan.js";
import { BorrowerProfile } from "../models/BorrowerProfile.js";
import { Document } from "../models/Document.js";
import { Payment } from "../models/Payment.js";
import { User } from "../models/User.js";
import { AppError } from "../utils/app-error.js";
import { calculateLoanRepayment } from "../utils/loan.js";
import { notifyUser } from "./notification.service.js";

export async function applyLoan(input: { borrowerId: string; amount: number; tenure: number }) {
  const profile = await BorrowerProfile.findOne({ userId: input.borrowerId });
  if (!profile || !profile.breEligible) {
    throw new AppError(400, "Borrower profile is not BRE approved");
  }

  const calculation = calculateLoanRepayment(input.amount, input.tenure);
  const loan = await Loan.create({
    borrowerId: input.borrowerId,
    amount: input.amount,
    tenure: input.tenure,
    interestRate: 12,
    interestAmount: calculation.interestAmount,
    totalRepayment: calculation.totalRepayment,
    paidAmount: 0,
    outstandingAmount: calculation.totalRepayment,
    status: "APPLIED",
    dueDate: calculation.dueDate,
  });

  await notifyUser(input.borrowerId, "Loan Applied", `Your loan application for ₹${input.amount} has been submitted.`, "loan_applied");
  return loan;
}

export async function listLoans(filter: Record<string, unknown>, page = 1, limit = 10) {
  const query = Loan.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate("borrowerId sanctionedBy disbursedBy");
  const [items, total] = await Promise.all([query, Loan.countDocuments(filter)]);
  return { items, total, page, limit };
}

export async function getLoanById(id: string) {
  const loan = await Loan.findById(id).populate("borrowerId sanctionedBy disbursedBy");
  if (!loan) throw new AppError(404, "Loan not found");
  return loan;
}

export async function sanctionLoan(id: string, sanctionedBy: string, notes?: string) {
  const loan = await Loan.findById(id);
  if (!loan) throw new AppError(404, "Loan not found");
  if (loan.status !== "APPLIED") throw new AppError(400, "Only APPLIED loans can be sanctioned");
  loan.status = "SANCTIONED";
  loan.sanctionedBy = sanctionedBy as any;
  loan.sanctionNotes = notes ?? null;
  // record history entry with approver details
  try {
    const user = await User.findById(sanctionedBy).select("name email").lean();
    loan.history = loan.history || [];
    loan.history.push({ action: "SANCTION", by: user?._id ?? null, byName: user?.name ?? null, byEmail: user?.email ?? null, note: notes ?? null, at: new Date() });
  } catch (err) {
    // non-fatal: still proceed
    loan.history = loan.history || [];
    loan.history.push({ action: "SANCTION", by: sanctionedBy as any, byName: null, byEmail: null, note: notes ?? null, at: new Date() });
  }
  await loan.save();
  await notifyUser(String(loan.borrowerId), "Loan Sanctioned", `Your loan application has been sanctioned.`, "loan_sanctioned");
  return loan;
}

export async function rejectLoan(id: string, rejectedBy: string, reason: string) {
  const loan = await Loan.findById(id);
  if (!loan) throw new AppError(404, "Loan not found");
  if (loan.status !== "APPLIED") throw new AppError(400, "Only APPLIED loans can be rejected");
  loan.status = "REJECTED";
  loan.sanctionedBy = rejectedBy as any;
  loan.rejectionReason = reason;
  // record history entry for rejection
  try {
    const user = await User.findById(rejectedBy).select("name email").lean();
    loan.history = loan.history || [];
    loan.history.push({ action: "REJECT", by: user?._id ?? null, byName: user?.name ?? null, byEmail: user?.email ?? null, note: reason ?? null, at: new Date() });
  } catch (err) {
    loan.history = loan.history || [];
    loan.history.push({ action: "REJECT", by: rejectedBy as any, byName: null, byEmail: null, note: reason ?? null, at: new Date() });
  }
  await loan.save();
  await notifyUser(String(loan.borrowerId), "Loan Rejected", reason, "loan_rejected");
  return loan;
}

export async function withdrawLoan(id: string, borrowerId: string) {
  const loan = await Loan.findById(id);
  if (!loan) throw new AppError(404, "Loan not found");
  if (String(loan.borrowerId) !== borrowerId) throw new AppError(403, "You can only withdraw your own application");
  if (loan.status !== "APPLIED") throw new AppError(400, "Only APPLIED loans can be withdrawn");
  loan.status = "WITHDRAWN";
  loan.outstandingAmount = 0;
  await loan.save();
  await notifyUser(String(loan.borrowerId), "Loan Withdrawn", "Your loan application has been withdrawn.", "loan_withdrawn");
  return loan;
}

export async function disburseLoan(id: string, disbursedBy: string, transactionReference: string, proofUrl?: string, disbursementDate?: string) {
  const loan = await Loan.findById(id);
  if (!loan) throw new AppError(404, "Loan not found");
  if (loan.status !== "SANCTIONED") throw new AppError(400, "Only SANCTIONED loans can be disbursed");
  const fromStatus = loan.status;
  loan.status = "DISBURSED";
  loan.disbursedBy = disbursedBy as any;
  loan.transactionReference = transactionReference;
  loan.disbursementProofUrl = proofUrl ?? null;
  loan.disbursementDate = disbursementDate ? new Date(disbursementDate) : new Date();
  // record history entry for disbursement
  try {
    const user = await User.findById(disbursedBy).select("name email").lean();
    loan.history = loan.history || [];
    loan.history.push({
      action: "DISBURSE",
      by: user?._id ?? null,
      byName: user?.name ?? null,
      byEmail: user?.email ?? null,
      note: `Disbursed via ${transactionReference}`,
      transactionReference: transactionReference ?? null,
      fromStatus: fromStatus ?? null,
      toStatus: loan.status,
      amount: loan.amount ?? null,
      balanceAfter: loan.outstandingAmount ?? null,
      at: new Date(),
    });
  } catch (err) {
    loan.history = loan.history || [];
    loan.history.push({
      action: "DISBURSE",
      by: disbursedBy as any,
      byName: null,
      byEmail: null,
      note: `Disbursed via ${transactionReference}`,
      transactionReference: transactionReference ?? null,
      fromStatus: fromStatus ?? null,
      toStatus: loan.status,
      amount: loan.amount ?? null,
      balanceAfter: loan.outstandingAmount ?? null,
      at: new Date(),
    });
  }

  await loan.save();
  await notifyUser(String(loan.borrowerId), "Loan Disbursed", `Your loan has been disbursed.`, "loan_disbursed");
  return loan;
}

export async function closeLoan(id: string) {
  const loan = await Loan.findById(id);
  if (!loan) throw new AppError(404, "Loan not found");
  if (!(["DISBURSED", "SANCTIONED"].includes(loan.status))) throw new AppError(400, "Loan cannot be closed");
  loan.status = "CLOSED";
  loan.outstandingAmount = 0;
  await loan.save();
  await notifyUser(String(loan.borrowerId), "Loan Closed", "Your loan has been closed.", "loan_closed");
  return loan;
}

export async function createBorrowerProfile(input: { userId: string; pan: string; dob: string; salary: number; employmentMode: string; address: string; city: string; state: string; pincode: string; }) {
  const age = new Date(input.dob);
  const profile = await BorrowerProfile.findOneAndUpdate(
    { userId: input.userId },
    {
      userId: input.userId,
      pan: input.pan,
      dob: age,
      salary: input.salary,
      employmentMode: input.employmentMode,
      address: input.address,
      city: input.city,
      state: input.state,
      pincode: input.pincode,
    },
    { upsert: true, new: true },
  );
  return profile;
}

export async function getBorrowerDashboard(input: { borrowerId: string }) {
  const [profile, loans, documents, payments] = await Promise.all([
    BorrowerProfile.findOne({ userId: input.borrowerId }).lean(),
    Loan.find({ borrowerId: input.borrowerId }).sort({ createdAt: -1 }).lean(),
    Document.find({ borrowerId: input.borrowerId }).sort({ createdAt: -1 }).lean(),
    Payment.aggregate([
      {
        $lookup: {
          from: "loans",
          localField: "loanId",
          foreignField: "_id",
          as: "loan",
        },
      },
      { $unwind: "$loan" },
      {
        $match: {
          $expr: {
            $eq: [{ $toString: "$loan.borrowerId" }, input.borrowerId],
          },
        },
      },
      { $sort: { paymentDate: -1 } },
      {
        $project: {
          _id: 1,
          loanId: 1,
          amount: 1,
          utrNumber: 1,
          paymentDate: 1,
          collectedBy: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ]),
  ]);
  const account = await User.findById(input.borrowerId).select("name email phone role secondaryEmail secondaryEmailVerifiedAt phoneVerifiedAt").lean();

  const summary = {
    totalApplications: loans.length,
    pending: loans.filter((loan) => loan.status === "APPLIED").length,
    withdrawn: loans.filter((loan) => loan.status === "WITHDRAWN").length,
    approved: loans.filter((loan) => loan.status === "SANCTIONED").length,
    disbursed: loans.filter((loan) => loan.status === "DISBURSED").length,
    rejected: loans.filter((loan) => loan.status === "REJECTED").length,
    closed: loans.filter((loan) => loan.status === "CLOSED").length,
    appliedValue: loans.filter((loan) => loan.status !== "WITHDRAWN").reduce((sum, loan) => sum + loan.amount, 0),
  };

  return {
    account: account ? {
      id: String(account._id),
      name: account.name,
      email: account.email,
      phone: account.phone,
      role: account.role,
      secondaryEmail: account.secondaryEmail ?? null,
      secondaryEmailVerifiedAt: account.secondaryEmailVerifiedAt ?? null,
      phoneVerifiedAt: account.phoneVerifiedAt ?? null,
    } : null,
    profile,
    loans,
    documents,
    payments,
    summary,
  };
}
