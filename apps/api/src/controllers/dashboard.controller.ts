import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/async.middleware.js";
import {
  createCollectionPayment,
  decideSanctionApplication,
  getDashboardStats,
  getExecutiveProfile,
  getExecutiveWorkspace,
  getRecentLoans,
  getLoanTimeline,
  listCollectionLoans,
  listCollectionHistory,
  listCollectionPayments,
  listDisbursementHistory,
  listDisbursementLoans,
  exportCollectionHistoryCsv,
  exportDisbursementHistoryCsv,
  listSalesBorrowers,
  listSanctionApplications,
  listSanctionHistory,
  markDisbursed,
  updateExecutiveProfile,
  exportCollectionPaymentsCsv,
  exportDisbursementLoansCsv,
  exportSalesBorrowersCsv,
  exportSanctionLoansCsv,
  exportSanctionHistoryCsv,
  uploadDisbursementProof,
} from "../services/dashboard.service.js";
import { sendResponse } from "../utils/response.js";

function attachCsv(res: Response, filename: string, csv: string) {
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.status(200).send(csv);
}

export const stats = asyncHandler(async (_req: Request, res: Response) => {
  const data = await getDashboardStats();
  sendResponse(res, 200, { message: "Dashboard stats fetched", data });
});

export const recentLoans = asyncHandler(async (_req: Request, res: Response) => {
  const data = await getRecentLoans();
  sendResponse(res, 200, { message: "Recent loans fetched", data });
});

export const workspace = asyncHandler(async (req: Request, res: Response) => {
  const data = await getExecutiveWorkspace(req.user!.role as "SALES" | "SANCTION" | "DISBURSEMENT" | "COLLECTION");
  sendResponse(res, 200, { message: "Workspace fetched", data });
});

export const profile = asyncHandler(async (req: Request, res: Response) => {
  const data = await getExecutiveProfile(req.user!.id);
  sendResponse(res, 200, { message: "Profile fetched", data });
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const data = await updateExecutiveProfile(req.user!.id, {
    name: req.body.name,
    phone: req.body.phone,
    secondaryEmail: req.body.secondaryEmail === "" ? null : req.body.secondaryEmail ?? null,
  });
  sendResponse(res, 200, { message: "Profile updated", data });
});

export const salesBorrowers = asyncHandler(async (req: Request, res: Response) => {
  const data = await listSalesBorrowers({
    page: Number(req.query.page ?? 1),
    limit: Number(req.query.limit ?? 10),
    search: typeof req.query.search === "string" ? req.query.search : undefined,
    status: typeof req.query.status === "string" ? req.query.status : undefined,
  });
  sendResponse(res, 200, { message: "Sales borrowers fetched", data: data.items, meta: { total: data.total, page: data.page, limit: data.limit } });
});

export const sanctionApplications = asyncHandler(async (req: Request, res: Response) => {
  const data = await listSanctionApplications({
    page: Number(req.query.page ?? 1),
    limit: Number(req.query.limit ?? 10),
    search: typeof req.query.search === "string" ? req.query.search : undefined,
    status: typeof req.query.status === "string" ? req.query.status : undefined,
  });
  sendResponse(res, 200, { message: "Sanction applications fetched", data: data.items, meta: { total: data.total, page: data.page, limit: data.limit } });
});

export const sanctionDecision = asyncHandler(async (req: Request, res: Response) => {
  const data = await decideSanctionApplication({
    loanId: String(req.params.loanId),
    actorId: req.user!.id,
    decision: req.body.decision,
    reason: req.body.reason,
    notes: req.body.notes,
  });
  sendResponse(res, 200, { message: req.body.decision === "APPROVE" ? "Loan sanctioned" : "Loan rejected", data });
});

export const disbursementLoans = asyncHandler(async (req: Request, res: Response) => {
  const data = await listDisbursementLoans({
    page: Number(req.query.page ?? 1),
    limit: Number(req.query.limit ?? 10),
    search: typeof req.query.search === "string" ? req.query.search : undefined,
  });
  sendResponse(res, 200, { message: "Sanctioned loans fetched", data: data.items, meta: { total: data.total, page: data.page, limit: data.limit } });
});

export const disbursementHistory = asyncHandler(async (req: Request, res: Response) => {
  const data = await listDisbursementHistory({
    page: Number(req.query.page ?? 1),
    limit: Number(req.query.limit ?? 25),
    fromDate: typeof req.query.fromDate === "string" ? req.query.fromDate : undefined,
    toDate: typeof req.query.toDate === "string" ? req.query.toDate : undefined,
    search: typeof req.query.search === "string" ? req.query.search : undefined,
  });
  sendResponse(res, 200, { message: "Disbursement history fetched", data: data.items, meta: { total: data.total, page: data.page, limit: data.limit } });
});

export const disbursementHistoryExport = asyncHandler(async (req: Request, res: Response) => {
  const csv = await exportDisbursementHistoryCsv({ fromDate: typeof req.query.fromDate === "string" ? req.query.fromDate : undefined, toDate: typeof req.query.toDate === "string" ? req.query.toDate : undefined, search: typeof req.query.search === "string" ? req.query.search : undefined });
  attachCsv(res, "disbursement-history.csv", csv);
});

export const sanctionHistory = asyncHandler(async (req: Request, res: Response) => {
  const data = await listSanctionHistory({
    page: Number(req.query.page ?? 1),
    limit: Number(req.query.limit ?? 25),
    fromDate: typeof req.query.fromDate === "string" ? req.query.fromDate : undefined,
    toDate: typeof req.query.toDate === "string" ? req.query.toDate : undefined,
    search: typeof req.query.search === "string" ? req.query.search : undefined,
    action: typeof req.query.action === "string" ? (req.query.action.toUpperCase() as "APPROVED" | "REJECTED" | "ALL") : undefined,
  });
  sendResponse(res, 200, { message: "Sanction history fetched", data: data.items, meta: { total: data.total, page: data.page, limit: data.limit } });
});

