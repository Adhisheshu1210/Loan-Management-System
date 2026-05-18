import { Types } from "mongoose";
import { BorrowerProfile } from "../models/BorrowerProfile.js";
import { Document } from "../models/Document.js";
import { Loan } from "../models/Loan.js";
import { Payment } from "../models/Payment.js";
import { User } from "../models/User.js";
import { AppError } from "../utils/app-error.js";
import { sanctionLoan, rejectLoan, disburseLoan } from "./loan.service.js";
import { addPayment } from "./payment.service.js";
import { storeUpload } from "./upload.service.js";

function getMonthSeries(monthCount = 6) {
  const months = [];
  const current = new Date();
  current.setDate(1);

  for (let offset = monthCount - 1; offset >= 0; offset -= 1) {
    const date = new Date(current.getFullYear(), current.getMonth() - offset, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    months.push({
      key,
      label: date.toLocaleString("en-US", { month: "short" }),
    });
  }

  return months;
}

function buildMonthLookup<T extends { _id?: string | null; total?: number }>(series: T[], months: { key: string; label: string }[]) {
  const lookup = new Map(series.map((entry) => [entry._id ?? "", Number(entry.total ?? 0)]));
  return months.map((month) => ({ month: month.label, value: lookup.get(month.key) ?? 0 }));
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function canonicalizePhoneNumber(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }
  return digits;
}

function toObjectId(value?: string) {
  if (!value || !Types.ObjectId.isValid(value)) return undefined;
  return new Types.ObjectId(value);
}

function csvCell(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function buildCsv(rows: Array<Array<unknown>>) {
  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

export async function getDashboardStats() {
  const [totalLoans, activeLoans, closedLoans, disbursedLoans, collectionsAgg] = await Promise.all([
    Loan.countDocuments(),
    Loan.countDocuments({ status: { $in: ["APPLIED", "SANCTIONED", "DISBURSED"] } }),
    Loan.countDocuments({ status: "CLOSED" }),
    Loan.aggregate([{ $match: { status: "DISBURSED" } }, { $group: { _id: null, total: { $sum: "$totalRepayment" } } }]),
    Loan.aggregate([{ $group: { _id: null, total: { $sum: "$paidAmount" } } }]),
  ]);

  return {
    totalLoans,
    activeLoans,
    closedLoans,
    totalDisbursed: disbursedLoans[0]?.total ?? 0,
    totalCollections: collectionsAgg[0]?.total ?? 0,
  };
}

type ExecutiveRole = "SALES" | "SANCTION" | "DISBURSEMENT" | "COLLECTION";

type ExecutiveProfileInput = {
  name: string;
  phone: string;
  secondaryEmail?: string | null;
};

export async function getExecutiveProfile(userId: string) {
  const user = await User.findById(userId).select("name email phone role isActive secondaryEmail secondaryEmailVerifiedAt phoneVerifiedAt createdAt updatedAt").lean();
  if (!user) {
    throw new AppError(404, "Profile not found");
  }

  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isActive: user.isActive,
    secondaryEmail: user.secondaryEmail ?? null,
    secondaryEmailVerifiedAt: user.secondaryEmailVerifiedAt ?? null,
    phoneVerifiedAt: user.phoneVerifiedAt ?? null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function updateExecutiveProfile(userId: string, input: ExecutiveProfileInput) {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(404, "Profile not found");
  }

  const normalizedPhone = canonicalizePhoneNumber(input.phone);
  const duplicate = await User.findOne({ _id: { $ne: user._id }, phone: normalizedPhone }).select("_id").lean();
  if (duplicate) {
    throw new AppError(409, "Phone number already in use");
  }

  user.name = input.name.trim();
  user.phone = normalizedPhone;
  user.phoneVerifiedAt = null;
  user.phoneVerificationToken = null;
  user.phoneVerificationExpires = null;
  user.secondaryEmail = input.secondaryEmail?.trim() ? input.secondaryEmail.trim().toLowerCase() : null;
  user.secondaryEmailVerifiedAt = null;
  user.secondaryEmailVerificationToken = null;
  user.secondaryEmailVerificationExpires = null;
  await user.save();

  return getExecutiveProfile(userId);
}

async function getSalesWorkspace() {
  const borrowedIds = await Loan.distinct("borrowerId");
  const leads = await User.find({ role: "BORROWER", _id: { $nin: borrowedIds } })
    .select("name email phone role createdAt updatedAt")
    .sort({ createdAt: -1 })
    .limit(12)
    .lean();

  const leadProfiles = await BorrowerProfile.find({ userId: { $in: leads.map((lead) => lead._id) } }).select("userId breEligible updatedAt createdAt").lean();
  const profileLookup = new Map(leadProfiles.map((profile) => [String(profile.userId), profile]));

  return {
    summary: {
      totalLeads: leads.length,
      profileReady: leadProfiles.length,
      unengagedLeads: leads.length - leadProfiles.length,
    },
    leads: leads.map((lead) => ({
      id: String(lead._id),
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      createdAt: lead.createdAt,
      profileReady: profileLookup.has(String(lead._id)),
    })),
  };
}

async function getSanctionWorkspace() {
  const loans = await Loan.find({ status: "APPLIED" }).sort({ createdAt: -1 }).limit(15).populate("borrowerId", "name email phone role").lean();
  const totalRequested = loans.reduce((sum, loan) => sum + Number(loan.amount ?? 0), 0);
  return {
    summary: {
      pendingApplications: loans.length,
      totalRequested,
      averageRequested: loans.length ? Math.round(totalRequested / loans.length) : 0,
    },
    loans,
  };
}

async function getDisbursementWorkspace() {
  const loans = await Loan.find({ status: "SANCTIONED" }).sort({ updatedAt: -1, createdAt: -1 }).limit(15).populate("borrowerId sanctionedBy", "name email phone role").lean();
  const totalSanctioned = loans.reduce((sum, loan) => sum + Number(loan.totalRepayment ?? 0), 0);
  return {
    summary: {
      sanctionedLoans: loans.length,
      sanctionedAmount: totalSanctioned,
      readyToDisburse: loans.filter((loan) => !loan.transactionReference).length,
    },
    loans,
  };
}

async function getCollectionWorkspace() {
  const loans = await Loan.find({ status: "DISBURSED" }).sort({ updatedAt: -1, createdAt: -1 }).limit(15).populate("borrowerId disbursedBy", "name email phone role").lean();
  const recentPayments = await Payment.find().sort({ createdAt: -1 }).limit(12).populate("loanId collectedBy", "status amount outstandingAmount borrowerId totalRepayment").lean();
  const outstandingAmount = loans.reduce((sum, loan) => sum + Number(loan.outstandingAmount ?? 0), 0);
  return {
    summary: {
      activeLoans: loans.length,
      outstandingAmount,
      recentPayments: recentPayments.length,
    },
    loans,
    recentPayments,
  };
}

export async function getExecutiveWorkspace(role: ExecutiveRole) {
  if (role === "SALES") {
    return { role, ...(await getSalesWorkspace()) };
  }
  if (role === "SANCTION") {
    return { role, ...(await getSanctionWorkspace()) };
  }
  if (role === "DISBURSEMENT") {
    return { role, ...(await getDisbursementWorkspace()) };
  }
  return { role, ...(await getCollectionWorkspace()) };
}

function modulePaging(page = 1, limit = 10, maxLimit = 50) {
  const safePage = Math.max(Number(page), 1);
  const safeLimit = Math.min(Math.max(Number(limit), 1), maxLimit);
  return { page: safePage, limit: safeLimit, skip: (safePage - 1) * safeLimit };
}

export async function listSalesBorrowers(input: { page?: number; limit?: number; search?: string; status?: string }) {
  const { page, limit, skip } = modulePaging(input.page, input.limit);
  const search = typeof input.search === "string" ? input.search.trim() : "";
  const filter: Record<string, unknown> = { role: "BORROWER" };
  if (search) {
    filter.$or = [
      { name: { $regex: escapeRegex(search), $options: "i" } },
      { email: { $regex: escapeRegex(search), $options: "i" } },
      { phone: { $regex: escapeRegex(search), $options: "i" } },
    ];
  }

  const [borrowers, total] = await Promise.all([
    User.find(filter).select("name email phone createdAt updatedAt").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  const borrowerIds = borrowers.map((borrower) => borrower._id);
  const [profiles, latestLoans] = await Promise.all([
    BorrowerProfile.find({ userId: { $in: borrowerIds } }).select("userId breEligible updatedAt").lean(),
    Loan.aggregate([
      { $match: { borrowerId: { $in: borrowerIds } } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: "$borrowerId", status: { $first: "$status" }, updatedAt: { $first: "$updatedAt" } } },
    ]),
  ]);

  const profileMap = new Map(profiles.map((profile) => [String(profile.userId), profile]));
  const loanMap = new Map(latestLoans.map((loan) => [String(loan._id), loan]));

  const items = borrowers.map((borrower) => {
    const profile = profileMap.get(String(borrower._id));
    const latestLoan = loanMap.get(String(borrower._id));
    const derivedStatus = latestLoan?.status ?? (profile ? "INCOMPLETE" : "NEW");
    return {
      id: String(borrower._id),
      name: borrower.name,
      email: borrower.email,
      phone: borrower.phone,
      profileReady: Boolean(profile),
      breEligible: profile?.breEligible ?? null,
      latestApplicationStatus: derivedStatus,
      lastActivityAt: latestLoan?.updatedAt ?? profile?.updatedAt ?? borrower.updatedAt,
      createdAt: borrower.createdAt,
    };
  });

  const status = typeof input.status === "string" ? input.status.trim().toUpperCase() : "ALL";
  const filtered = status && status !== "ALL" ? items.filter((item) => item.latestApplicationStatus === status) : items;

  return { items: filtered, total: status && status !== "ALL" ? filtered.length : total, page, limit };
}

export async function listSanctionApplications(input: { page?: number; limit?: number; search?: string; status?: string }) {
  const { page, limit, skip } = modulePaging(input.page, input.limit);
  const search = typeof input.search === "string" ? input.search.trim() : "";
  const status = typeof input.status === "string" && input.status !== "ALL" ? input.status : "APPLIED";
  const filter: Record<string, unknown> = { status };

  if (search) {
    const borrowers = await User.find({
      role: "BORROWER",
      $or: [
        { name: { $regex: escapeRegex(search), $options: "i" } },
        { email: { $regex: escapeRegex(search), $options: "i" } },
        { phone: { $regex: escapeRegex(search), $options: "i" } },
      ],
    }).select("_id");
    filter.borrowerId = { $in: borrowers.map((borrower) => borrower._id) };
  }

  const [loans, total] = await Promise.all([
    Loan.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("borrowerId", "name email phone role").lean(),
    Loan.countDocuments(filter),
  ]);

  const borrowerIds = Array.from(new Set(loans.map((loan) => String((loan.borrowerId as any)?._id ?? loan.borrowerId))));
  const docs = await Document.find({ borrowerId: { $in: borrowerIds.map((id) => new Types.ObjectId(id)) } }).sort({ uploadedAt: -1 }).lean();
  const docsMap = new Map<string, typeof docs>();
  borrowerIds.forEach((id) => docsMap.set(id, []));
  docs.forEach((doc) => {
    const key = String(doc.borrowerId);
    const current = docsMap.get(key) ?? [];
    current.push(doc);
    docsMap.set(key, current);
  });

  return {
    items: loans.map((loan) => {
      const borrowerId = String((loan.borrowerId as any)?._id ?? loan.borrowerId);
      // ensure returned fileUrl is absolute when needed
      const documents = (docsMap.get(borrowerId) ?? []).map((doc: any) => ({
        ...doc,
        fileUrl: typeof doc.fileUrl === "string" && doc.fileUrl.startsWith("/") ? `${process.env.SERVER_ORIGIN ?? "http://localhost:5000"}${doc.fileUrl}` : doc.fileUrl,
      }));
      return {
        ...loan,
        salarySlips: documents.filter((doc) => /pdf|image\/(jpeg|png)/i.test(doc.fileType)).slice(0, 5),
        documents,
      };
    }),
    total,
    page,
    limit,
  };
}

export async function listSanctionHistory(input: { page?: number; limit?: number; fromDate?: string; toDate?: string; search?: string; action?: "APPROVED" | "REJECTED" | "ALL" }) {
  const { page, limit, skip } = modulePaging(input.page, input.limit);
  const match: Record<string, unknown> = {};

  // search may match borrower name or email
  const search = typeof input.search === "string" ? input.search.trim() : "";

  const dateMatch: Record<string, unknown> = {};
  if (input.fromDate) dateMatch.$gte = new Date(input.fromDate);
  if (input.toDate) dateMatch.$lte = new Date(input.toDate);

  const pipeline: any[] = [
    { $unwind: "$history" },
    { $match: { $or: [{ "history.action": "SANCTION" }, { "history.action": "REJECT" }] } },
  ];

  if (input.action === "APPROVED") {
    pipeline.push({ $match: { "history.action": "SANCTION" } });
  } else if (input.action === "REJECTED") {
    pipeline.push({ $match: { "history.action": "REJECT" } });
  }

  if (input.fromDate || input.toDate) {
    pipeline.push({ $match: { "history.at": dateMatch } });
  }

  if (search) {
    // lookup borrower will add borrower info later; perform a regex match against embedded borrower fields after lookup
  }

  pipeline.push(
    {
      $lookup: {
        from: "users",
        localField: "borrowerId",
        foreignField: "_id",
        as: "borrower",
      },
    },
    { $unwind: { path: "$borrower", preserveNullAndEmptyArrays: true } },
  );

  if (search) {
    pipeline.push({ $match: { $or: [{ "borrower.name": { $regex: escapeRegex(search), $options: "i" } }, { "borrower.email": { $regex: escapeRegex(search), $options: "i" } }] } });
  }

  pipeline.push(
    { $sort: { "history.at": -1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        loanId: "$_id",
        action: "$history.action",
        note: "$history.note",
        at: "$history.at",
        fromStatus: "$history.fromStatus",
        toStatus: "$history.toStatus",
        by: "$history.by",
        byName: "$history.byName",
        byEmail: "$history.byEmail",
        amount: "$history.amount",
        utrNumber: "$history.utrNumber",
        transactionReference: "$history.transactionReference",
        borrower: { _id: "$borrower._id", name: "$borrower.name", email: "$borrower.email", phone: "$borrower.phone" },
      },
    },
  );

  const countPipeline: any[] = [
    { $unwind: "$history" },
    { $match: { $or: [{ "history.action": "SANCTION" }, { "history.action": "REJECT" }] } },
  ];
  if (input.action === "APPROVED") {
    countPipeline.push({ $match: { "history.action": "SANCTION" } });
  } else if (input.action === "REJECTED") {
    countPipeline.push({ $match: { "history.action": "REJECT" } });
  }
  if (input.fromDate || input.toDate) countPipeline.push({ $match: { "history.at": dateMatch } });
  countPipeline.push({ $count: "total" });

  const [rows, countRows] = await Promise.all([
    Loan.aggregate(pipeline),
    Loan.aggregate(countPipeline),
  ]);

  return { items: rows, total: countRows[0]?.total ?? 0, page, limit };
}

export async function exportSanctionHistoryCsv(input: { fromDate?: string; toDate?: string; search?: string; action?: "APPROVED" | "REJECTED" | "ALL" }) {
  const { items } = await listSanctionHistory({ page: 1, limit: 10000, fromDate: input.fromDate, toDate: input.toDate, search: input.search, action: input.action });
  return buildCsv([
    ["Loan ID", "Borrower", "Email", "Action", "Amount", "At", "Actor", "Actor Email", "Note"],
    ...items.map((it: any) => [String(it.loanId), it.borrower?.name ?? "", it.borrower?.email ?? "", it.action === "SANCTION" ? "APPROVED" : "REJECTED", it.amount ?? "", new Date(it.at).toISOString(), it.byName ?? "", it.byEmail ?? "", it.note ?? ""]),
  ]);
}

export async function listDisbursementHistory(input: { page?: number; limit?: number; fromDate?: string; toDate?: string; search?: string }) {
  const { page, limit, skip } = modulePaging(input.page, input.limit);
  const dateMatch: Record<string, unknown> = {};
  if (input.fromDate) dateMatch.$gte = new Date(input.fromDate);
  if (input.toDate) dateMatch.$lte = new Date(input.toDate);

  const pipeline: any[] = [
    { $unwind: "$history" },
    { $match: { "history.action": "DISBURSE" } },
  ];

  if (input.fromDate || input.toDate) pipeline.push({ $match: { "history.at": dateMatch } });

  pipeline.push(
    {
      $lookup: {
        from: "users",
        localField: "borrowerId",
        foreignField: "_id",
        as: "borrower",
      },
    },
    { $unwind: { path: "$borrower", preserveNullAndEmptyArrays: true } },
    { $sort: { "history.at": -1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        loanId: "$_id",
        action: "$history.action",
        note: "$history.note",
        at: "$history.at",
        fromStatus: "$history.fromStatus",
        toStatus: "$history.toStatus",
        by: "$history.by",
        byName: "$history.byName",
        byEmail: "$history.byEmail",
        amount: "$history.amount",
        utrNumber: "$history.utrNumber",
        transactionReference: "$history.transactionReference",
        balanceAfter: "$history.balanceAfter",
        borrower: { _id: "$borrower._id", name: "$borrower.name", email: "$borrower.email", phone: "$borrower.phone" },
      },
    },
  );

  const countPipeline: any[] = [
    { $unwind: "$history" },
    { $match: { "history.action": "DISBURSE" } },
  ];
  if (input.fromDate || input.toDate) countPipeline.push({ $match: { "history.at": dateMatch } });
  countPipeline.push({ $count: "total" });

  const [rows, countRows] = await Promise.all([Loan.aggregate(pipeline), Loan.aggregate(countPipeline)]);
  return { items: rows, total: countRows[0]?.total ?? 0, page, limit };
}

export async function exportDisbursementHistoryCsv(input: { fromDate?: string; toDate?: string; search?: string }) {
  const { items } = await listDisbursementHistory({ page: 1, limit: 10000, fromDate: input.fromDate, toDate: input.toDate, search: input.search });
  return buildCsv([
    ["Loan ID", "Borrower", "Email", "Amount", "Transaction Reference", "UTR", "At", "Actor"],
    ...items.map((it: any) => [String(it.loanId), it.borrower?.name ?? "", it.borrower?.email ?? "", it.amount ?? "", it.transactionReference ?? "", it.utrNumber ?? "", new Date(it.at).toISOString(), it.byEmail ?? it.byName ?? ""]),
  ]);
}

export async function listCollectionHistory(input: { page?: number; limit?: number; fromDate?: string; toDate?: string; search?: string }) {
  const { page, limit, skip } = modulePaging(input.page, input.limit);
  const match: Record<string, unknown> = {};

  const dateMatch: Record<string, unknown> = {};
  if (input.fromDate) dateMatch.$gte = new Date(input.fromDate);
  if (input.toDate) dateMatch.$lte = new Date(input.toDate);
  if (input.fromDate || input.toDate) match.paymentDate = dateMatch;

  const search = typeof input.search === "string" ? input.search.trim() : "";

  const pipeline: any[] = [
    { $match: match },
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
      $lookup: {
        from: "users",
        localField: "loan.borrowerId",
        foreignField: "_id",
        as: "borrower",
      },
    },
    { $unwind: { path: "$borrower", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "users",
        localField: "collectedBy",
        foreignField: "_id",
        as: "collector",
      },
    },
    { $unwind: { path: "$collector", preserveNullAndEmptyArrays: true } },
  ];

  if (search) {
    pipeline.push({
      $match: {
        $or: [
          { utrNumber: { $regex: escapeRegex(search), $options: "i" } },
          { "borrower.name": { $regex: escapeRegex(search), $options: "i" } },
          { "borrower.email": { $regex: escapeRegex(search), $options: "i" } },
        ],
      },
    });
  }

  pipeline.push({ $sort: { paymentDate: -1, createdAt: -1 } }, { $skip: skip }, { $limit: limit });
  pipeline.push({
    $project: {
      _id: 1,
      amount: 1,
      utrNumber: 1,
      paymentDate: 1,
      createdAt: 1,
      loan: { _id: "$loan._id", status: "$loan.status", outstandingAmount: "$loan.outstandingAmount" },
      borrower: { _id: "$borrower._id", name: "$borrower.name", email: "$borrower.email" },
      collector: { _id: "$collector._id", name: "$collector.name", email: "$collector.email" },
    },
  });

  const [rows, countRows] = await Promise.all([Payment.aggregate(pipeline), Payment.aggregate([{ $match: match }, { $count: "total" }])]);
  return { items: rows, total: countRows[0]?.total ?? 0, page, limit };
}

export async function exportCollectionHistoryCsv(input: { fromDate?: string; toDate?: string; search?: string }) {
  const { items } = await listCollectionHistory({ page: 1, limit: 10000, fromDate: input.fromDate, toDate: input.toDate, search: input.search });
  return buildCsv([
    ["Payment ID", "Loan ID", "Borrower", "Collector", "Amount", "UTR", "Payment Date", "Loan Status", "Outstanding"],
    ...items.map((it: any) => [String(it._id), it.loan?._id ? String(it.loan._id) : "", it.borrower?.name ?? "", it.collector?.name ?? "", it.amount, it.utrNumber ?? "", it.paymentDate ? new Date(it.paymentDate).toISOString() : "", it.loan?.status ?? "", it.loan?.outstandingAmount ?? ""]),
  ]);
}

export async function decideSanctionApplication(input: { loanId: string; decision: "APPROVE" | "REJECT"; actorId: string; notes?: string; reason?: string }) {
  if (input.decision === "APPROVE") {
    return sanctionLoan(input.loanId, input.actorId, input.notes);
  }
  if (!input.reason?.trim()) {
    throw new AppError(400, "Rejection reason is required");
  }
  return rejectLoan(input.loanId, input.actorId, input.reason.trim());
}

export async function listDisbursementLoans(input: { page?: number; limit?: number; search?: string }) {
  const { page, limit, skip } = modulePaging(input.page, input.limit);
  const search = typeof input.search === "string" ? input.search.trim() : "";
  const filter: Record<string, unknown> = { status: "SANCTIONED" };
  if (search) {
    const borrowers = await User.find({
      role: "BORROWER",
      $or: [
        { name: { $regex: escapeRegex(search), $options: "i" } },
        { email: { $regex: escapeRegex(search), $options: "i" } },
        { phone: { $regex: escapeRegex(search), $options: "i" } },
      ],
    }).select("_id");
    filter.borrowerId = { $in: borrowers.map((borrower) => borrower._id) };
  }

  const [items, total] = await Promise.all([
    Loan.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("borrowerId sanctionedBy", "name email phone role").lean(),
    Loan.countDocuments(filter),
  ]);

  return { items, total, page, limit };
}

export async function markDisbursed(input: { loanId: string; actorId: string; transactionReference: string; disbursementDate?: string; proofUrl?: string }) {
  return disburseLoan(input.loanId, input.actorId, input.transactionReference, input.proofUrl, input.disbursementDate);
}

export async function uploadDisbursementProof(input: { loanId: string; file: Express.Multer.File }) {
  const loan = await Loan.findById(input.loanId);
  if (!loan) {
    throw new AppError(404, "Loan not found");
  }
  if (!(["SANCTIONED", "DISBURSED"].includes(loan.status))) {
    throw new AppError(400, "Proof can only be uploaded for sanctioned or disbursed loans");
  }

  const uploaded = await storeUpload(input.file);
  loan.disbursementProofUrl = uploaded.fileUrl;
  await loan.save();

  return {
    loanId: String(loan._id),
    proofUrl: loan.disbursementProofUrl,
  };
}

export async function listCollectionLoans(input: { page?: number; limit?: number; search?: string }) {
  const { page, limit, skip } = modulePaging(input.page, input.limit);
  const search = typeof input.search === "string" ? input.search.trim() : "";
  const filter: Record<string, unknown> = { status: "DISBURSED" };

  if (search) {
    const borrowers = await User.find({
      role: "BORROWER",
      $or: [
        { name: { $regex: escapeRegex(search), $options: "i" } },
        { email: { $regex: escapeRegex(search), $options: "i" } },
        { phone: { $regex: escapeRegex(search), $options: "i" } },
      ],
    }).select("_id");
    filter.borrowerId = { $in: borrowers.map((borrower) => borrower._id) };
  }

  const [items, total] = await Promise.all([
    Loan.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).populate("borrowerId disbursedBy", "name email phone role").lean(),
    Loan.countDocuments(filter),
  ]);

  return { items, total, page, limit };
}

export async function createCollectionPayment(input: { loanId: string; amount: number; utrNumber: string; paymentDate: string; collectedBy: string }) {
  return addPayment(input);
}

export async function listCollectionPayments(input: { page?: number; limit?: number; loanId?: string; search?: string }) {
  const { page, limit, skip } = modulePaging(input.page, input.limit);
  const match: Record<string, unknown> = {};
  if (input.loanId && Types.ObjectId.isValid(input.loanId)) {
    match.loanId = new Types.ObjectId(input.loanId);
  }

  const search = typeof input.search === "string" ? input.search.trim() : "";

  const pipeline: any[] = [
    { $match: match },
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
      $lookup: {
        from: "users",
        localField: "loan.borrowerId",
        foreignField: "_id",
        as: "borrower",
      },
    },
    { $unwind: { path: "$borrower", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "users",
        localField: "collectedBy",
        foreignField: "_id",
        as: "collector",
      },
    },
    { $unwind: { path: "$collector", preserveNullAndEmptyArrays: true } },
  ];

  if (search) {
    pipeline.push({
      $match: {
        $or: [
          { utrNumber: { $regex: escapeRegex(search), $options: "i" } },
          { "borrower.name": { $regex: escapeRegex(search), $options: "i" } },
          { "borrower.email": { $regex: escapeRegex(search), $options: "i" } },
        ],
      },
    });
  }

  const [rows, countRows] = await Promise.all([
    Payment.aggregate([
      ...pipeline,
      { $sort: { paymentDate: -1, createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          amount: 1,
          utrNumber: 1,
          paymentDate: 1,
          createdAt: 1,
          loan: {
            _id: "$loan._id",
            status: "$loan.status",
            totalRepayment: "$loan.totalRepayment",
            outstandingAmount: "$loan.outstandingAmount",
          },
          borrower: {
            _id: "$borrower._id",
            name: "$borrower.name",
            email: "$borrower.email",
            phone: "$borrower.phone",
          },
          collector: {
            _id: "$collector._id",
            name: "$collector.name",
            email: "$collector.email",
          },
        },
      },
    ]),
    Payment.aggregate([...pipeline, { $count: "total" }]),
  ]);

  return { items: rows, total: countRows[0]?.total ?? 0, page, limit };
}

export async function exportSalesBorrowersCsv(input: { search?: string; status?: string }) {
  const { items } = await listSalesBorrowers({ page: 1, limit: 1000, search: input.search, status: input.status });
  return buildCsv([
    ["Borrower ID", "Name", "Email", "Phone", "Profile Ready", "BRE Eligible", "Application Status", "Last Activity", "Created At"],
    ...items.map((item) => [
      item.id,
      item.name,
      item.email,
      item.phone,
      item.profileReady ? "Yes" : "No",
      item.breEligible === null ? "N/A" : item.breEligible ? "Yes" : "No",
      item.latestApplicationStatus,
      new Date(item.lastActivityAt).toISOString(),
      new Date(item.createdAt).toISOString(),
    ]),
  ]);
}

export async function exportSanctionLoansCsv(input: { search?: string; status?: string }) {
  const { items } = await listSanctionApplications({ page: 1, limit: 1000, search: input.search, status: input.status });
  return buildCsv([
    ["Loan ID", "Borrower", "Email", "Phone", "Amount", "Repayment", "Status", "Sanction Notes", "Rejection Reason", "Created At"],
    ...items.map((item: any) => [
      String(item._id),
      item.borrowerId?.name ?? "",
      item.borrowerId?.email ?? "",
      item.borrowerId?.phone ?? "",
      item.amount,
      item.totalRepayment,
      item.status,
      item.sanctionNotes ?? "",
      item.rejectionReason ?? "",
      new Date(item.createdAt).toISOString(),
    ]),
  ]);
}

export async function exportDisbursementLoansCsv(input: { search?: string }) {
  const { items } = await listDisbursementLoans({ page: 1, limit: 1000, search: input.search });
  return buildCsv([
    ["Loan ID", "Borrower", "Email", "Phone", "Amount", "Repayment", "Status", "Transaction Reference", "Disbursement Date", "Proof URL"],
    ...items.map((item: any) => [
      String(item._id),
      item.borrowerId?.name ?? "",
      item.borrowerId?.email ?? "",
      item.borrowerId?.phone ?? "",
      item.amount,
      item.totalRepayment,
      item.status,
      item.transactionReference ?? "",
      item.disbursementDate ? new Date(item.disbursementDate).toISOString() : "",
      item.disbursementProofUrl ?? "",
    ]),
  ]);
}

export async function exportCollectionPaymentsCsv(input: { search?: string; loanId?: string }) {
  const { items } = await listCollectionPayments({ page: 1, limit: 1000, search: input.search, loanId: input.loanId });
  return buildCsv([
    ["Payment ID", "Loan ID", "Borrower", "Collector", "Amount", "UTR", "Payment Date", "Loan Status", "Outstanding"],
    ...items.map((item: any) => [
      String(item._id),
      item.loan?._id ? String(item.loan._id) : "",
      item.borrower?.name ?? "",
      item.collector?.name ?? "",
      item.amount,
      item.utrNumber,
      item.paymentDate ? new Date(item.paymentDate).toISOString() : "",
      item.loan?.status ?? "",
      item.loan?.outstandingAmount ?? "",
    ]),
  ]);
}

export async function getLoanTimeline(loanId: string) {
  const loan = await Loan.findById(loanId).populate("borrowerId sanctionedBy disbursedBy", "name email role").lean();
  if (!loan) {
    throw new AppError(404, "Loan not found");
  }

  const payments = await Payment.find({ loanId: loan._id }).sort({ paymentDate: 1, createdAt: 1 }).populate("collectedBy", "name email role").lean();

  function actorText(userObj: any, historyAction?: { byName?: string | null; byEmail?: string | null } | null) {
    const name = userObj?.name ?? historyAction?.byName ?? null;
    const email = userObj?.email ?? historyAction?.byEmail ?? null;
    if (!name && !email) return null;
    return email ? `${name ?? email} <${email}>` : `${name}`;
  }

  const events: Array<{ at: string; type: string; actor?: string; note?: string; amount?: number; utrNumber?: string; transactionReference?: string | null; fromStatus?: string | null; toStatus?: string | null; balanceAfter?: number | null; status?: string }> = [
    {
      at: new Date(loan.createdAt).toISOString(),
      type: "LOAN_APPLIED",
      actor: (loan.borrowerId as any)?.name ?? "Borrower",
      status: "APPLIED",
    },
  ];

  if (loan.status === "REJECTED") {
    const historyReject = Array.isArray(loan.history) ? loan.history.find((h: any) => h.action === "REJECT") : null;
    events.push({
      at: new Date(loan.updatedAt).toISOString(),
      type: "LOAN_REJECTED",
      actor: actorText(loan.sanctionedBy as any, historyReject) ?? "Sanction Executive",
      note: loan.rejectionReason ?? (historyReject?.note ?? "Rejected"),
      status: "REJECTED",
    });
  }

  if (loan.status === "SANCTIONED" || loan.status === "DISBURSED" || loan.status === "CLOSED") {
    const historySanction = Array.isArray(loan.history) ? loan.history.find((h: any) => h.action === "SANCTION") : null;
    events.push({
      at: new Date(loan.updatedAt).toISOString(),
      type: "LOAN_SANCTIONED",
      actor: actorText(loan.sanctionedBy as any, historySanction) ?? "Sanction Executive",
      note: loan.sanctionNotes ?? (historySanction?.note ?? undefined),
      status: "SANCTIONED",
    });
  }

  if (loan.status === "DISBURSED" || loan.status === "CLOSED") {
    const historyDisburse = Array.isArray(loan.history) ? loan.history.find((h: any) => h.action === "DISBURSE") : null;
    events.push({
      at: new Date(loan.disbursementDate ?? loan.updatedAt).toISOString(),
      type: "LOAN_DISBURSED",
      actor: actorText(loan.disbursedBy as any, historyDisburse) ?? ((loan.disbursedBy as any)?.name ?? "Disbursement Executive"),
      note: historyDisburse?.note ?? loan.transactionReference ?? undefined,
      transactionReference: historyDisburse?.transactionReference ?? loan.transactionReference ?? null,
      fromStatus: historyDisburse?.fromStatus ?? "SANCTIONED",
      toStatus: historyDisburse?.toStatus ?? "DISBURSED",
      amount: historyDisburse?.amount ?? loan.amount ?? null,
      balanceAfter: historyDisburse?.balanceAfter ?? loan.outstandingAmount ?? null,
      status: "DISBURSED",
    });
  }

  for (const payment of payments) {
    const collectedBy = payment.collectedBy as { name?: string; email?: string } | null | undefined;
    events.push({
      at: new Date(payment.paymentDate).toISOString(),
      type: "PAYMENT_RECORDED",
      actor: collectedBy?.email ? `${collectedBy.name ?? collectedBy.email} <${collectedBy.email}>` : collectedBy?.name ?? "Collection Executive",
      amount: payment.amount,
      utrNumber: payment.utrNumber,
      status: loan.status,
    });
  }

  if (loan.status === "CLOSED") {
    events.push({
      at: new Date(loan.updatedAt).toISOString(),
      type: "LOAN_CLOSED",
      actor: "System",
      note: "Loan auto-closed on full repayment",
      status: "CLOSED",
    });
  }

  // Include history entries (explicit audit trail) if present
  if (Array.isArray(loan.history) && loan.history.length) {
    for (const h of loan.history) {
      events.push({
        at: new Date(h.at).toISOString(),
        type: `HISTORY_${(h.action ?? "EVENT").toString()}`,
        actor: actorText(null, { byName: h.byName, byEmail: h.byEmail }) ?? undefined,
        note: h.note ?? undefined,
        amount: h.amount ?? undefined,
        utrNumber: h.utrNumber ?? undefined,
        transactionReference: h.transactionReference ?? undefined,
        fromStatus: h.fromStatus ?? undefined,
        toStatus: h.toStatus ?? undefined,
        balanceAfter: h.balanceAfter ?? undefined,
      });
    }
  }

  events.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

  return {
    loan: {
      _id: String(loan._id),
      amount: loan.amount,
      totalRepayment: loan.totalRepayment,
      paidAmount: loan.paidAmount,
      outstandingAmount: loan.outstandingAmount,
      status: loan.status,
      borrower: loan.borrowerId,
    },
    events,
  };
}

export async function getRecentLoans() {
  return Loan.find().sort({ createdAt: -1 }).limit(5).populate("borrowerId");
}

export async function listAdminUsers(input: { page?: number; limit?: number; search?: string; role?: string; maxLimit?: number }) {
  const page = Math.max(Number(input.page ?? 1), 1);
  const maxLimit = Math.max(Number(input.maxLimit ?? 100), 1);
  const limit = Math.min(Math.max(Number(input.limit ?? 10), 1), maxLimit);
  const search = typeof input.search === "string" ? input.search.trim() : "";
  const role = typeof input.role === "string" && input.role !== "ALL" ? input.role : undefined;
  const filter: Record<string, unknown> = {};

  if (role) {
    filter.role = role;
  }

  if (search) {
    filter.$or = [
      { name: { $regex: escapeRegex(search), $options: "i" } },
      { email: { $regex: escapeRegex(search), $options: "i" } },
      { phone: { $regex: escapeRegex(search), $options: "i" } },
    ];
  }

  const [items, total] = await Promise.all([
    User.find(filter)
      .select("-password -phoneVerificationToken -phoneVerificationExpires -pendingPhoneVerificationToken -pendingPhoneVerificationExpires -secondaryEmailVerificationToken -secondaryEmailVerificationExpires -resetPasswordToken -resetPasswordExpires")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  return { items, total, page, limit };
}

export async function updateAdminProfile(adminId: string, input: { name: string; phone: string; secondaryEmail?: string | null }) {
  const admin = await User.findById(adminId);
  if (!admin || admin.role !== "ADMIN") {
    throw new AppError(404, "Admin profile not found");
  }

  const normalizedPhone = canonicalizePhoneNumber(input.phone);
  const duplicate = await User.findOne({ _id: { $ne: admin._id }, phone: normalizedPhone }).select("_id").lean();
  if (duplicate) {
    throw new AppError(409, "Phone number already in use");
  }

  admin.name = input.name.trim();
  admin.phone = normalizedPhone;
  // Phone verification is optional and can be completed later.
  admin.phoneVerifiedAt = null;
  admin.phoneVerificationToken = null;
  admin.phoneVerificationExpires = null;
  admin.secondaryEmail = input.secondaryEmail?.trim() ? input.secondaryEmail.trim().toLowerCase() : null;
  admin.secondaryEmailVerifiedAt = null;
  admin.secondaryEmailVerificationToken = null;
  admin.secondaryEmailVerificationExpires = null;
  await admin.save();

  return getAdminProfile(adminId);
}

export async function exportAdminUsersCsv(input: { search?: string; role?: string }) {
  const { items } = await listAdminUsers({ page: 1, limit: 1000, maxLimit: 1000, search: input.search, role: input.role });
  return buildCsv([
    ["Name", "Email", "Phone", "Role", "Active", "Secondary Email", "Created At"],
    ...items.map((user) => [
      user.name,
      user.email,
      user.phone,
      user.role,
      user.isActive ? "Yes" : "No",
      user.secondaryEmail ?? "",
      user.createdAt.toISOString(),
    ]),
  ]);
}

export async function exportAdminLoansCsv(input: { status?: string; search?: string }) {
  const { items } = await listAdminLoans({ page: 1, limit: 1000, maxLimit: 1000, status: input.status, search: input.search });
  return buildCsv([
    ["Loan ID", "Borrower", "Amount", "Tenure", "Interest Rate", "Status", "Due Date", "Created At"],
    ...items.map((loan) => [
      String(loan._id),
      loan.borrower?.name ?? "",
      loan.amount,
      loan.tenure,
      loan.interestRate,
      loan.status,
      loan.dueDate ? new Date(loan.dueDate).toISOString() : "",
      new Date(loan.createdAt).toISOString(),
    ]),
  ]);
}

export async function exportAdminPaymentsCsv(input: { search?: string; loanStatus?: string; loanId?: string; collectorId?: string }) {
  const { items } = await listAdminPayments({ page: 1, limit: 1000, maxLimit: 1000, search: input.search, loanStatus: input.loanStatus, loanId: input.loanId, collectorId: input.collectorId });
  return buildCsv([
    ["Payment ID", "UTR", "Borrower", "Collector", "Amount", "Payment Date", "Loan Status", "Loan ID"],
    ...items.map((payment) => [
      String(payment._id),
      payment.utrNumber,
      payment.borrower?.name ?? "",
      payment.collector?.name ?? "",
      payment.amount,
      payment.paymentDate ? new Date(payment.paymentDate).toISOString() : "",
      payment.loan?.status ?? "",
      payment.loan?._id ? String(payment.loan._id) : "",
    ]),
  ]);
}

export async function getAdminDashboardOverview() {
  const months = getMonthSeries(6);
  const monthStart = new Date(`${months[0].key}-01T00:00:00.000Z`);

  const [
    totalLoans,
    activeLoans,
    closedLoans,
    usersTotal,
    disbursedLoans,
    collectionsAgg,
    statusBreakdown,
    roleBreakdown,
    loanVolumeSeries,
    collectionSeries,
    recentLoans,
  ] = await Promise.all([
    Loan.countDocuments(),
    Loan.countDocuments({ status: { $in: ["APPLIED", "SANCTIONED", "DISBURSED"] } }),
    Loan.countDocuments({ status: "CLOSED" }),
    User.countDocuments(),
    Loan.aggregate([{ $match: { status: "DISBURSED" } }, { $group: { _id: null, total: { $sum: "$totalRepayment" } } }]),
    Payment.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]),
    Loan.aggregate([{ $group: { _id: "$status", total: { $sum: 1 } } }]),
    User.aggregate([{ $group: { _id: "$role", total: { $sum: 1 } } }]),
    Loan.aggregate([
      { $match: { createdAt: { $gte: monthStart } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, total: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Payment.aggregate([
      { $match: { paymentDate: { $gte: monthStart } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$paymentDate" } }, total: { $sum: "$amount" } } },
      { $sort: { _id: 1 } },
    ]),
    Loan.find().sort({ createdAt: -1 }).limit(5).populate("borrowerId", "name email phone role"),
  ]);

  const statusMap = new Map(statusBreakdown.map((entry) => [entry._id, Number(entry.total ?? 0)]));
  const roleMap = new Map(roleBreakdown.map((entry) => [entry._id, Number(entry.total ?? 0)]));

  return {
    metrics: {
      totalLoans,
      activeLoans,
      closedLoans,
      usersTotal,
      totalDisbursed: disbursedLoans[0]?.total ?? 0,
      totalCollections: collectionsAgg[0]?.total ?? 0,
    },
    charts: {
      loanVolume: buildMonthLookup(loanVolumeSeries, months),
      collectionsTrend: buildMonthLookup(collectionSeries, months),
      loanLifecycle: [
        { name: "Applied", value: statusMap.get("APPLIED") ?? 0, color: "#d97706" },
        { name: "Sanctioned", value: statusMap.get("SANCTIONED") ?? 0, color: "#0f766e" },
        { name: "Disbursed", value: statusMap.get("DISBURSED") ?? 0, color: "#2563eb" },
        { name: "Closed", value: statusMap.get("CLOSED") ?? 0, color: "#334155" },
        { name: "Rejected", value: statusMap.get("REJECTED") ?? 0, color: "#e11d48" },
      ],
      roleBreakdown: [
        { name: "Admin", value: roleMap.get("ADMIN") ?? 0 },
        { name: "Sales", value: roleMap.get("SALES") ?? 0 },
        { name: "Sanction", value: roleMap.get("SANCTION") ?? 0 },
        { name: "Disbursement", value: roleMap.get("DISBURSEMENT") ?? 0 },
        { name: "Collection", value: roleMap.get("COLLECTION") ?? 0 },
        { name: "Borrower", value: roleMap.get("BORROWER") ?? 0 },
      ],
    },
    recentLoans,
  };
}

export async function getAdminProfile(adminId: string) {
  const admin = await User.findById(adminId).select("name email phone role isActive secondaryEmail secondaryEmailVerifiedAt phoneVerifiedAt createdAt updatedAt").lean();
  if (!admin || admin.role !== "ADMIN") {
    throw new AppError(404, "Admin profile not found");
  }

  return {
    id: String(admin._id),
    name: admin.name,
    email: admin.email,
    phone: admin.phone,
    role: admin.role,
    isActive: admin.isActive,
    secondaryEmail: admin.secondaryEmail ?? null,
    secondaryEmailVerifiedAt: admin.secondaryEmailVerifiedAt ?? null,
    phoneVerifiedAt: admin.phoneVerifiedAt ?? null,
    createdAt: admin.createdAt,
    updatedAt: admin.updatedAt,
  };
}

export async function getAdminAnalytics() {
  const months = getMonthSeries(6);
  const monthStart = new Date(`${months[0].key}-01T00:00:00.000Z`);

  const [loanVolumeSeries, collectionSeries, loanLifecycleSeries, roleBreakdown, recentPayments] = await Promise.all([
    Loan.aggregate([
      { $match: { createdAt: { $gte: monthStart } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, total: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Payment.aggregate([
      { $match: { paymentDate: { $gte: monthStart } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$paymentDate" } }, total: { $sum: "$amount" } } },
      { $sort: { _id: 1 } },
    ]),
    Loan.aggregate([{ $group: { _id: "$status", total: { $sum: 1 } } }]),
    User.aggregate([{ $group: { _id: "$role", total: { $sum: 1 } } }]),
    Payment.aggregate([
      {
        $lookup: {
          from: "loans",
          localField: "loanId",
          foreignField: "_id",
          as: "loan",
        },
      },
      { $unwind: { path: "$loan", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "users",
          localField: "collectedBy",
          foreignField: "_id",
          as: "collector",
        },
      },
      { $unwind: { path: "$collector", preserveNullAndEmptyArrays: true } },
      { $sort: { paymentDate: -1, createdAt: -1 } },
      { $limit: 8 },
      {
        $project: {
          _id: 1,
          amount: 1,
          utrNumber: 1,
          paymentDate: 1,
          createdAt: 1,
          loan: {
            _id: "$loan._id",
            status: "$loan.status",
            amount: "$loan.amount",
            borrowerId: "$loan.borrowerId",
          },
          collector: {
            _id: "$collector._id",
            name: "$collector.name",
            email: "$collector.email",
          },
        },
      },
    ]),
  ]);

  const lifecycleMap = new Map(loanLifecycleSeries.map((entry) => [entry._id, Number(entry.total ?? 0)]));
  const roleMap = new Map(roleBreakdown.map((entry) => [entry._id, Number(entry.total ?? 0)]));

  return {
    charts: {
      loanVolume: buildMonthLookup(loanVolumeSeries, months),
      collectionsTrend: buildMonthLookup(collectionSeries, months),
      loanLifecycle: [
        { name: "Applied", value: lifecycleMap.get("APPLIED") ?? 0, color: "#d97706" },
        { name: "Sanctioned", value: lifecycleMap.get("SANCTIONED") ?? 0, color: "#0f766e" },
        { name: "Disbursed", value: lifecycleMap.get("DISBURSED") ?? 0, color: "#2563eb" },
        { name: "Closed", value: lifecycleMap.get("CLOSED") ?? 0, color: "#334155" },
        { name: "Rejected", value: lifecycleMap.get("REJECTED") ?? 0, color: "#e11d48" },
        { name: "Withdrawn", value: lifecycleMap.get("WITHDRAWN") ?? 0, color: "#64748b" },
      ],
      roleBreakdown: [
        { name: "Admin", value: roleMap.get("ADMIN") ?? 0 },
        { name: "Sales", value: roleMap.get("SALES") ?? 0 },
        { name: "Sanction", value: roleMap.get("SANCTION") ?? 0 },
        { name: "Disbursement", value: roleMap.get("DISBURSEMENT") ?? 0 },
        { name: "Collection", value: roleMap.get("COLLECTION") ?? 0 },
        { name: "Borrower", value: roleMap.get("BORROWER") ?? 0 },
      ],
    },
    recentPayments,
  };
}

export async function listAdminPayments(input: { page?: number; limit?: number; search?: string; loanStatus?: string; loanId?: string; collectorId?: string; maxLimit?: number }) {
  const page = Math.max(Number(input.page ?? 1), 1);
  const maxLimit = Math.max(Number(input.maxLimit ?? 100), 1);
  const limit = Math.min(Math.max(Number(input.limit ?? 10), 1), maxLimit);
  const search = typeof input.search === "string" ? input.search.trim() : "";
  const loanStatus = typeof input.loanStatus === "string" && input.loanStatus !== "ALL" ? input.loanStatus : undefined;
  const loanId = toObjectId(typeof input.loanId === "string" ? input.loanId.trim() : undefined);
  const collectorId = toObjectId(typeof input.collectorId === "string" ? input.collectorId.trim() : undefined);
  const escapedSearch = escapeRegex(search);

  const pipeline: any[] = [
    {
      $lookup: {
        from: "loans",
        localField: "loanId",
        foreignField: "_id",
        as: "loan",
      },
    },
    { $unwind: { path: "$loan", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "users",
        localField: "loan.borrowerId",
        foreignField: "_id",
        as: "borrower",
      },
    },
    { $unwind: { path: "$borrower", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "users",
        localField: "collectedBy",
        foreignField: "_id",
        as: "collector",
      },
    },
    { $unwind: { path: "$collector", preserveNullAndEmptyArrays: true } },
  ];

  const andFilters: any[] = [];
  if (loanStatus) andFilters.push({ "loan.status": loanStatus });
  if (loanId) andFilters.push({ loanId });
  if (collectorId) andFilters.push({ collectedBy: collectorId });
  if (search) {
    andFilters.push({
      $or: [
        { utrNumber: { $regex: escapedSearch, $options: "i" } },
        { "borrower.name": { $regex: escapedSearch, $options: "i" } },
        { "borrower.email": { $regex: escapedSearch, $options: "i" } },
        { "borrower.phone": { $regex: escapedSearch, $options: "i" } },
        { "loan.status": { $regex: escapedSearch, $options: "i" } },
      ],
    });
  }

  if (andFilters.length) {
    pipeline.push({ $match: { $and: andFilters } });
  }

  const projection = {
    _id: 1,
    loanId: 1,
    amount: 1,
    utrNumber: 1,
    paymentDate: 1,
    createdAt: 1,
    updatedAt: 1,
    loan: {
      _id: "$loan._id",
      status: "$loan.status",
      amount: "$loan.amount",
      tenure: "$loan.tenure",
      dueDate: "$loan.dueDate",
    },
    borrower: {
      _id: "$borrower._id",
      name: "$borrower.name",
      email: "$borrower.email",
      phone: "$borrower.phone",
      role: "$borrower.role",
    },
    collector: {
      _id: "$collector._id",
      name: "$collector.name",
      email: "$collector.email",
      phone: "$collector.phone",
    },
  };

  const [items, totalResult] = await Promise.all([
    Payment.aggregate([...pipeline, { $sort: { paymentDate: -1, createdAt: -1 } }, { $skip: (page - 1) * limit }, { $limit: limit }, { $project: projection }] as any),
    Payment.aggregate([...pipeline, { $count: "total" }] as any),
  ]);

  return {
    items,
    total: totalResult[0]?.total ?? 0,
    page,
    limit,
  };
}

export async function listAdminDocuments(input: { page?: number; limit?: number; search?: string; borrowerId?: string; fileType?: string; loanStatus?: string; maxLimit?: number }) {
  const page = Math.max(Number(input.page ?? 1), 1);
  const maxLimit = Math.max(Number(input.maxLimit ?? 100), 1);
  const limit = Math.min(Math.max(Number(input.limit ?? 10), 1), maxLimit);
  const search = typeof input.search === "string" ? input.search.trim() : "";
  const borrowerId = toObjectId(typeof input.borrowerId === "string" ? input.borrowerId.trim() : undefined);
  const fileType = typeof input.fileType === "string" && input.fileType !== "ALL" ? input.fileType : undefined;
  const loanStatus = typeof input.loanStatus === "string" && input.loanStatus !== "ALL" ? input.loanStatus : undefined;
  const escapedSearch = escapeRegex(search);

  const pipeline: any[] = [
    {
      $lookup: {
        from: "users",
        localField: "borrowerId",
        foreignField: "_id",
        as: "borrower",
      },
    },
    { $unwind: { path: "$borrower", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "loans",
        let: { borrowerId: "$borrowerId" },
        pipeline: [
          { $match: { $expr: { $eq: ["$borrowerId", "$$borrowerId"] } } },
          { $sort: { createdAt: -1 } },
          { $limit: 1 },
          { $project: { _id: 1, status: 1, amount: 1, tenure: 1, createdAt: 1, updatedAt: 1 } },
        ],
        as: "latestLoan",
      },
    },
    { $unwind: { path: "$latestLoan", preserveNullAndEmptyArrays: true } },
  ];

  const andFilters: any[] = [];
  if (borrowerId) andFilters.push({ borrowerId });
  if (fileType) andFilters.push({ fileType });
  if (loanStatus) andFilters.push({ "latestLoan.status": loanStatus });
  if (search) {
    andFilters.push({
      $or: [
        { fileUrl: { $regex: escapedSearch, $options: "i" } },
        { fileType: { $regex: escapedSearch, $options: "i" } },
        { "borrower.name": { $regex: escapedSearch, $options: "i" } },
        { "borrower.email": { $regex: escapedSearch, $options: "i" } },
        { "borrower.phone": { $regex: escapedSearch, $options: "i" } },
      ],
    });
  }

  if (andFilters.length) {
    pipeline.push({ $match: { $and: andFilters } });
  }

  const projection = {
    _id: 1,
    borrowerId: 1,
    fileUrl: 1,
    fileType: 1,
    publicId: 1,
    uploadedAt: 1,
    createdAt: 1,
    updatedAt: 1,
    borrower: {
      _id: "$borrower._id",
      name: "$borrower.name",
      email: "$borrower.email",
      phone: "$borrower.phone",
      role: "$borrower.role",
    },
    latestLoan: {
      _id: "$latestLoan._id",
      status: "$latestLoan.status",
      amount: "$latestLoan.amount",
      tenure: "$latestLoan.tenure",
      createdAt: "$latestLoan.createdAt",
      updatedAt: "$latestLoan.updatedAt",
    },
  };

  const [items, totalResult] = await Promise.all([
    Document.aggregate([...pipeline, { $sort: { uploadedAt: -1, createdAt: -1 } }, { $skip: (page - 1) * limit }, { $limit: limit }, { $project: projection }] as any),
    Document.aggregate([...pipeline, { $count: "total" }] as any),
  ]);

  return {
    items,
    total: totalResult[0]?.total ?? 0,
    page,
    limit,
  };
}

export async function getAdminLoanReview(id: string) {
  const loan = await Loan.findById(id).populate("borrowerId sanctionedBy disbursedBy");
  if (!loan) {
    throw new AppError(404, "Loan not found");
  }

  const borrowerRef = loan.borrowerId as any;
  const borrowerId = borrowerRef?._id ? String(borrowerRef._id) : String(borrowerRef);
  if (!Types.ObjectId.isValid(borrowerId)) {
    throw new AppError(500, "Loan borrower reference is invalid");
  }

  const [borrower, profile, documents, payments] = await Promise.all([
    User.findById(borrowerId).select("name email phone role isActive secondaryEmail secondaryEmailVerifiedAt phoneVerifiedAt").lean(),
    BorrowerProfile.findOne({ userId: borrowerId }).lean(),
    Document.find({ borrowerId }).sort({ createdAt: -1 }).lean(),
    Payment.find({ loanId: loan._id }).sort({ paymentDate: -1 }).lean(),
  ]);

  return {
    loan,
    borrower: borrower
      ? {
          id: String(borrower._id),
          name: borrower.name,
          email: borrower.email,
          phone: borrower.phone,
          role: borrower.role,
          isActive: borrower.isActive,
          secondaryEmail: borrower.secondaryEmail ?? null,
          secondaryEmailVerifiedAt: borrower.secondaryEmailVerifiedAt ?? null,
          phoneVerifiedAt: borrower.phoneVerifiedAt ?? null,
        }
      : null,
    profile: profile
      ? {
          _id: String((profile as any)._id),
          pan: (profile as any).pan ?? null,
          dob: (profile as any).dob ?? null,
          salary: (profile as any).salary ?? null,
          employmentMode: (profile as any).employmentMode ?? null,
          address: (profile as any).address ?? null,
          city: (profile as any).city ?? null,
          state: (profile as any).state ?? null,
          pincode: (profile as any).pincode ?? null,
        }
      : null,
    documents: (documents ?? []).map((document: any) => ({
      _id: String(document._id),
      fileUrl: document.fileUrl ?? null,
      fileType: document.fileType ?? null,
      uploadedAt: document.uploadedAt ?? document.createdAt ?? null,
      createdAt: document.createdAt ?? null,
    })),
    payments: (payments ?? []).map((payment: any) => ({
      _id: String(payment._id),
      amount: payment.amount,
      utrNumber: payment.utrNumber,
      paymentDate: payment.paymentDate,
      createdAt: payment.createdAt,
    })),
  };
}

export async function listAdminLoans(input: { page?: number; limit?: number; status?: string; search?: string; maxLimit?: number }) {
  const page = Math.max(Number(input.page ?? 1), 1);
  const maxLimit = Math.max(Number(input.maxLimit ?? 100), 1);
  const limit = Math.min(Math.max(Number(input.limit ?? 10), 1), maxLimit);
  const status = typeof input.status === "string" && input.status !== "ALL" ? input.status : undefined;
  const search = typeof input.search === "string" ? input.search.trim() : "";
  const amountFilter = Number(search);
  const hasAmountFilter = Number.isFinite(amountFilter) && search.length > 0;
  const escapedSearch = escapeRegex(search);

  const pipeline: any[] = [];

  if (status) {
    pipeline.push({ $match: { status } });
  }

  pipeline.push(
    {
      $lookup: {
        from: "users",
        localField: "borrowerId",
        foreignField: "_id",
        as: "borrower",
      },
    },
    { $unwind: { path: "$borrower", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "documents",
        let: { borrowerRef: "$borrowerId" },
        pipeline: [
          { $match: { $expr: { $eq: ["$borrowerId", "$$borrowerRef"] } } },
          { $sort: { uploadedAt: -1, createdAt: -1 } },
          { $limit: 1 },
          { $project: { _id: 0, fileUrl: 1, fileType: 1 } },
        ],
        as: "latestProof",
      },
    },
    { $unwind: { path: "$latestProof", preserveNullAndEmptyArrays: true } },
  );

  if (search) {
    pipeline.push({
      $match: {
        $or: [
          { "borrower.name": { $regex: escapedSearch, $options: "i" } },
          { "borrower.email": { $regex: escapedSearch, $options: "i" } },
          { "borrower.phone": { $regex: escapedSearch, $options: "i" } },
          { status: { $regex: escapedSearch, $options: "i" } },
          ...(hasAmountFilter ? [{ amount: amountFilter }, { totalRepayment: amountFilter }] : []),
        ],
      },
    });
  }

  const projection = {
    _id: 1,
    amount: 1,
    tenure: 1,
    interestRate: 1,
    interestAmount: 1,
    totalRepayment: 1,
    paidAmount: 1,
    outstandingAmount: 1,
    status: 1,
    rejectionReason: 1,
    sanctionNotes: 1,
    transactionReference: 1,
    disbursementProofUrl: 1,
    disbursementDate: 1,
    dueDate: 1,
    createdAt: 1,
    updatedAt: 1,
    proofFileUrl: "$latestProof.fileUrl",
    proofFileType: "$latestProof.fileType",
    borrower: {
      _id: "$borrower._id",
      name: "$borrower.name",
      email: "$borrower.email",
      phone: "$borrower.phone",
      role: "$borrower.role",
    },
  };

  const [items, totalResult] = await Promise.all([
    Loan.aggregate([...pipeline, { $sort: { createdAt: -1 } }, { $skip: (page - 1) * limit }, { $limit: limit }, { $project: projection }] as any),
    Loan.aggregate([...pipeline, { $count: "total" }] as any),
  ]);

  return {
    items,
    total: totalResult[0]?.total ?? 0,
    page,
    limit,
  };
}


