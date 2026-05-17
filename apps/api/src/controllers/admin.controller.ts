import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/async.middleware.js";
import { User } from "../models/User.js";
import { sendResponse } from "../utils/response.js";
import { AppError } from "../utils/app-error.js";
import {
  exportAdminLoansCsv,
  exportAdminPaymentsCsv,
  exportAdminUsersCsv,
  getAdminAnalytics,
  getAdminDashboardOverview,
  getAdminLoanReview,
  getAdminProfile,
  listAdminDocuments,
  listAdminUsers,
  listAdminLoans,
  listAdminPayments,
  updateAdminProfile,
} from "../services/dashboard.service.js";

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const data = await listAdminUsers({
    page: Number(req.query.page ?? 1),
    limit: Number(req.query.limit ?? 10),
    search: typeof req.query.search === "string" ? req.query.search : undefined,
    role: typeof req.query.role === "string" ? req.query.role : undefined,
  });
  sendResponse(res, 200, { message: "Users fetched", data: data.items, meta: { total: data.total, page: data.page, limit: data.limit } });
});

export const changeRole = asyncHandler(async (req: Request, res: Response) => {
  throw new AppError(403, "User roles are fixed and cannot be changed");
});

export const dashboard = asyncHandler(async (_req: Request, res: Response) => {
  const data = await getAdminDashboardOverview();
  sendResponse(res, 200, { message: "Admin dashboard fetched", data });
});

export const profile = asyncHandler(async (req: Request, res: Response) => {
  const data = await getAdminProfile(req.user!.id);
  sendResponse(res, 200, { message: "Admin profile fetched", data });
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const data = await updateAdminProfile(req.user!.id, {
    name: req.body.name,
    phone: req.body.phone,
    secondaryEmail: req.body.secondaryEmail === "" ? null : req.body.secondaryEmail ?? null,
  });
  sendResponse(res, 200, { message: "Admin profile updated", data });
});

export const analytics = asyncHandler(async (_req: Request, res: Response) => {
  const data = await getAdminAnalytics();
  sendResponse(res, 200, { message: "Admin analytics fetched", data });
});

export const payments = asyncHandler(async (req: Request, res: Response) => {
  const data = await listAdminPayments({
    page: Number(req.query.page ?? 1),
    limit: Number(req.query.limit ?? 10),
    search: typeof req.query.search === "string" ? req.query.search : undefined,
    loanStatus: typeof req.query.loanStatus === "string" ? req.query.loanStatus : undefined,
    loanId: typeof req.query.loanId === "string" ? req.query.loanId : undefined,
    collectorId: typeof req.query.collectorId === "string" ? req.query.collectorId : undefined,
  });

  sendResponse(res, 200, { message: "Admin payments fetched", data: data.items, meta: { total: data.total, page: data.page, limit: data.limit } });
});

export const documents = asyncHandler(async (req: Request, res: Response) => {
  const data = await listAdminDocuments({
    page: Number(req.query.page ?? 1),
    limit: Number(req.query.limit ?? 10),
    search: typeof req.query.search === "string" ? req.query.search : undefined,
    borrowerId: typeof req.query.borrowerId === "string" ? req.query.borrowerId : undefined,
    fileType: typeof req.query.fileType === "string" ? req.query.fileType : undefined,
    loanStatus: typeof req.query.loanStatus === "string" ? req.query.loanStatus : undefined,
  });

  sendResponse(res, 200, { message: "Admin documents fetched", data: data.items, meta: { total: data.total, page: data.page, limit: data.limit } });
});

export const loanReview = asyncHandler(async (req: Request, res: Response) => {
  const loanId = typeof req.params.id === "string" ? req.params.id : req.params.id[0];
  const data = await getAdminLoanReview(loanId);
  sendResponse(res, 200, { message: "Loan review fetched", data });
});

export const loans = asyncHandler(async (req: Request, res: Response) => {
  const data = await listAdminLoans({
    page: Number(req.query.page ?? 1),
    limit: Number(req.query.limit ?? 10),
    status: typeof req.query.status === "string" ? req.query.status : undefined,
    search: typeof req.query.search === "string" ? req.query.search : undefined,
  });
  sendResponse(res, 200, { message: "Admin loans fetched", data: data.items, meta: { total: data.total, page: data.page, limit: data.limit } });
});

function attachCsv(res: Response, filename: string, csv: string) {
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.status(200).send(csv);
}

export const exportUsers = asyncHandler(async (req: Request, res: Response) => {
  const csv = await exportAdminUsersCsv({
    search: typeof req.query.search === "string" ? req.query.search : undefined,
    role: typeof req.query.role === "string" ? req.query.role : undefined,
  });
  attachCsv(res, "admin-users.csv", csv);
});

export const exportLoans = asyncHandler(async (req: Request, res: Response) => {
  const csv = await exportAdminLoansCsv({
    search: typeof req.query.search === "string" ? req.query.search : undefined,
    status: typeof req.query.status === "string" ? req.query.status : undefined,
  });
  attachCsv(res, "admin-loans.csv", csv);
});

export const exportPayments = asyncHandler(async (req: Request, res: Response) => {
  const csv = await exportAdminPaymentsCsv({
    search: typeof req.query.search === "string" ? req.query.search : undefined,
    loanStatus: typeof req.query.loanStatus === "string" ? req.query.loanStatus : undefined,
    loanId: typeof req.query.loanId === "string" ? req.query.loanId : undefined,
    collectorId: typeof req.query.collectorId === "string" ? req.query.collectorId : undefined,
  });
  attachCsv(res, "admin-payments.csv", csv);
});