export const sanctionHistoryExport = asyncHandler(async (req: Request, res: Response) => {
  const csv = await exportSanctionHistoryCsv({
    fromDate: typeof req.query.fromDate === "string" ? req.query.fromDate : undefined,
    toDate: typeof req.query.toDate === "string" ? req.query.toDate : undefined,
    search: typeof req.query.search === "string" ? req.query.search : undefined,
    action: typeof req.query.action === "string" ? (req.query.action.toUpperCase() as "APPROVED" | "REJECTED" | "ALL") : undefined,
  });
  attachCsv(res, "sanction-history.csv", csv);
});

export const disburseLoanModule = asyncHandler(async (req: Request, res: Response) => {
  const data = await markDisbursed({
    loanId: String(req.params.loanId),
    actorId: req.user!.id,
    transactionReference: req.body.transactionReference,
    disbursementDate: req.body.disbursementDate,
    proofUrl: req.body.proofUrl,
  });
  sendResponse(res, 200, { message: "Loan marked as disbursed", data });
});

export const disbursementProofUpload = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    return sendResponse(res, 400, { message: "Proof file is required" });
  }
  const data = await uploadDisbursementProof({ loanId: String(req.params.loanId), file: req.file });
  sendResponse(res, 200, { message: "Disbursement proof uploaded", data });
});

export const collectionLoans = asyncHandler(async (req: Request, res: Response) => {
  const data = await listCollectionLoans({
    page: Number(req.query.page ?? 1),
    limit: Number(req.query.limit ?? 10),
    search: typeof req.query.search === "string" ? req.query.search : undefined,
  });
  sendResponse(res, 200, { message: "Collection loans fetched", data: data.items, meta: { total: data.total, page: data.page, limit: data.limit } });
});

export const collectionAddPayment = asyncHandler(async (req: Request, res: Response) => {
  const data = await createCollectionPayment({
    loanId: req.body.loanId,
    amount: req.body.amount,
    utrNumber: req.body.utrNumber,
    paymentDate: req.body.paymentDate,
    collectedBy: req.user!.id,
  });
  sendResponse(res, 201, { message: "Payment recorded", data });
});

export const collectionPayments = asyncHandler(async (req: Request, res: Response) => {
  const data = await listCollectionPayments({
    page: Number(req.query.page ?? 1),
    limit: Number(req.query.limit ?? 10),
    loanId: typeof req.query.loanId === "string" ? req.query.loanId : undefined,
    search: typeof req.query.search === "string" ? req.query.search : undefined,
  });
  sendResponse(res, 200, { message: "Collection payments fetched", data: data.items, meta: { total: data.total, page: data.page, limit: data.limit } });
});

export const collectionHistory = asyncHandler(async (req: Request, res: Response) => {
  const data = await listCollectionHistory({
    page: Number(req.query.page ?? 1),
    limit: Number(req.query.limit ?? 25),
    fromDate: typeof req.query.fromDate === "string" ? req.query.fromDate : undefined,
    toDate: typeof req.query.toDate === "string" ? req.query.toDate : undefined,
    search: typeof req.query.search === "string" ? req.query.search : undefined,
  });
  sendResponse(res, 200, { message: "Collection history fetched", data: data.items, meta: { total: data.total, page: data.page, limit: data.limit } });
});

export const collectionHistoryExport = asyncHandler(async (req: Request, res: Response) => {
  const csv = await exportCollectionHistoryCsv({ fromDate: typeof req.query.fromDate === "string" ? req.query.fromDate : undefined, toDate: typeof req.query.toDate === "string" ? req.query.toDate : undefined, search: typeof req.query.search === "string" ? req.query.search : undefined });
  attachCsv(res, "collection-history.csv", csv);
});

export const salesBorrowersExport = asyncHandler(async (req: Request, res: Response) => {
  const csv = await exportSalesBorrowersCsv({
    search: typeof req.query.search === "string" ? req.query.search : undefined,
    status: typeof req.query.status === "string" ? req.query.status : undefined,
  });
  attachCsv(res, "sales-borrowers.csv", csv);
});

export const sanctionLoansExport = asyncHandler(async (req: Request, res: Response) => {
  const csv = await exportSanctionLoansCsv({
    search: typeof req.query.search === "string" ? req.query.search : undefined,
    status: typeof req.query.status === "string" ? req.query.status : undefined,
  });
  attachCsv(res, "sanction-loans.csv", csv);
});

export const disbursementLoansExport = asyncHandler(async (req: Request, res: Response) => {
  const csv = await exportDisbursementLoansCsv({
    search: typeof req.query.search === "string" ? req.query.search : undefined,
  });
  attachCsv(res, "disbursement-loans.csv", csv);
});

export const collectionPaymentsExport = asyncHandler(async (req: Request, res: Response) => {
  const csv = await exportCollectionPaymentsCsv({
    search: typeof req.query.search === "string" ? req.query.search : undefined,
    loanId: typeof req.query.loanId === "string" ? req.query.loanId : undefined,
  });
  attachCsv(res, "collection-payments.csv", csv);
});

export const loanTimeline = asyncHandler(async (req: Request, res: Response) => {
  const data = await getLoanTimeline(String(req.params.loanId));
  sendResponse(res, 200, { message: "Loan timeline fetched", data });
});
